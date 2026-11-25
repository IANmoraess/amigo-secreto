import CopyButton from '../CopyButton.jsx';

const STATUS = {
  draft: { label: 'Em preparação', classes: 'bg-amber-50 text-amber-900 border-amber-600/40' },
  completed: { label: 'Sorteio realizado', classes: 'bg-pine-50 text-pine-900 border-pine-700/30' },
};

/** Cabeçalho do evento: nome, status e código para reabrir o painel depois. */
export default function EventHeader({ event }) {
  const status = STATUS[event.status] ?? STATUS.draft;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold break-words text-pine-900 sm:text-3xl">{event.name}</h1>
        <span className={`rounded-full border px-3 py-1 text-sm font-medium ${status.classes}`}>
          <span className="sr-only">Status: </span>
          {status.label}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-600">
        <span>
          Código do evento: <code className="rounded bg-neutral-100 px-1.5 py-0.5">{event.id}</code>
        </span>
        <CopyButton text={event.id} label="Copiar código" variant="ghost" />
      </div>
    </div>
  );
}
