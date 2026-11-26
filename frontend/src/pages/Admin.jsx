import { useCallback, useEffect, useState } from 'react';
import { useBeforeUnload, useNavigate, useOutletContext } from 'react-router-dom';
import { ArrowLeft, LogOut } from 'lucide-react';
import Alert from '../components/Alert.jsx';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import Spinner from '../components/Spinner.jsx';
import AdminLogin from '../components/admin/AdminLogin.jsx';
import EventHeader from '../components/admin/EventHeader.jsx';
import EventSetup from '../components/admin/EventSetup.jsx';
import EventSummary from '../components/admin/EventSummary.jsx';
import LinkDistribution from '../components/admin/LinkDistribution.jsx';
import ParticipantManager from '../components/admin/ParticipantManager.jsx';
import { clearStoredSession, loadStoredSession, storeSession } from '../services/adminSession.js';
import { adminApi, getErrorMessage } from '../services/api.js';

const EVENT_POLL_INTERVAL_MS = 5000;
// Intervalo mínimo entre renovações de sessão disparadas por atividade do organizador.
const ACTIVITY_TOUCH_MIN_INTERVAL_MS = 20_000;
const SESSION_EXPIRED_MESSAGE =
  'Sua sessão expirou por inatividade. Informe a chave administrativa para continuar de onde parou.';

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
 * Fluxo: chave administrativa -> sessão temporária -> criar/abrir evento -> gerenciar
 *        participantes -> sortear -> distribuir links (tela exclusiva) -> resumo do evento.
 *
 * Sessão: o backend emite um token opaco com expiração por inatividade (15 min) e é a
 * única autoridade sobre a validade. Estados de autenticação: `checking` (validando a
 * sessão guardada), `login` (pedindo a chave) e `authenticated`.
 * Ao expirar, o painel NÃO é desmontado: evento aberto e links de distribuição ficam na
 * memória (apenas ocultos atrás do login) e voltam a aparecer após nova autenticação.
 *
 * Privacidade: o painel nunca recebe nem exibe as associações do sorteio.
 * Os tokens individuais só existem em memória durante a distribuição.
 */
