import { CircleCheck, Clock } from 'lucide-react';
import Alert from '../Alert.jsx';
import Card from '../Card.jsx';

function formatDateTime(isoDate) {
  if (!isoDate) return null;
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeStyle: 'short' }).format(
    new Date(isoDate)
  );
}

/**
 * Resumo de um evento já sorteado.
 * Mostra apenas nomes e status de visualização; nunca as associações do sorteio.
 */
export default function EventSummary({ event }) {
  const drawnAt = formatDateTime(event.drawnAt);
  const revealedCount = event.participants.filter((p) => p.hasRevealed).length;

  return (
    <>
      <Alert type="info" title="Os resultados são secretos">
        Nem o organizador tem acesso a quem tirou quem. Cada participante consulta o próprio
        resultado pelo link individual{drawnAt ? `. Sorteio realizado em ${drawnAt}.` : '.'}
      </Alert>

      <Card>
        <h2 className="text-xl font-semibold text-pine-900">Participantes</h2>
        <p className="mt-1 text-sm text-neutral-600">
          {revealedCount} de {event.participants.length} já visualizaram o resultado.
        </p>
        <ul className="mt-4 divide-y divide-pine-100">
          {event.participants.map((participant) => (
            <li key={participant.id} className="flex items-center justify-between gap-3 py-3">
              <span className="break-words text-neutral-900">{participant.name}</span>
              {participant.hasRevealed ? (
                <span className="flex flex-none items-center gap-1.5 text-sm text-pine-700">
                  <CircleCheck className="h-4 w-4" aria-hidden="true" />
                  Visualizou
                </span>
              ) : (
                <span className="flex flex-none items-center gap-1.5 text-sm text-neutral-600">
                  <Clock className="h-4 w-4" aria-hidden="true" />
                  Ainda não visualizou
                </span>
              )}
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
