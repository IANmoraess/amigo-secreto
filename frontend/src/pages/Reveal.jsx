import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { CircleCheck, EyeOff, Gift } from 'lucide-react';
import Alert from '../components/Alert.jsx';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import GiftIllustration from '../components/GiftIllustration.jsx';
import GiftTag from '../components/GiftTag.jsx';
import SnowmanIllustration from '../components/SnowmanIllustration.jsx';
import Spinner from '../components/Spinner.jsx';
import { getErrorMessage, participantApi } from '../services/api.js';
import { clearParticipantToken, saveParticipantToken } from '../services/participantSession.js';

const CHARGE_DURATION_MS = 1350;
const FLASH_RELEASE_MS = 650;
const CLOSE_DURATION_MS = 940;
const TAG_TUCK_MS = 620;

// Poses da "folha soprada" ao longo do percurso (t de 0 a 1)
const TAG_POSES = [
  { t: 0, rot: 0, rx: 0, ry: 0, sx: 0, sy: 0, s: 1, o: 1 },
  { t: 0.22, rot: -5, rx: 10, ry: -12, sx: -4.5, sy: 2.5, s: 0.84, o: 1 },
  { t: 0.48, rot: -13, rx: 24, ry: -18, sx: -7.5, sy: 4, s: 0.5, o: 1 },
  { t: 0.74, rot: -21, rx: 38, ry: 10, sx: 3.5, sy: -2.5, s: 0.22, o: 1 },
  { t: 0.97, rot: -26, rx: 48, ry: 4, sx: -2, sy: 1, s: 0.08, o: 1 },
  { t: 1, rot: -28, rx: 54, ry: 0, sx: 0, sy: 0, s: 0.04, o: 0 },
];

function poseAt(t) {
  const i = Math.max(1, TAG_POSES.findIndex((p) => p.t >= t));
  const a = TAG_POSES[i - 1];
  const b = TAG_POSES[i];
  const k = (t - a.t) / (b.t - a.t || 1);
  const out = {};
  for (const key of Object.keys(a)) out[key] = a[key] + (b[key] - a[key]) * k;
  return out;
}

function bezier(p0, p1, p2, p3, t) {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
}

/**
 * Anima a etiqueta numa trajetória em "C invertido" (curva de Bézier cúbica)
 * partindo exatamente da posição atual até o centro da abertura do presente.
 */
function animateTagIntoGift(tagEl, giftEl) {
  if (!tagEl || !giftEl || !tagEl.animate) return;
  const tag = tagEl.getBoundingClientRect();
  const gift = giftEl.getBoundingClientRect();
  const dx = gift.left + gift.width / 2 - (tag.left + tag.width / 2);
  const dy = gift.top + gift.height * 0.42 - (tag.top + tag.height / 2);
  const reach = Math.max(120, tag.width * 0.45);

  // P0 origem real · P1 segue para a direita · P2 curva ampla para cima · P3 abertura
  const xs = [0, reach, reach * 1.1, dx];
  const ys = [0, 0, dy * 0.8, dy];

  const frames = [];
  const steps = 30;
  for (let n = 0; n <= steps; n += 1) {
    const t = n / steps;
    const x = bezier(...xs, t);
    const y = bezier(...ys, t);
    const p = poseAt(t);
    frames.push({
      offset: t,
      opacity: p.o,
      transform: `translate(${x}px, ${y}px) perspective(650px) rotate(${p.rot}deg) rotateX(${p.rx}deg) rotateY(${p.ry}deg) skewX(${p.sx}deg) skewY(${p.sy}deg) scale(${p.s})`,
    });
  }
  tagEl.animate(frames, {
    duration: TAG_TUCK_MS,
    easing: 'cubic-bezier(0.55, 0, 0.78, 0.72)',
    fill: 'forwards',
  });
}

