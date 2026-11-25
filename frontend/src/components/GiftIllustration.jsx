/**
 * Ilustração vetorial flat de presentes natalinos.
 * - `variant="trio"`: três presentes coloridos (pinheiro, cereja e menta) com laços dourados,
 *   ideal para posicionar acima do card principal.
 * - `variant="single"`: presente único compacto para estados secundários.
 */
export default function GiftIllustration({
  variant = 'single',
  opened = false,
  className = '',
}) {
  if (variant === 'trio') {
    return (
      <svg viewBox="0 0 280 112" className={className} aria-hidden="true" focusable="false">
        {/* Presente esquerdo (verde menta + laço dourado) */}
        <g transform="rotate(-9 58 76)">
          <rect x="20" y="48" width="66" height="52" rx="10" fill="#BFEBD6" />
          <rect x="16" y="38" width="74" height="16" rx="6" fill="#9EDAC0" />
          <rect x="47" y="38" width="12" height="62" fill="#E5A93B" />
          <path d="M53 38c-5-11-20-15-22-6-2 7 11 8 22 6Z" fill="#F4C45D" />
          <path d="M53 38c5-11 20-15 22-6 2 7-11 8-22 6Z" fill="#E5A93B" />
        </g>

        {/* Presente direito (vermelho cereja + laço dourado) */}
        <g transform="rotate(9 222 76)">
          <rect x="194" y="48" width="66" height="52" rx="10" fill="#C62B3A" />
          <rect x="190" y="38" width="74" height="16" rx="6" fill="#9E1F2C" />
          <rect x="221" y="38" width="12" height="62" fill="#F4C45D" />
          <path d="M227 38c-5-11-20-15-22-6-2 7 11 8 22 6Z" fill="#F4C45D" />
          <path d="M227 38c5-11 20-15 22-6 2 7-11 8-22 6Z" fill="#E5A93B" />
        </g>

        {/* Presente central (verde pinheiro + fita cereja/dourado) */}
        <g>
          {/* Brilho dourado sutil ao revelar */}
          <g className={`gift-glow ${opened ? 'gift-glow-open' : ''}`}>
            <ellipse cx="140" cy="40" rx="34" ry="10" fill="#FEF5DC" />
            <circle cx="96" cy="20" r="3" fill="#F4C45D" />
            <circle cx="184" cy="18" r="2.5" fill="#C62B3A" />
          </g>

          <rect x="96" y="42" width="88" height="64" rx="12" fill="#1F6E53" />
          <rect x="132" y="42" width="16" height="64" fill="#F4C45D" />

          <g className={`gift-lid ${opened ? 'gift-lid-open' : ''}`}>
            <rect x="90" y="28" width="100" height="20" rx="8" fill="#16523E" />
            <rect x="132" y="28" width="16" height="20" fill="#F4C45D" />
            <path d="M140 28c-6-14-24-18-27-8-2 8 13 9 27 8Z" fill="#C62B3A" />
            <path d="M140 28c6-14 24-18 27-8 2 8-13 9-27 8Z" fill="#9E1F2C" />
            <circle cx="140" cy="28" r="5" fill="#F4C45D" />
          </g>
        </g>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true" focusable="false">
      <ellipse cx="60" cy="108" rx="38" ry="4" className="fill-mint-100" />
      <g className={`gift-glow ${opened ? 'gift-glow-open' : ''}`}>
        <ellipse cx="60" cy="52" rx="30" ry="9" className="fill-gold-100" />
      </g>
      <rect x="22" y="52" width="76" height="52" rx="12" className="fill-pine-700" />
      <rect x="53" y="52" width="14" height="52" className="fill-gold-400" />
      <g className={`gift-lid ${opened ? 'gift-lid-open' : ''}`}>
        <rect x="16" y="36" width="88" height="20" rx="8" className="fill-pine-800" />
        <rect x="53" y="36" width="14" height="20" className="fill-gold-400" />
        <path d="M60 36c-6-13-24-18-27-8-2 8 13 9 27 8Z" className="fill-berry-600" />
        <path d="M60 36c6-13 24-18 27-8 2 8-13 9-27 8Z" className="fill-berry-700" />
        <circle cx="60" cy="36" r="5" className="fill-gold-400" />
      </g>
    </svg>
  );
}
