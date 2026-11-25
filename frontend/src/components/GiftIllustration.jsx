/** Ilustração decorativa de presente que abre a tampa quando `opened` é verdadeiro. */
export default function GiftIllustration({ opened = false, className = '' }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true" focusable="false">
      <ellipse cx="60" cy="110" rx="40" ry="4" className="fill-pine-100" />

      {/* Brilho interno discreto quando o presente abre */}
      <ellipse
        cx="60"
        cy="54"
        rx="30"
        ry="10"
        className={`fill-gold-100 gift-glow ${opened ? 'gift-glow-open' : ''}`}
      />

      {/* Base da caixa */}
      <rect x="20" y="54" width="80" height="52" rx="8" className="fill-pine-700" />
      <rect x="54" y="54" width="12" height="52" className="fill-berry-600" />

      {/* Tampa + laço */}
      <g className={`gift-lid ${opened ? 'gift-lid-open' : ''}`}>
        <rect x="14" y="38" width="92" height="20" rx="6" className="fill-pine-800" />
        <rect x="54" y="38" width="12" height="20" className="fill-berry-600" />
        <path d="M60 38C54 24 34 18 31 29c-2.5 9 15 10 29 9Z" className="fill-berry-600" />
        <path d="M60 38c6-14 26-20 29-9 2.5 9-15 10-29 9Z" className="fill-berry-700" />
        <circle cx="60" cy="38" r="5" className="fill-berry-700" />
      </g>
    </svg>
  );
}