export default function Admin() {
  const navigate = useNavigate();
  const { setHeaderRight } = useOutletContext() ?? {};
  const [initialToken] = useState(loadStoredSession);
  const [sessionToken, setSessionToken] = useState(initialToken);
  const [authState, setAuthState] = useState(initialToken ? 'checking' : 'login');
  const [sessionExpiresAt, setSessionExpiresAt] = useState(null);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [event, setEvent] = useState(null);
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [links, setLinks] = useState(null);
  const [busy, setBusy] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const authenticated = authState === 'authenticated';

  // Exibe indicação discreta à direita do cabeçalho enquanto estiver no painel autenticado.
  useEffect(() => {
    if (!setHeaderRight) return undefined;
    setHeaderRight(
      authenticated ? (
        <span className="rounded-full bg-mint-100 px-3 py-1 text-xs font-semibold text-pine-800">
          Painel do organizador
        </span>
      ) : null
    );
    return () => setHeaderRight(null);
  }, [authenticated, setHeaderRight]);

  // Avisa antes de fechar/recarregar a página enquanto os links não foram distribuídos.
  useBeforeUnload(
    useCallback(
      (beforeUnloadEvent) => {
        if (links) beforeUnloadEvent.preventDefault();
      },
      [links]
    )
  );

  /** Inicia (ou retoma) a sessão autenticada. `startedAt` é o instante em que o pedido saiu. */
  const startSession = useCallback((token, startedAt, expiresInSeconds) => {
    storeSession(token);
    setSessionToken(token);
    setSessionExpiresAt(startedAt + expiresInSeconds * 1000);
    setLockedUntil(0);
    setFeedback(null);
    runWithViewTransition(() => setAuthState('authenticated'));
  }, []);

  /**
   * Sessão inválida ou expirada: pede a chave novamente SEM descartar o contexto
   * (evento aberto, lista de eventos e links de distribuição permanecem em memória).
   */
  const expireSession = useCallback((message = SESSION_EXPIRED_MESSAGE) => {
    // Fecha diálogos modais abertos (equivale a "Cancelar"): um modal aberto dentro do painel
    // oculto deixaria o formulário de login inerte.
    document.querySelectorAll('dialog[open]').forEach((dialog) => dialog.close());
    clearStoredSession();
    setSessionToken(null);
    setSessionExpiresAt(null);
    setBusy(null);
    setFeedback({ type: 'info', message });
    setAuthState('login');
  }, []);

  // Ao abrir a página com uma sessão guardada, valida no backend (abrir o painel é atividade real).
  useEffect(() => {
    if (authState !== 'checking') return undefined;

    let active = true;
    const startedAt = Date.now();
    adminApi
      .touch(sessionToken)
      .then((data) => {
        if (active) startSession(sessionToken, startedAt, data.expiresInSeconds);
      })
      .catch((error) => {
        if (!active) return;
        setSessionToken(null);
        if (error?.status === 401) {
          clearStoredSession();
          setFeedback({ type: 'info', message: SESSION_EXPIRED_MESSAGE });
        } else {
          setFeedback({ type: 'error', message: getErrorMessage(error) });
        }
        setAuthState('login');
      });

    return () => {
      active = false;
    };
  }, [authState, sessionToken, startSession]);

  // Único temporizador de inatividade: expira localmente no instante calculado a partir das
  // respostas do servidor (que continua sendo a autoridade; um 401 também encerra a sessão).
  useEffect(() => {
    if (!authenticated || !sessionExpiresAt) return undefined;

    const timerId = setTimeout(() => expireSession(), Math.max(0, sessionExpiresAt - Date.now()));
    // Abas em segundo plano podem atrasar timers; ao voltar, confere o prazo imediatamente.
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && Date.now() >= sessionExpiresAt) {
        expireSession();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearTimeout(timerId);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [authenticated, sessionExpiresAt, expireSession]);

  // Atividade REAL do organizador (cliques/teclas) renova a sessão no servidor. Consultas
  // automáticas (polling) nunca passam por aqui, portanto não mantêm a sessão viva.
  useEffect(() => {
    if (!authenticated) return undefined;

    let active = true;
    let inFlight = false;
    let lastTouchAt = Date.now();

    const handleActivity = async () => {
      const startedAt = Date.now();
      if (inFlight || startedAt - lastTouchAt < ACTIVITY_TOUCH_MIN_INTERVAL_MS) return;
      inFlight = true;
      lastTouchAt = startedAt;
      try {
        const data = await adminApi.touch(sessionToken);
        if (active) setSessionExpiresAt(startedAt + data.expiresInSeconds * 1000);
      } catch (error) {
        if (active && error?.status === 401) expireSession();
        // Falhas temporárias de rede: a próxima atividade tenta renovar novamente.
      } finally {
        inFlight = false;
      }
    };

    window.addEventListener('pointerdown', handleActivity);
    window.addEventListener('keydown', handleActivity);
    return () => {
      active = false;
      window.removeEventListener('pointerdown', handleActivity);
      window.removeEventListener('keydown', handleActivity);
    };
  }, [authenticated, sessionToken, expireSession]);

  // Carrega a lista de eventos salvos no banco ao abrir o painel ou trocar de evento.
  useEffect(() => {
    if (!authenticated || event) return undefined;
    let active = true;
    setLoadingEvents(true);
    adminApi
      .listEvents(sessionToken)
      .then((data) => {
        if (active) setEvents(data.events ?? []);
      })
      .catch((error) => {
        if (!active) return;
        if (error?.status === 401) {
          expireSession();
        } else {
          setFeedback({ type: 'error', message: getErrorMessage(error) });
        }
      })
      .finally(() => {
        if (active) setLoadingEvents(false);
      });
    return () => {
      active = false;
    };
  }, [authenticated, sessionToken, event, expireSession]);

  // Atualiza periodicamente o status de visualização enquanto um evento já sorteado está aberto.
  // Pausa durante a distribuição dos links e enquanto a sessão não estiver autenticada.
  const eventId = event?.id;
  const eventStatus = event?.status;
  useEffect(() => {
    if (!authenticated || !eventId || eventStatus !== 'completed' || links) return undefined;

    let active = true;
    let timerId;

    const schedule = () => {
      timerId = setTimeout(poll, EVENT_POLL_INTERVAL_MS);
    };

    // Encadeia um novo ciclo só após o anterior terminar, evitando requisições simultâneas.
    async function poll() {
      if (document.hidden) {
        schedule();
        return;
      }
      try {
        const data = await adminApi.getEvent(sessionToken, eventId);
        if (!active) return;
        // Ignora respostas de um evento que não é mais o aberto.
        setEvent((current) => (current?.id === data.event.id ? data.event : current));
      } catch (error) {
        if (!active) return;
        if (error?.status === 401) {
          expireSession();
          return;
        }
        // Falhas temporárias de rede são ignoradas em silêncio; a próxima tentativa corrige.
      }
      if (active) schedule();
    }

    schedule();
    return () => {
      active = false;
      clearTimeout(timerId);
    };
  }, [authenticated, sessionToken, eventId, eventStatus, links, expireSession]);

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
        expireSession();
      } else {
        setFeedback({ type: 'error', message: getErrorMessage(error) });
      }
      return false;
    } finally {
      setBusy(null);
    }
  }

  async function handleLogin(key) {
    setBusy('login');
    setFeedback(null);
    const startedAt = Date.now();
    try {
      const data = await adminApi.login(key);
      startSession(data.sessionToken, startedAt, data.expiresInSeconds);
      return true;
    } catch (error) {
      if (error?.status === 429) {
        setLockedUntil(Date.now() + (error.retryAfterSeconds ?? 60) * 1000);
        setFeedback({ type: 'error', message: error.message });
      } else if (error?.status === 401) {
        const remaining = error.attemptsRemaining;
        const hint =
          remaining > 0
            ? ` ${remaining === 1 ? 'Resta 1 tentativa' : `Restam ${remaining} tentativas`}.`
            : '';
        setFeedback({ type: 'error', message: `Chave administrativa incorreta.${hint}` });
      } else {
        setFeedback({ type: 'error', message: getErrorMessage(error) });
      }
      return false;
    } finally {
      setBusy(null);
    }
  }

  const handleCreate = (name) =>
    run(
      'create',
      async () => setEvent((await adminApi.createEvent(sessionToken, name)).event),
      'Evento criado. Agora cadastre os participantes.'
    );

  const handleOpen = (eventId) =>
    run('open', async () => setEvent((await adminApi.getEvent(sessionToken, eventId)).event));

  const handleDelete = (eventItem) =>
    run(
      `delete:${eventItem.id}`,
      async () => {
        await adminApi.deleteEvent(sessionToken, eventItem.id);
        setEvents((current) => current.filter((item) => item.id !== eventItem.id));
      },
      `Evento "${eventItem.name}" excluído definitivamente.`
    );

  const handleAdd = (name) =>
    run(
      'add',
      async () => setEvent((await adminApi.addParticipant(sessionToken, event.id, name)).event),
      `${name} foi adicionado(a).`
    );

  const handleRemove = (participant) =>
    run(
      `remove:${participant.id}`,
      async () =>
        setEvent((await adminApi.removeParticipant(sessionToken, event.id, participant.id)).event),
      `${participant.name} foi removido(a).`
    );

  const handleDraw = () =>
    run(
      'draw',
      async () => {
        const result = await adminApi.draw(sessionToken, event.id);
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

  function handleBack() {
    if (event) {
      runWithViewTransition(() => {
        setLinks(null);
        setEvent(null);
        setFeedback(null);
      });
      return;
    }
    navigate('/');
  }

  async function handleLogout() {
    const token = sessionToken;
    setBusy('logout');
    try {
      await adminApi.logout(token); // revoga a sessão no servidor
    } catch {
      // Mesmo sem conexão, a credencial é removida deste navegador.
    }
    clearStoredSession();
    setBusy(null);
    setSessionToken(null);
    setSessionExpiresAt(null);
    setAuthState('login');
    setEvent(null);
    setEvents([]);
    setFeedback(null);
    navigate('/', { replace: true });
  }

  // Mensagens de sucesso somem automaticamente após 4 segundos.
  useEffect(() => {
    if (feedback?.type !== 'success') return undefined;
    const timerId = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(timerId);
  }, [feedback]);

  const feedbackAlert = feedback && (
    <Alert type={feedback.type} align="center" onClose={() => setFeedback(null)} className="mb-6">
      {feedback.message}
    </Alert>
  );

  if (authState === 'checking') {
    return (
      <Card className="flex flex-col items-center gap-3 py-12 text-center text-pine-800">
        <title>Verificando sessão · Amigo Secreto</title>
        <Spinner label="Verificando sessão" className="[--size:2rem]" />
        <p className="text-charcoal-soft">Verificando sessão…</p>
      </Card>
    );
  }

  // Mantém o painel montado (apenas oculto) enquanto houver contexto a preservar,
  // inclusive os links de distribuição e o estado de "copiado" de cada um.
  const showPanel = authenticated || Boolean(event) || Boolean(links);

  return (
    <>
      {!authenticated && (
        <>
          <title>Área do organizador · Amigo Secreto</title>
          {feedbackAlert}
          <AdminLogin
            onSubmit={handleLogin}
            onBack={() => navigate('/')}
            loading={busy === 'login'}
            lockedUntil={lockedUntil}
          />
        </>
      )}

      {showPanel && (
        <div hidden={!authenticated} className="space-y-6">
          {authenticated && <title>Painel do organizador · Amigo Secreto</title>}

          {authenticated && feedbackAlert}

          {!event ? (
            <>
              <div className="flex items-center gap-2.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  disabled={Boolean(busy)}
                  aria-label="Voltar para a página inicial"
                  title="Voltar"
                  className="min-h-10 w-10 flex-none px-0"
                >
                  <ArrowLeft className="h-5 w-5" aria-hidden="true" />
                </Button>
                <h1 className="text-2xl font-bold tracking-tight text-pine-900">
                  Painel do organizador
                </h1>
              </div>
              <EventSetup
                events={events}
                loadingEvents={loadingEvents}
                onCreate={handleCreate}
                onOpen={handleOpen}
                onDelete={handleDelete}
                busy={busy}
              />
            </>
          ) : (
            <>
              <EventHeader
                event={event}
                onBack={handleBack}
                backDisabled={Boolean(busy)}
              />

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

          {/* Desconectar exibido apenas na tela inicial do painel, separado abaixo do último card */}
          {!event && (
            <div className="mt-8 flex justify-center border-t border-sage/35 pt-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                loading={busy === 'logout'}
                loadingLabel="Desconectando"
                disabled={Boolean(busy)}
                className="text-charcoal-soft hover:bg-berry-50 hover:text-berry-700"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Desconectar
              </Button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
