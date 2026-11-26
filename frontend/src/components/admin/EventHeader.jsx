import { ArrowLeft } from 'lucide-react';
import Button from '../Button.jsx';
import CopyButton from '../CopyButton.jsx';

const STATUS = {
  draft: { label: 'Em preparação', classes: 'bg-gold-100 text-gold-600' },
  completed: { label: 'Sorteio realizado', classes: 'bg-mint-100 text-pine-800' },
};

function formatShortId(id) {
  if (typeof id !== 'string' || id.length <= 14) return id;
  return `${id.slice(0, 8)}…${id.slice(-4)}`;
}

/** Cabeçalho do evento: botão voltar opcional, nome, status e código abreviado copiável. */
export default function EventHeader({ event, onBack, backDisabled = false }) {
  const status = STATUS[event.status] ?? STATUS.draft;

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-3">
        {onBack && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            disabled={backDisabled}
            aria-label="Voltar para a lista de eventos"
            title="Voltar"
            className="min-h-10 w-10 flex-none px-0"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </Button>
        )}
        <h1 className="text-2xl font-bold tracking-tight break-words text-pine-900 sm:text-3xl">
          {event.name}
        </h1>
        <span className={`rounded-full px-3.5 py-1 text-xs font-semibold ${status.classes}`}>
          <span className="sr-only">Status: </span>
          {status.label}
        </span>
      </div>

      <div
        className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-charcoal-soft ${
          onBack ? 'sm:pl-13' : ''
        }`}
      >
        <span>Código:</span>
        <code
          title={event.id}
          className="rounded-lg border border-sage/30 bg-warm-white px-2 py-0.5 font-mono text-[11px] text-pine-900"
        >
          {formatShortId(event.id)}
        </code>
        <CopyButton
          text={event.id}
          label="Copiar"
          srLabel="código do evento"
          variant="ghost"
          size="sm"
        />
      </div>
    </div>
  );
}
