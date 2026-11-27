/**
 * Etiqueta física de presente (gift tag) posicionada na horizontal,
 * em Cranberry (#A83D46), com detalhes dourados minimalistas (#D99A35),
 * extremidade direita chanfrada, furo vazado com ilhós e cordão Antique Gold (#C5A16B).
 * O conjunto completo (etiqueta + cordão) é centralizado horizontalmente como peça única.
 */
export default function GiftTag({
  receiverName,
  ariaLabelledBy = 'resultado',
  closing = false,
  ref,
}) {
  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="region"
      aria-labelledby={ariaLabelledBy}
      className={`${
        closing ? 'gift-tag-closing pointer-events-none' : 'gift-tag-reveal'
      } mx-auto mt-4 flex w-full max-w-[480px] items-stretch pl-7 outline-none focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-pine-700 [filter:drop-shadow(0_4px_5px_var(--color-tag-shadow))] sm:pl-8`}
    >
      {/* Corpo retangular principal à esquerda */}
      <div className="relative flex min-h-[112px] flex-1 items-center justify-center rounded-l-2xl bg-[var(--color-tag-bg)] px-6 py-7 text-center sm:min-h-[124px] sm:px-9 sm:py-8">
        {/* Pequenos detalhes decorativos dourados próximos às extremidades */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <svg
            viewBox="0 0 12 12"
            className="absolute top-3.5 left-4 h-2.5 w-2.5 opacity-85"
            fill="var(--color-tag-detail)"
          >
            <path d="M6 0L7.3 4.7L12 6L7.3 7.3L6 12L4.7 7.3L0 6L4.7 4.7Z" />
          </svg>
          <span className="absolute top-6 left-8 h-1 w-1 rounded-full bg-[var(--color-tag-detail)]/70" />
          <span className="absolute bottom-4 left-5 h-1 w-1 rounded-full bg-[var(--color-tag-detail)]/60" />

          <span className="absolute top-4 right-2 h-1 w-1 rounded-full bg-[var(--color-tag-detail)]/65" />
          <svg
            viewBox="0 0 12 12"
            className="absolute right-1.5 bottom-3.5 h-2 w-2 opacity-80"
            fill="var(--color-tag-detail)"
          >
            <path d="M6 0L7.3 4.7L12 6L7.3 7.3L6 12L4.7 7.3L0 6L4.7 4.7Z" />
          </svg>
        </div>

        <p
          className={`relative text-3xl font-bold tracking-tight break-words text-[var(--color-tag-text)] transition-opacity duration-100 sm:text-4xl ${
            closing ? 'opacity-0' : 'opacity-100'
          }`}
        >
          {closing ? '' : receiverName}
        </p>
      </div>

      {/* Extremidade direita chanfrada + furo real vazado + cordão dourado */}
      <div className="relative -ml-px w-[94px] flex-none">
        <svg
          viewBox="0 0 94 120"
          preserveAspectRatio="none"
          aria-hidden="true"
          focusable="false"
          className="absolute inset-0 h-full w-full"
          style={{
            maskImage: 'radial-gradient(circle 8px at 34px 50%, transparent 95%, #000 100%)',
            WebkitMaskImage:
              'radial-gradient(circle 8px at 34px 50%, transparent 95%, #000 100%)',
          }}
        >
          <path
            fill="var(--color-tag-bg)"
            d="M0 0 H8 Q14 0 18 4 L51 38 Q54 41 54 46 V74 Q54 79 51 82 L18 116 Q14 120 8 120 H0 Z"
          />
        </svg>

        {/* Ilhós 1:1 sem distorção + cordão preso ao furo */}
        <svg
          viewBox="0 0 94 48"
          aria-hidden="true"
          focusable="false"
          className="pointer-events-none absolute top-1/2 left-0 h-[48px] w-[94px] -translate-y-1/2"
        >
          {/* Alça traseira do cordão saindo pela direita da etiqueta */}
          <path
            d="M54 18 C74 11, 92 14, 92 24 C92 34, 74 37, 54 30"
            fill="none"
            stroke="var(--color-tag-cord-back)"
            strokeWidth="2.8"
            strokeLinecap="round"
          />

          {/* Ilhós discreto */}
          <circle
            cx="34"
            cy="24"
            r="9"
            fill="none"
            stroke="var(--color-tag-cord)"
            strokeWidth="2.2"
          />

          {/* Cordão frontal passando por dentro do furo até a borda direita */}
          <path
            d="M42 24 C48 22, 52 21, 57 23"
            fill="none"
            stroke="var(--color-tag-cord)"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M42 24 C48 26, 52 27, 57 25"
            fill="none"
            stroke="var(--color-gold-400)"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <rect x="53.5" y="20" width="4.5" height="8" rx="2.25" fill="var(--color-tag-cord)" />
        </svg>
      </div>
    </div>
  );
}
