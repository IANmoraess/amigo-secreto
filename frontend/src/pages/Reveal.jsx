import { useEffect, useRef, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { Gift } from 'lucide-react';
import Alert from '../components/Alert.jsx';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import DrawTicket from '../components/DrawTicket.jsx';
import GiftIllustration from '../components/GiftIllustration.jsx';
import Spinner from '../components/Spinner.jsx';
import { getErrorMessage, participantApi } from '../services/api.js';

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

function FestiveConfetti() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-28 overflow-hidden">
      <span
        style={{ '--confetti-delay': 0 }}
        className="confetti-piece absolute top-5 left-[10%] h-2.5 w-2.5 rotate-12 rounded-xs bg-berry-600/80"
      />
      <span
        style={{ '--confetti-delay': 1 }}
        className="confetti-piece absolute top-11 left-[20%] h-2 w-2 rounded-full bg-gold-500"
      />
      <span
        style={{ '--confetti-delay': 2 }}
        className="confetti-piece absolute top-4 right-[18%] h-2.5 w-2.5 -rotate-12 rounded-xs bg-pine-700/75"
      />
      <span
        style={{ '--confetti-delay': 3 }}
        className="confetti-piece absolute top-12 right-[10%] h-2 w-3 rotate-45 rounded-xs bg-mint-200"
      />
      <span
        style={{ '--confetti-delay': 4 }}
        className="confetti-piece absolute top-18 left-[14%] h-2 w-2 -rotate-12 rounded-xs bg-gold-400"
      />
      <span
        style={{ '--confetti-delay': 5 }}
        className="confetti-piece absolute top-6 left-[34%] h-2 w-2 rounded-full bg-berry-600/60"
      />
    </div>
  );
}

export default function Reveal() {
  const { token: paramToken } = useParams();
  const location = useLocation();
  const token = extractToken(paramToken, location.hash);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [access, setAccess] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [receiverName, setReceiverName] = useState(null);
  const [revealing, setRevealing] = useState(false);
  const [revealError, setRevealError] = useState('');
  const resultRef = useRef(null);

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
    setRevealing(true);
    setRevealError('');
    try {
      const data = await participantApi.reveal(token);
      setReceiverName(data.receiverName);
    } catch (error) {
      setRevealError(getErrorMessage(error));
    } finally {
      setRevealing(false);
    }
  }

  if (status === 'loading') {
    return (
      <Card className="flex flex-col items-center gap-3 py-12 text-center text-pine-800">
        <title>Verificando link · Amigo Secreto</title>
        <Spinner label="Preparando seu sorteio" className="[--size:2rem]" />
        <p className="text-neutral-600">Preparando seu sorteio…</p>
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
        <p className="text-sm text-neutral-600">
          Confira se o link foi copiado por completo. Se o problema continuar, fale com quem
          organizou o amigo secreto.
        </p>
      </Card>
    );
  }

  const isRevealedNow = Boolean(receiverName);

  return (
    <div>
      <title>{`${access.eventName} · Amigo Secreto`}</title>

      <GiftIllustration
        variant="trio"
        opened={isRevealedNow}
        className="relative z-0 mx-auto -mb-3.5 h-24 w-60 sm:h-28 sm:w-72"
      />

      <Card className="relative z-1 overflow-hidden text-center">
        {isRevealedNow && <FestiveConfetti />}

        <span className="relative inline-flex items-center rounded-full bg-berry-50 px-3.5 py-1 text-xs font-semibold tracking-wide text-berry-700 uppercase">
          {access.eventName}
        </span>

        <h1 className="relative mt-3 text-2xl font-bold tracking-tight text-pine-900 sm:text-3xl">
          Olá, {access.participantName}!
        </h1>

        {isRevealedNow ? (
          <div className="relative mt-5">
            <h2 id="resultado" className="text-sm font-semibold text-neutral-600">
              Seu amigo secreto é
            </h2>

            <DrawTicket
              ref={resultRef}
              receiverName={receiverName}
              ariaLabelledBy="resultado"
            />

            <p className="mt-5 text-sm leading-relaxed text-neutral-600">
              Guarde segredo! Você pode abrir este mesmo link sempre que precisar consultar de novo.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-6">
            {access.hasRevealed ? (
              <Alert type="info" title="Você já revelou seu amigo secreto">
                Sem problemas: toque abaixo se quiser consultar o nome sorteado novamente.
              </Alert>
            ) : (
              <p className="mx-auto max-w-prose text-neutral-600">
                Tudo pronto! Quando ninguém estiver olhando a sua tela, toque no botão abaixo para
                revelar quem você tirou.
              </p>
            )}

            {revealError && <Alert type="error">{revealError}</Alert>}

            <Button
              variant="danger"
              onClick={handleReveal}
              loading={revealing}
              loadingLabel="Revelando resultado"
              className="w-full sm:w-auto"
            >
              {!revealing && <Gift className="h-5 w-5" aria-hidden="true" />}
              {access.hasRevealed ? 'Ver meu amigo secreto novamente' : 'Revelar meu amigo secreto'}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
