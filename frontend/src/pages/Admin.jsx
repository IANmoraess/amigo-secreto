import { useCallback, useEffect, useState } from 'react';
import { useBeforeUnload } from 'react-router-dom';
import { LogOut, Repeat } from 'lucide-react';
import Alert from '../components/Alert.jsx';
import Button from '../components/Button.jsx';
import AdminLogin from '../components/admin/AdminLogin.jsx';
import EventHeader from '../components/admin/EventHeader.jsx';
import EventSetup from '../components/admin/EventSetup.jsx';
import EventSummary from '../components/admin/EventSummary.jsx';
import LinkDistribution from '../components/admin/LinkDistribution.jsx';
import ParticipantManager from '../components/admin/ParticipantManager.jsx';
import { adminApi, getErrorMessage } from '../services/api.js';

const ADMIN_INACTIVITY_MS = 15 * 60 * 1000;

function runWithViewTransition(update) {
  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  if (!prefersReducedMotion && typeof document.startViewTransition === 'function') {
    document.startViewTransition(update);
  } else {
    update();
  }
}

/**
 * Painel administrativo.
 *
 * Fluxo: chave administrativa -> criar/abrir evento -> gerenciar participantes
 *        -> sortear -> distribuir links (tela exclusiva) -> resumo do evento.
 *
 * Privacidade: o painel nunca recebe nem exibe as associações do sorteio.
 * Os tokens individuais só existem em memória durante a distribuição.
 */
export default function Admin() {
  const [adminKey, setAdminKey] = useState(null);
  const [event, setEvent] = useState(null);
  const [links, setLinks] = useState(null);
  const [busy, setBusy] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Avisa antes de fechar/recarregar a página enquanto os links não foram distribuídos.
  useBeforeUnload(
    useCallback(
      (beforeUnloadEvent) => {
        if (links) beforeUnloadEvent.preventDefault();
      },
      [links]
    )
  );

  // Encerra a sessão administrativa após 15 minutos de inatividade (exceto durante a distribuição).
  useEffect(() => {
    if (!adminKey || links) return undefined;

    let timerId;
    const resetTimer = () => {
      clearTimeout(timerId);
      timerId = setTimeout(() => {
        setAdminKey(null);
        setEvent(null);
        setFeedback({
          type: 'info',
          message: 'Sessão encerrada por inatividade. Informe a chave administrativa novamente.',
        });
      }, ADMIN_INACTIVITY_MS);
    };

    resetTimer();
    window.addEventListener('pointerdown', resetTimer);
    window.addEventListener('keydown', resetTimer);

    return () => {
      clearTimeout(timerId);
      window.removeEventListener('pointerdown', resetTimer);
      window.removeEventListener('keydown', resetTimer);
    };
  }, [adminKey, links]);

  /** Executa uma operação na API, controlando carregamento e mensagens. */
  async function run(busyKey, operation, successMessage) {
    setBusy(busyKey);
    setFeedback(null);
    try {
      await operation();
      if (successMessage) setFeedback({ type: 'success', message: successMessage });
      return true;
    } catch (error) {
      if (error?.status === 401) {
        setAdminKey(null);
        setFeedback({ type: 'error', message: 'Chave administrativa inválida. Entre novamente.' });
      } else {
        setFeedback({ type: 'error', message: getErrorMessage(error) });
      }
      return false;
    } finally {
      setBusy(null);
    }
  }

  const handleLogin = (key) =>
    run('login', async () => {
      await adminApi.verify(key);
      runWithViewTransition(() => setAdminKey(key));
    });

  const handleCreate = (name) =>
    run(
      'create',
      async () => setEvent((await adminApi.createEvent(adminKey, name)).event),
      'Evento criado. Agora cadastre os participantes.'
    );

  const handleOpen = (eventId) =>
    run('open', async () => setEvent((await adminApi.getEvent(adminKey, eventId)).event));

  const handleAdd = (name) =>
    run(
      'add',
      async () => setEvent((await adminApi.addParticipant(adminKey, event.id, name)).event),
      `${name} foi adicionado(a).`
    );

  const handleRemove = (participant) =>
    run(
      `remove:${participant.id}`,
      async () =>
        setEvent((await adminApi.removeParticipant(adminKey, event.id, participant.id)).event),
      `${participant.name} foi removido(a).`
    );

  const handleDraw = () =>
    run(
      'draw',
      async () => {
        const result = await adminApi.draw(adminKey, event.id);
        setEvent(result.event);
        setLinks(result.links);
      },
      'Sorteio realizado com sucesso!'
    );

  function handleFinishDistribution() {
    runWithViewTransition(() => {
      setLinks(null); // descarta os tokens da memória
      setFeedback({ type: 'success', message: 'Distribuição concluída.' });
    });
  }

  function handleSwitchEvent() {
    runWithViewTransition(() => {
      setEvent(null);
      setFeedback(null);
    });
  }

  function handleLogout() {
    runWithViewTransition(() => {
      setAdminKey(null);
      setEvent(null);
      setFeedback(null);
    });
  }

  const feedbackAlert = feedback && (
    <Alert type={feedback.type} className="mb-6">
      {feedback.message}
    </Alert>
  );

  if (!adminKey) {
    return (
      <>
        <title>Área do organizador · Amigo Secreto</title>
        {feedbackAlert}
        <AdminLogin onSubmit={handleLogin} loading={busy === 'login'} />
      </>
    );
  }

  return (
    <div className="space-y-6">
      <title>Painel do organizador · Amigo Secreto</title>

      {/* Durante a distribuição, a navegação fica oculta para evitar a perda dos links. */}
      {!links && (
        <nav aria-label="Ações do painel" className="flex flex-wrap justify-end gap-2">
          {event && (
            <Button variant="ghost" size="sm" onClick={handleSwitchEvent} disabled={Boolean(busy)}>
              <Repeat className="h-4 w-4" aria-hidden="true" />
              Trocar de evento
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={handleLogout} disabled={Boolean(busy)}>
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sair
          </Button>
        </nav>
      )}

      {feedbackAlert}

      {!event ? (
        <>
          <h1 className="text-2xl font-bold tracking-tight text-pine-900">Painel do organizador</h1>
          <EventSetup onCreate={handleCreate} onOpen={handleOpen} busy={busy} />
        </>
      ) : (
        <>
          <EventHeader event={event} />

          {links ? (
            <LinkDistribution links={links} onFinish={handleFinishDistribution} />
          ) : event.status === 'draft' ? (
            <ParticipantManager
              event={event}
              busy={busy}
              onAdd={handleAdd}
              onRemove={handleRemove}
              onDraw={handleDraw}
            />
          ) : (
            <EventSummary event={event} />
          )}
        </>
      )}
    </div>
  );
}
