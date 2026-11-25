import { useEffect, useRef, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { CircleCheck, Gift } from 'lucide-react';
import Alert from '../components/Alert.jsx';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import GiftIllustration from '../components/GiftIllustration.jsx';
import GiftTag from '../components/GiftTag.jsx';
import Spinner from '../components/Spinner.jsx';
import { getErrorMessage, participantApi } from '../services/api.js';

const CHARGE_DURATION_MS = 1350;
const FLASH_RELEASE_MS = 650;

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
  const [loadError, setLoadError] = useState('');
  const [receiverName, setReceiverName] = useState(null);
  const [revealPhase, setRevealPhase] = useState('idle'); // idle | charging | opening | opened
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
        setAccess(data);
        setStatus('ready');
      })
      .catch((error) => {
        if (!active) return;
        setLoadError(getErrorMessage(error));
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
      setRevealPhase('opened');
    } catch (error) {
      if (!mountedRef.current) return;
      setRevealError(getErrorMessage(error));
      setRevealPhase('idle');
    }
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
      <Card className="space-y-4 text-center">
        <title>Link indisponível · Amigo Secreto</title>
        <GiftIllustration variant="single" className="mx-auto h-20 w-20 opacity-60" />
        <h1 className="text-2xl font-bold tracking-tight text-pine-900">
          Não foi possível abrir este link
        </h1>
        <Alert type="error">{loadError}</Alert>
        <p className="text-sm text-charcoal-soft">
          Confira se o link foi copiado por completo. Se o problema continuar, fale com quem
          organizou o amigo secreto.
        </p>
      </Card>
    );
  }

  const isRevealedNow = Boolean(receiverName);
  const isBusyOpening = revealPhase === 'charging' || revealPhase === 'opening';
  const giftState =
    revealPhase === 'opening' || revealPhase === 'opened'
      ? 'opened'
      : revealPhase === 'charging'
        ? 'charging'
        : 'idle';

  return (
    <Card className="relative overflow-hidden text-center">
      <title>{`${access.eventName} · Amigo Secreto`}</title>

      <span className="inline-flex items-center rounded-full bg-berry-50 px-3.5 py-1 text-xs font-semibold tracking-wide text-berry-700 uppercase">
        {access.eventName}
      </span>

      <h1 className="mt-3 text-2xl font-bold tracking-tight text-pine-900 sm:text-3xl">
        Olá, {access.participantName}!
      </h1>

      {/* Presente protagonista: maior e imponente antes/durante a abertura; reduz suavemente quando o ticket aparece */}
      <div
        className={`mx-auto flex items-center justify-center transition-[margin] duration-500 ${
          isRevealedNow ? 'mt-4 mb-2' : 'mt-6 mb-4'
        }`}
      >
        <div
          className={`group relative flex items-center justify-center rounded-3xl p-2 transition-transform duration-300 ${
            revealPhase === 'idle' ? 'hover:scale-[1.03] active:scale-[0.98]' : ''
          }`}
        >
          <GiftIllustration
            variant="hero"
            state={giftState}
            className={`max-w-full transition-[width,height] duration-500 ease-out ${
              isRevealedNow ? 'h-32 w-32 sm:h-36 sm:w-36' : 'h-60 w-60 sm:h-72 sm:w-72'
            }`}
          />

          {!isRevealedNow && (
            <button
              type="button"
              onClick={handleReveal}
              disabled={isBusyOpening}
              aria-label={
                access.hasRevealed
                  ? 'Abrir presente para ver seu amigo secreto novamente'
                  : 'Abrir presente para revelar seu amigo secreto'
              }
              className="absolute inset-0 cursor-pointer rounded-3xl focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-pine-700 disabled:cursor-wait"
            />
          )}
        </div>
      </div>

      {isRevealedNow ? (
        <div className="relative mt-2">
          <h2 id="resultado" className="text-sm font-semibold text-charcoal-soft">
            Seu amigo secreto é
          </h2>

          <GiftTag
            ref={resultRef}
            receiverName={receiverName}
            ariaLabelledBy="resultado"
          />

          <p className="mt-5 text-sm leading-relaxed text-charcoal-soft">
            Guarde segredo! Você pode abrir este mesmo link sempre que precisar consultar de novo.
          </p>
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
            {access.hasRevealed ? 'Ver meu amigo secreto novamente' : 'Abrir meu presente'}
          </Button>
        </div>
      )}
    </Card>
  );
}