function extractToken(paramToken, hash) {
  if (paramToken) return paramToken;
  const rawHash = (hash || '').replace(/^#/, '');
  if (!rawHash) return '';
  try {
    return decodeURIComponent(rawHash);
  } catch {
    return '';
  }
}

function waitMs(duration) {
  return new Promise((resolve) => setTimeout(resolve, duration));
}

export default function Reveal() {
  const { token: paramToken } = useParams();
  const location = useLocation();
  const token = extractToken(paramToken, location.hash);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [access, setAccess] = useState(null);
  const [receiverName, setReceiverName] = useState(null);
  const [showResultTag, setShowResultTag] = useState(false);
  const giftRef = useRef(null);
  const [revealPhase, setRevealPhase] = useState('idle'); // idle | charging | opening | opened | closing
  const [revealError, setRevealError] = useState('');
  const resultRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    participantApi
      .getAccess(token)
      .then((data) => {
        if (!active) return;
        saveParticipantToken(token);
        setAccess(data);
        setStatus('ready');
      })
      .catch(() => {
        if (!active) return;
        clearParticipantToken();
        setStatus('error');
      });

    return () => {
      active = false;
    };
  }, [token]);

  // Leva o foco ao ticket assim que ele aparece (útil para leitores de tela).
  useEffect(() => {
    if (receiverName) resultRef.current?.focus();
  }, [receiverName]);

  async function handleReveal() {
    if (revealPhase !== 'idle' || receiverName) return;
    setRevealPhase('charging');
    setRevealError('');
    try {
      const revealPromise = participantApi.reveal(token);
      const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

      if (prefersReducedMotion) {
        const data = await revealPromise;
        if (!mountedRef.current) return;
        setReceiverName(data.receiverName);
        setShowResultTag(true);
        setRevealPhase('opened');
        return;
      }

      // 1) Progressão de acúmulo de energia e tremor (~1,35s) em paralelo com a API real
      const [data] = await Promise.all([revealPromise, waitMs(CHARGE_DURATION_MS)]);
      if (!mountedRef.current) return;

      // 2) Liberação da tampa e expansão gradual da luz vertical em destaque (~0,65s -> total ~2s)
      setRevealPhase('opening');
      await waitMs(FLASH_RELEASE_MS);
      if (!mountedRef.current) return;

      // 3) Revela o ticket e reduz suavemente o presente para destacar o nome sorteado
      setReceiverName(data.receiverName);
      setShowResultTag(true);
      setRevealPhase('opened');
    } catch (error) {
      if (!mountedRef.current) return;
      setRevealError(getErrorMessage(error));
      setRevealPhase('idle');
    }
  }

  async function handleHide() {
    if (!showResultTag || revealPhase === 'closing') return;
    // Oculta imediatamente o nome sorteado por privacidade antes de animar a etiqueta
    setReceiverName(null);
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (prefersReducedMotion) {
      setShowResultTag(false);
      setRevealPhase('idle');
      return;
    }
    setRevealPhase('closing');
    animateTagIntoGift(resultRef.current, giftRef.current);
    await waitMs(CLOSE_DURATION_MS);
    if (!mountedRef.current) return;
    setShowResultTag(false);
    setRevealPhase('idle');
  }

  if (status === 'loading') {
    return (
      <Card className="flex flex-col items-center gap-3 py-12 text-center text-pine-800">
        <title>Verificando link · Amigo Secreto</title>
        <Spinner label="Preparando seu sorteio" className="[--size:2rem]" />
        <p className="text-charcoal-soft">Preparando seu sorteio…</p>
      </Card>
    );
  }

  if (status === 'error') {
    return (
      <Card className="space-y-5 py-8 text-center">
        <title>Sorteio indisponível · Amigo Secreto</title>
        <SnowmanIllustration className="mx-auto h-36 w-36 sm:h-44 sm:w-44" />
        <div className="space-y-2">
          <h1 className="text-xl font-bold tracking-tight text-pine-900 sm:text-2xl">
            Ops! Este sorteio não está disponível
          </h1>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-charcoal-soft">
            O link pode ter sido encerrado ou copiado pela metade. Se precisar, fale com quem
            organizou o grupo.
          </p>
        </div>
        <div>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl border border-mint-200 bg-surface-elevated px-4 py-2 text-sm font-semibold text-pine-900 transition-colors hover:bg-mint-50 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-pine-700"
          >
            Voltar para a página inicial
          </Link>
        </div>
      </Card>
    );
  }

  const isRevealedNow = showResultTag;
  const isClosing = revealPhase === 'closing';
  const isBusyOpening = revealPhase === 'charging' || revealPhase === 'opening';
  const giftState =
    revealPhase === 'opening' || revealPhase === 'opened'
      ? 'opened'
      : revealPhase === 'closing'
        ? 'closing'
        : revealPhase === 'charging'
          ? 'charging'
          : 'idle';

  return (
    <Card className="relative overflow-hidden text-center">
      <title>{`${access.eventName} · Amigo Secreto`}</title>

      <span className="inline-flex items-center rounded-full bg-berry-50 px-3.5 py-1 text-xs font-semibold tracking-wide text-berry-700 uppercase">
        {access.eventName}
      </span>

      <h1 className="mt-3 text-3xl font-bold tracking-tight text-pine-900 sm:text-4xl">
        Olá, {access.participantName}!
      </h1>

      {/* Presente protagonista: maior e imponente antes/durante a abertura; reduz suavemente quando o ticket aparece */}
      <div
        className={`relative z-10 mx-auto flex items-center justify-center transition-[margin] duration-500 ${
          isRevealedNow || revealPhase === 'closing' ? 'mt-4 mb-2' : 'mt-6 mb-4'
        }`}
      >
        <div
          ref={giftRef}
          className={`group relative flex items-center justify-center rounded-3xl p-2 transition-transform duration-300 ${
            revealPhase === 'idle' || isRevealedNow ? 'hover:scale-[1.03] active:scale-[0.98]' : ''
          }`}
        >
          <GiftIllustration
            variant="hero"
            state={giftState}
            className={`max-w-full transition-[width,height] duration-500 ease-out ${
              isRevealedNow || revealPhase === 'closing'
                ? 'h-32 w-32 sm:h-36 sm:w-36'
                : 'h-60 w-60 sm:h-72 sm:w-72'
            }`}
          />

          <button
            type="button"
            onClick={isRevealedNow ? handleHide : handleReveal}
            disabled={!isRevealedNow && (isBusyOpening || revealPhase === 'closing')}
            aria-label={
              isRevealedNow
                ? 'Fechar presente e esconder resultado'
                : access.hasRevealed
                  ? 'Abrir presente para ver seu amigo secreto novamente'
                  : 'Abrir presente para revelar seu amigo secreto'
            }
            className="absolute inset-0 cursor-pointer rounded-3xl focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-pine-700 disabled:cursor-wait"
          />
        </div>
      </div>

      {isRevealedNow ? (
        <div className="relative mt-2">
          <h2
            id="resultado"
            className={`text-sm font-semibold text-charcoal-soft transition-opacity duration-150 ${
              isClosing ? 'opacity-0' : 'opacity-100'
            }`}
          >
            Seu amigo secreto é
          </h2>

          <GiftTag
            ref={resultRef}
            receiverName={receiverName}
            closing={isClosing}
            ariaLabelledBy="resultado"
          />

          <p
            className={`mt-5 text-sm leading-relaxed text-charcoal-soft transition-opacity duration-150 ${
              isClosing ? 'opacity-0' : 'opacity-100'
            }`}
          >
            Guarde segredo! Você pode abrir este mesmo link sempre que precisar consultar de novo.
          </p>

          <div
            className={`mt-4 transition-opacity duration-150 ${
              isClosing ? 'pointer-events-none opacity-0' : 'opacity-100'
            }`}
          >
            <button
              type="button"
              onClick={handleHide}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-sage/45 bg-warm-white/60 px-4 py-1.5 text-xs font-medium text-charcoal-soft transition hover:border-sage hover:bg-cream hover:text-pine-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine-700"
            >
              <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
              Fechar presente
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {access.hasRevealed ? (
            <div role="status" className="mx-auto max-w-sm space-y-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-pine-50 px-3 py-1 text-xs font-semibold text-pine-800">
                <CircleCheck className="h-3.5 w-3.5 text-pine-700" aria-hidden="true" />
                Sorteio já consultado
              </span>
              <p className="text-sm leading-relaxed text-charcoal-soft">
                Esqueceu quem tirou? Toque no presente ou no botão abaixo para ver novamente.
              </p>
            </div>
          ) : (
            <p className="mx-auto max-w-prose text-charcoal-soft">
              Seu presente está pronto. Quando ninguém estiver olhando a sua tela, toque nele ou no
              botão abaixo para descobrir quem você tirou.
            </p>
          )}

          {revealError && <Alert type="error">{revealError}</Alert>}

          <Button
            variant="cranberry"
            onClick={handleReveal}
            loading={isBusyOpening}
            loadingLabel="Abrindo presente"
            className="w-full sm:w-auto"
          >
            {!isBusyOpening && <Gift className="h-5 w-5" aria-hidden="true" />}
            {access.hasRevealed ? 'Ver amigo secreto' : 'Abrir meu presente'}
          </Button>
        </div>
      )}
    </Card>
  );
}
