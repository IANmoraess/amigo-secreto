import { useEffect, useRef, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { Eye, Sparkles } from 'lucide-react';
import Alert from '../components/Alert.jsx';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
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

  // Leva o foco ao resultado assim que ele aparece (útil para leitores de tela).
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
        <Spinner label="Verificando seu link" className="[--size:2rem]" />
        <p className="text-neutral-700">Verificando seu link…</p>
      </Card>
    );
  }

  if (status === 'error') {
    return (
      <Card className="space-y-4 text-center">
        <title>Link indisponível · Amigo Secreto</title>
        <GiftIllustration className="mx-auto h-20 w-20 opacity-50" />
        <h1 className="font-serif text-2xl font-semibold text-pine-900">
          Não foi possível abrir este link
        </h1>
        <Alert type="error">{loadError}</Alert>
        <p className="text-sm text-neutral-600">
          Confira se o link foi copiado por completo. Se o problema continuar, fale com o
          organizador do amigo secreto.
        </p>
      </Card>
    );
  }

  const isRevealedNow = Boolean(receiverName);

  return (
    <Card className="text-center">
      <title>{`${access.eventName} · Amigo Secreto`}</title>

      <GiftIllustration opened={isRevealedNow} className="mx-auto h-28 w-28 sm:h-32 sm:w-32" />

      <p className="mt-3 inline-flex items-center rounded-full bg-berry-50 px-3 py-1 text-xs font-semibold tracking-wide text-berry-700 uppercase">
        {access.eventName}
      </p>
      <h1 className="mt-2 font-serif text-2xl font-semibold text-pine-900 sm:text-3xl">
        Olá, {access.participantName}!
      </h1>

      {isRevealedNow ? (
        <section
          ref={resultRef}
          tabIndex={-1}
          aria-labelledby="resultado"
          className="reveal-card-enter mt-6 rounded-2xl border-2 border-pine-700/20 bg-pine-50 p-6 outline-none sm:p-8"
        >
          <p id="resultado" className="inline-flex items-center gap-1.5 text-sm font-medium text-pine-800">
            <Sparkles className="h-4 w-4 text-gold-600" aria-hidden="true" />
            Seu amigo secreto é
          </p>
          <p className="mt-3 font-serif text-3xl font-bold break-words text-pine-900 sm:text-4xl">
            {receiverName}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-neutral-600">
            Guarde segredo! Você pode voltar a este mesmo link quando quiser consultar de novo.
          </p>
        </section>
      ) : (
        <div className="mt-4 space-y-5">
          {access.hasRevealed ? (
            <Alert type="info" title="Você já revelou seu amigo secreto">
              Sem problemas: você pode consultar o seu resultado novamente quando quiser.
            </Alert>
          ) : (
            <p className="mx-auto max-w-prose text-neutral-700">
              Bem-vindo(a) ao sorteio! Quando estiver pronto(a), toque no botão abaixo para
              descobrir quem você tirou. Garanta que ninguém está olhando a sua tela.
            </p>
          )}

          {revealError && <Alert type="error">{revealError}</Alert>}

          <Button
            onClick={handleReveal}
            loading={revealing}
            loadingLabel="Revelando"
            className="w-full sm:w-auto shadow-xs"
          >
            {!revealing && <Eye className="h-5 w-5" aria-hidden="true" />}
            {access.hasRevealed ? 'Ver meu amigo secreto novamente' : 'Revelar meu amigo secreto'}
          </Button>
        </div>
      )}
    </Card>
  );
}
