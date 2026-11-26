import { useState } from 'react';
import { CalendarCheck, CalendarPlus, CircleCheck, Clock, Download, Lock } from 'lucide-react';
import Alert from '../Alert.jsx';
import Button from '../Button.jsx';
import Card from '../Card.jsx';
import { downloadDrawRecordImage } from '../../utils/drawRecordImage.js';

function formatDateTime(isoDate) {
  if (!isoDate) return null;
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeStyle: 'short' }).format(
    new Date(isoDate)
  );
}

/**
 * Resumo de um evento já sorteado.
 * Mostra apenas nomes e status de visualização; nunca as associações do sorteio.
 * Disponibiliza a exportação limpa do registro do sorteio em imagem.
 */
export default function EventSummary({ event }) {
  const [savingRecord, setSavingRecord] = useState(false);
  const createdAt = formatDateTime(event.createdAt);
  const drawnAt = formatDateTime(event.drawnAt);
  const revealedCount = event.participants.filter((p) => p.hasRevealed).length;

  async function handleSaveRecord() {
    if (savingRecord) return;
    setSavingRecord(true);
    try {
      await downloadDrawRecordImage(event);
    } finally {
      setSavingRecord(false);
    }
  }

  return (
    <>
      <Alert type="info" icon={Lock} title="Os resultados são secretos">
        O organizador não tem acesso a quem tirou quem. Cada participante consulta o próprio
        resultado pelo link individual.
      </Alert>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-pine-900">Participantes</h2>
            <p className="mt-1 text-sm text-charcoal-soft">
              {revealedCount} de {event.participants.length} já visualizaram o resultado.
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSaveRecord}
            loading={savingRecord}
            loadingLabel="Gerando imagem do registro"
            className="w-full sm:w-auto"
          >
            {!savingRecord && <Download className="h-4 w-4" aria-hidden="true" />}
            Salvar registro
          </Button>
        </div>

        <ul className="mt-4 space-y-2">
          {event.participants.map((participant) => (
            <li
              key={participant.id}
              className="flex items-center justify-between gap-3 rounded-2xl bg-cream/65 px-4 py-3"
            >
              <span className="font-medium break-words text-charcoal">{participant.name}</span>
              {participant.hasRevealed ? (
                <span className="flex flex-none items-center gap-1.5 rounded-full bg-mint-100 px-3 py-1 text-xs font-semibold text-pine-800">
                  <CircleCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  Revelado
                </span>
              ) : (
                <span className="flex flex-none items-center gap-1.5 rounded-full bg-sage/20 px-3 py-1 text-xs font-medium text-charcoal-soft">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  Aguardando
                </span>
              )}
            </li>
          ))}
        </ul>
      </Card>

      {(createdAt || drawnAt) && (
        <Card className="px-4 py-4 sm:px-4 sm:py-5">
          <ol className="space-y-4">
            {createdAt && (
              <li className="relative flex items-start gap-3.5 text-sm text-charcoal-soft">
                {drawnAt && (
                  <span
                    aria-hidden="true"
                    className="absolute top-9 bottom-[-1rem] left-4 w-px -translate-x-1/2 bg-sage/45"
                  />
                )}
                <span className="relative z-1 flex h-8 w-8 flex-none items-center justify-center rounded-xl bg-cream text-pine-800">
                  <CalendarPlus className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="pt-0.5">
                  <p className="font-semibold text-charcoal">Evento criado</p>
                  <p className="text-xs text-charcoal-soft">{createdAt}</p>
                </div>
              </li>
            )}

            {drawnAt && (
              <li className="relative flex items-start gap-3.5 text-sm text-charcoal-soft">
                <span className="relative z-1 flex h-8 w-8 flex-none items-center justify-center rounded-xl bg-mint-100 text-pine-800">
                  <CalendarCheck className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="pt-0.5">
                  <p className="font-semibold text-charcoal">Sorteio realizado</p>
                  <p className="text-xs text-charcoal-soft">{drawnAt}</p>
                </div>
              </li>
            )}
          </ol>
        </Card>
      )}
    </>
  );
}
