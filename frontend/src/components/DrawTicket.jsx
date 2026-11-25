/**
 * Cartão/ticket minimalista de revelação em Modern Flat Design.
 * Contém exclusivamente o nome da pessoa sorteada, mantendo todas as
 * informações secundárias fora do ticket.
 */
export default function DrawTicket({ receiverName, ariaLabelledBy = 'resultado', ref }) {
  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="region"
      aria-labelledby={ariaLabelledBy}
      className="ticket-reveal relative mx-auto mt-4 max-w-md overflow-hidden rounded-2xl bg-pine-900 px-10 py-10 text-center shadow-[0_12px_28px_-14px_rgb(24_55_45/0.32)] outline-none sm:px-12 sm:py-11"
    >
      {/* Moldura interna discreta em Antique Gold */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-2.5 rounded-xl border border-gold-500/25"
      />

      {/* Recortes laterais característicos de ticket (na cor do card pai) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 -left-2 flex flex-col justify-center gap-2.5"
      >
        <span className="h-3.5 w-3.5 rounded-full bg-warm-white" />
        <span className="h-3.5 w-3.5 rounded-full bg-warm-white" />
        <span className="h-3.5 w-3.5 rounded-full bg-warm-white" />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 -right-2 flex flex-col justify-center gap-2.5"
      >
        <span className="h-3.5 w-3.5 rounded-full bg-warm-white" />
        <span className="h-3.5 w-3.5 rounded-full bg-warm-white" />
        <span className="h-3.5 w-3.5 rounded-full bg-warm-white" />
      </div>

      {/* Filete dourado natalino discreto */}
      <span
        aria-hidden="true"
        className="relative mx-auto mb-3.5 block h-1 w-10 rounded-full bg-gold-500"
      />

      <p className="relative text-3xl font-bold tracking-tight break-words text-warm-white sm:text-4xl">
        {receiverName}
      </p>
    </div>
  );
}
