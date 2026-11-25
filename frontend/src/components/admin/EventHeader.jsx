import CopyButton from '../CopyButton.jsx';

const STATUS = {
  draft: { label: 'Em preparação', classes: 'bg-gold-100 text-gold-600' },
  completed: { label: 'Sorteio realizado', classes: 'bg-mint-100 text-pine-800' },
};

/** Cabeçalho do evento: nome, status e código para reabrir o painel depois. */
export default function EventHeader({ event }) {
  const status = STATUS[event.status] ?? STATUS.draft;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight break-words text-pine-900 sm:text-3xl">
          {event.name}
        </h1>
        <span className={`rounded-full px-3.5 py-1 text-xs font-semibold ${status.classes}`}>
          <span className="sr-only">Status: </span>
          {status.label}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-600">
        <span>
          Código do evento:{' '}
          <code className="rounded-lg bg-white px-2 py-0.5 font-mono text-xs text-pine-900">
            {event.id}
          </code>
        </span>
        <CopyButton text={event.id} label="Copiar código" variant="ghost" />
      </div>
    </div>
  );
}
