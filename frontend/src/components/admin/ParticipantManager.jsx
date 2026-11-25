import { useRef, useState } from 'react';
import { Shuffle, Trash2, UserPlus } from 'lucide-react';
import Button from '../Button.jsx';
import Card from '../Card.jsx';
import ConfirmDialog from '../ConfirmDialog.jsx';
import TextField from '../TextField.jsx';

const MIN_PARTICIPANTS = 2;

function getInitial(name) {
  return (name?.trim().charAt(0) || '?').toUpperCase();
}

/**
 * Gestão dos participantes de um evento em preparação (status "draft"):
 * cadastro, listagem, remoção e início do sorteio com confirmação.
 */
export default function ParticipantManager({ event, busy, onAdd, onRemove, onDraw }) {
  const [pendingRemoval, setPendingRemoval] = useState(null);
  const [confirmingDraw, setConfirmingDraw] = useState(false);
  const inputRef = useRef(null);

  const participants = event.participants;
  const canDraw = participants.length >= MIN_PARTICIPANTS;

  async function handleAdd(formEvent) {
    formEvent.preventDefault();
    const form = formEvent.currentTarget;
    const name = new FormData(form).get('participantName').trim();
    if (!name) return;

    const added = await onAdd(name);
    if (added) {
      form.reset();
      inputRef.current?.focus();
    }
  }

  return (
    <>
      <Card>
        <h2 id="add-participant-title" className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-pine-900">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-mint-100 text-pine-800">
            <UserPlus className="h-5 w-5" aria-hidden="true" />
          </span>
          Cadastrar participante
        </h2>
        <form
          onSubmit={handleAdd}
          aria-labelledby="add-participant-title"
          className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end"
        >
          <TextField
            ref={inputRef}
            label="Nome do participante"
            hint="Use um nome que a pessoa reconheça. Até 60 caracteres."
            name="participantName"
            required
            maxLength={60}
            pattern=".*\S.*"
            autoComplete="off"
            enterKeyHint="done"
            className="flex-1"
          />
          <Button
            type="submit"
            loading={busy === 'add'}
            loadingLabel="Adicionando participante"
            disabled={Boolean(busy)}
            className="w-full sm:w-auto"
          >
            Adicionar
          </Button>
        </form>
      </Card>

      <Card>
        <h2 className="text-xl font-bold tracking-tight text-pine-900">
          Participantes{' '}
          <span className="text-base font-medium text-charcoal-soft">({participants.length})</span>
        </h2>

        {participants.length === 0 ? (
          <p className="mt-4 text-charcoal-soft">Nenhum participante cadastrado ainda.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {participants.map((participant) => (
              <li
                key={participant.id}
                className="flex items-center justify-between gap-3 rounded-2xl bg-cream/60 px-3.5 py-2.5"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span
                    className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-mint-100 text-sm font-bold text-pine-800"
                    aria-hidden="true"
                  >
                    {getInitial(participant.name)}
                  </span>
                  <span className="font-medium break-words text-charcoal">{participant.name}</span>
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPendingRemoval(participant)}
                  loading={busy === `remove:${participant.id}`}
                  loadingLabel={`Removendo ${participant.name}`}
                  disabled={Boolean(busy)}
                  className="flex-none text-berry-700 hover:bg-berry-50"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Remover<span className="sr-only"> {participant.name}</span>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <h2 className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-pine-900">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-berry-100 text-berry-600">
            <Shuffle className="h-5 w-5" aria-hidden="true" />
          </span>
          Realizar sorteio
        </h2>
        <p id="draw-help" className="mt-2 text-sm text-charcoal-soft">
          {canDraw
            ? 'Confira a lista antes de sortear. Depois do sorteio não será possível alterar os participantes.'
            : `São necessários pelo menos ${MIN_PARTICIPANTS} participantes para realizar o sorteio.`}
        </p>
        <Button
          variant="gold"
          onClick={() => setConfirmingDraw(true)}
          loading={busy === 'draw'}
          loadingLabel="Realizando sorteio"
          disabled={!canDraw || Boolean(busy)}
          aria-describedby="draw-help"
          className="mt-5 w-full sm:w-auto"
        >
          Realizar sorteio
        </Button>
      </Card>

      <ConfirmDialog
        open={pendingRemoval !== null}
        title="Remover participante?"
        confirmLabel="Remover"
        confirmVariant="danger"
        onConfirm={() => {
          onRemove(pendingRemoval);
          setPendingRemoval(null);
        }}
        onCancel={() => setPendingRemoval(null)}
      >
        <p>
          <strong>{pendingRemoval?.name}</strong> será removido(a) da lista de participantes.
        </p>
      </ConfirmDialog>

      <ConfirmDialog
        open={confirmingDraw}
        title="Realizar o sorteio agora?"
        confirmLabel="Sortear"
        confirmVariant="gold"
        onConfirm={() => {
          setConfirmingDraw(false);
          onDraw();
        }}
        onCancel={() => setConfirmingDraw(false)}
      >
        <p>
          O sorteio será feito uma única vez entre os {participants.length} participantes e não
          poderá ser refeito.
        </p>
        <p>
          Depois dele, a lista não poderá mais ser alterada e você precisará copiar e enviar os
          links individuais imediatamente.
        </p>
      </ConfirmDialog>
    </>
  );
}
