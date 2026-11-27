/**
 * Ilustração vetorial flat de boneco de neve natalino para estados amigáveis de indisponibilidade.
 */
export default function SnowmanIllustration({ className = '' }) {
  return (
    <svg
      viewBox="0 0 140 140"
      fill="none"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {/* Sombra e monte suave de neve */}
      <ellipse cx="70" cy="124" rx="44" ry="7" fill="var(--color-gift-shadow)" />
      <ellipse cx="70" cy="121" rx="34" ry="6" fill="#E4EAE0" />

      {/* Estrelinhas decorativas sutis */}
      <path
        d="M24 44L25.6 48.4L30 50L25.6 51.6L24 56L22.4 51.6L18 50L22.4 48.4L24 44Z"
        fill="var(--color-gift-gold)"
        opacity="0.75"
      />
      <circle cx="114" cy="40" r="2.5" fill="var(--color-gift-gold)" opacity="0.6" />
      <circle cx="118" cy="76" r="2" fill="var(--color-gift-ribbon)" opacity="0.45" />

      {/* Galhos / braços */}
      <path
        d="M42 84L22 72M28 76L24 68M26 75L19 77"
        stroke="#8F6D3B"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M98 84L118 72M112 76L116 68M114 75L121 77"
        stroke="#8F6D3B"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Corpo inferior */}
      <circle cx="70" cy="94" r="28" fill="#F4F0E8" stroke="#D7DDD3" strokeWidth="1.5" />
      <path
        d="M47 108C53 116 62 120 71 120C82 120 92 114 96 104C89 112 79 116 69 116C59 116 52 113 47 108Z"
        fill="#E4EAE0"
      />

      {/* Botões do casaco */}
      <circle cx="70" cy="87" r="2.6" fill="var(--color-gift-lid)" />
      <circle cx="70" cy="98" r="2.6" fill="var(--color-gift-lid)" />

      {/* Cabeça */}
      <circle cx="70" cy="54" r="20" fill="#F4F0E8" stroke="#D7DDD3" strokeWidth="1.5" />

      {/* Bochechas rosadas suaves */}
      <ellipse cx="58" cy="57" rx="3.4" ry="2.1" fill="var(--color-gift-ribbon)" opacity="0.28" />
      <ellipse cx="82" cy="57" rx="3.4" ry="2.1" fill="var(--color-gift-ribbon)" opacity="0.28" />

      {/* Olhos */}
      <circle cx="63" cy="51" r="2.3" fill="#244638" />
      <circle cx="77" cy="51" r="2.3" fill="#244638" />

      {/* Nariz de cenoura */}
      <path d="M70 54L82 57.5L70 60Z" fill="#E87954" />

      {/* Sorriso gentil */}
      <path
        d="M64 62.5C66.5 65 73.5 65 76 62.5"
        stroke="#244638"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Cachecol Cranberry */}
      <path
        d="M52 68C58 72.5 82 72.5 88 68C89.5 72 88.5 76.5 85 78C76 80.5 64 80.5 55 78C51.5 76.5 50.5 72 52 68Z"
        fill="var(--color-gift-ribbon)"
      />
      <rect x="74" y="74" width="9" height="16" rx="4" fill="var(--color-gift-ribbon-fold)" />
      <rect x="75.5" y="75" width="6" height="13" rx="3" fill="var(--color-gift-ribbon)" />

      {/* Gorro natalino em verde pinho com pompom dourado */}
      <path
        d="M52 40C53 26 62 20 71 20C80 20 87 27 88 40H52Z"
        fill="var(--color-gift-body)"
      />
      <rect x="49" y="37" width="42" height="7" rx="3.5" fill="var(--color-gift-lid)" />
      <circle cx="71" cy="18" r="4.5" fill="var(--color-gift-gold)" />
    </svg>
  );
}
