import { CalendarPlus, FolderOpen } from 'lucide-react';
import Button from '../Button.jsx';
import Card from '../Card.jsx';
import TextField from '../TextField.jsx';

/** Permite criar um novo evento ou abrir um evento existente pelo código. */
export default function EventSetup({ onCreate, onOpen, busy }) {
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
        <h2 id="create-event-title" className="flex items-center gap-2 text-xl font-semibold text-pine-900">
          <CalendarPlus className="h-5 w-5" aria-hidden="true" />
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
        <h2 id="open-event-title" className="flex items-center gap-2 text-xl font-semibold text-pine-900">
          <FolderOpen className="h-5 w-5" aria-hidden="true" />
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
