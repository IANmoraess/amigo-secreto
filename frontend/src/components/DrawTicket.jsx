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
      className="ticket-reveal relative mx-auto mt-4 max-w-md overflow-hidden rounded-2xl bg-gradient-to-br from-pine-800 via-pine-700 to-pine-600 px-10 py-9 text-center shadow-[0_12px_28px_-10px_rgb(15_61_46/0.35)] outline-none sm:px-12 sm:py-10"
    >
      {/* Formas geométricas flat sutis para profundidade sem poluir o nome */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-10 -right-10 h-36 w-36 rounded-full bg-white/8"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-mint-200/12"
      />

      {/* Recortes laterais característicos de ticket (na cor do card pai) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 -left-2 flex flex-col justify-center gap-2.5"
      >
        <span className="h-3.5 w-3.5 rounded-full bg-white" />
        <span className="h-3.5 w-3.5 rounded-full bg-white" />
        <span className="h-3.5 w-3.5 rounded-full bg-white" />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 -right-2 flex flex-col justify-center gap-2.5"
      >
        <span className="h-3.5 w-3.5 rounded-full bg-white" />
        <span className="h-3.5 w-3.5 rounded-full bg-white" />
        <span className="h-3.5 w-3.5 rounded-full bg-white" />
      </div>

      {/* Linha dourada natalina discreta */}
      <span
        aria-hidden="true"
        className="mx-auto mb-3 block h-1 w-10 rounded-full bg-gold-400/90"
      />

      <p className="relative text-3xl font-bold tracking-tight break-words text-white sm:text-4xl">
        {receiverName}
      </p>
    </div>
  );
}
