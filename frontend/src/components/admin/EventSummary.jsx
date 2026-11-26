import { useState } from 'react';
import { CalendarCheck, CalendarPlus, CircleCheck, Clock, Download } from 'lucide-react';
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
      <section
        aria-labelledby="resultados-secretos"
        className="relative overflow-hidden rounded-3xl bg-pine-800 px-6 py-6 text-left text-mint-50 shadow-[0_10px_28px_-14px_rgb(24_55_45/0.30)] sm:px-8 sm:py-7"
      >
        <svg
          viewBox="0 0 96 96"
          fill="none"
          aria-hidden="true"
          focusable="false"
          className="pointer-events-none absolute -right-2 -bottom-2 h-24 w-24 opacity-15"
        >
          <path d="M88 88C68 74 52 54 38 26" stroke="#C5A16B" strokeWidth="2" strokeLinecap="round" />
          <path d="M68 68C60 76 48 77 42 70C50 64 60 63 68 68Z" fill="#C5A16B" />
          <path d="M54 50C44 56 34 55 30 48C38 43 47 44 54 50Z" fill="#C5A16B" />
          <path d="M72 64C78 54 77 44 70 39C65 48 66 57 72 64Z" fill="#C5A16B" />
        </svg>
        <div className="relative max-w-prose">
          <h2 id="resultados-secretos" className="text-base font-bold text-[#C5A16B] sm:text-lg">
            Os resultados são secretos
          </h2>
          <p className="mt-2.5 text-sm leading-relaxed text-mint-100">
            O organizador não tem acesso a quem tirou quem. Cada participante consulta o próprio
            resultado pelo link individual.
          </p>
        </div>
      </section>

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
