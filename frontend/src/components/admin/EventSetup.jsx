import { CalendarPlus, FolderOpen, List } from 'lucide-react';
import Button from '../Button.jsx';
import Card from '../Card.jsx';
import TextField from '../TextField.jsx';

const STATUS = {
  draft: { label: 'Em preparação', classes: 'bg-gold-100 text-gold-600' },
  completed: { label: 'Sorteio realizado', classes: 'bg-mint-100 text-pine-800' },
};

/** Permite criar um novo evento, selecionar um salvo no banco ou abrir pelo código. */
export default function EventSetup({ events = [], loadingEvents = false, onCreate, onOpen, busy }) {
  function handleCreate(event) {
    event.preventDefault();
    const name = new FormData(event.currentTarget).get('eventName').trim();
    if (name) onCreate(name);
  }

  function handleOpen(event) {
    event.preventDefault();
    const eventId = new FormData(event.currentTarget).get('eventId').trim();
    if (eventId) onOpen(eventId);
  }

  return (
    <div className="grid gap-6">
      <Card>
        <h2 id="create-event-title" className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-pine-900">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-mint-100 text-pine-800">
            <CalendarPlus className="h-5 w-5" aria-hidden="true" />
          </span>
          Criar novo evento
        </h2>
        <form onSubmit={handleCreate} aria-labelledby="create-event-title" className="mt-5 space-y-5">
          <TextField
            label="Nome do evento"
            hint="Por exemplo: Natal da Família 2026. Até 100 caracteres."
            name="eventName"
            required
            maxLength={100}
            pattern=".*\S.*"
            autoComplete="off"
            enterKeyHint="done"
          />
          <Button
            type="submit"
            loading={busy === 'create'}
            loadingLabel="Criando evento"
            disabled={Boolean(busy)}
            className="w-full sm:w-auto"
          >
            Criar evento
          </Button>
        </form>
      </Card>

      <Card>
        <h2 id="saved-events-title" className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-pine-900">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-mint-100 text-pine-800">
            <List className="h-5 w-5" aria-hidden="true" />
          </span>
          Eventos salvos
        </h2>
        {loadingEvents ? (
          <p className="mt-4 text-sm text-neutral-600">Carregando eventos...</p>
        ) : events.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-600">Nenhum evento criado ainda.</p>
        ) : (
          <ul aria-labelledby="saved-events-title" className="mt-4 divide-y divide-neutral-200">
            {events.map((item) => {
              const status = STATUS[item.status] ?? STATUS.draft;
              const count = item.participantCount ?? 0;
              return (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-pine-900 break-words">{item.name}</span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.classes}`}>
                        {status.label}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-600">
                      {count} {count === 1 ? 'participante' : 'participantes'} ·{' '}
                      <code className="font-mono">{item.id}</code>
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => onOpen(item.id)}
                    disabled={Boolean(busy)}
                  >
                    Abrir
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card>
        <h2 id="open-event-title" className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-pine-900">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold-100 text-gold-600">
            <FolderOpen className="h-5 w-5" aria-hidden="true" />
          </span>
          Abrir evento existente
        </h2>
        <form onSubmit={handleOpen} aria-labelledby="open-event-title" className="mt-5 space-y-5">
          <TextField
            label="Código do evento"
            hint="O código é exibido no painel logo após a criação do evento."
            name="eventId"
            required
            pattern=".*\S.*"
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="go"
          />
          <Button
            type="submit"
            variant="secondary"
            loading={busy === 'open'}
            loadingLabel="Abrindo evento"
            disabled={Boolean(busy)}
            className="w-full sm:w-auto"
          >
            Abrir evento
          </Button>
        </form>
      </Card>
    </div>
  );
}
