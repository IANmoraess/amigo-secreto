/**
 * Ilustração vetorial flat de presentes natalinos.
 * - `variant="trio"`: três presentes na paleta natalina, usado acima do card inicial.
 * - `variant="hero"`: presente principal centralizado da tela de revelação, com
 *   estados animados (`idle`, `charging`, `opened`), projeção vertical de luz
 *   recortada exatamente às bordas da caixa e partículas luminosas contínuas.
 * - `variant="single"`: presente compacto para estados secundários.
 */
export default function GiftIllustration({
  variant = 'single',
  opened = false,
  state,
  className = '',
}) {
  if (variant === 'hero') {
    const heroState = state ?? (opened ? 'opened' : 'idle');

    return (
      <svg
        viewBox="0 0 200 190"
        className={`gift-state-${heroState} overflow-visible ${className}`}
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          {/* Recorte trapezoidal suave: concentrado na abertura (x=48..152) e expandindo para cima (x=18..182) */}
          <clipPath id="gift-light-clip">
            <polygon points="18,0 182,0 152,98 48,98" />
          </clipPath>

          {/* Coluna vertical principal de luz projetada de dentro da abertura */}
          <linearGradient id="gift-shaft-vertical" x1="50%" y1="100%" x2="50%" y2="0%">
            <stop offset="0%" stopColor="#FFF9DF" stopOpacity="1" />
            <stop offset="20%" stopColor="#FFE184" stopOpacity="0.95" />
            <stop offset="52%" stopColor="#EBB445" stopOpacity="0.6" />
            <stop offset="82%" stopColor="#D99A35" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#D99A35" stopOpacity="0" />
          </linearGradient>

          {/* Núcleo central ainda mais luminoso projetado para cima */}
          <linearGradient id="gift-center-beam" x1="50%" y1="100%" x2="50%" y2="0%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
            <stop offset="26%" stopColor="#FFF0B8" stopOpacity="0.95" />
            <stop offset="60%" stopColor="#F5C353" stopOpacity="0.52" />
            <stop offset="100%" stopColor="#D99A35" stopOpacity="0" />
          </linearGradient>

          {/* Faixa vertical nítida acompanhando a borda esquerda da caixa */}
          <linearGradient id="gift-edge-left" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#E5A938" stopOpacity="0.9" />
            <stop offset="32%" stopColor="#FFE086" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#FFE086" stopOpacity="0" />
          </linearGradient>

          {/* Faixa vertical nítida acompanhando a borda direita da caixa */}
          <linearGradient id="gift-edge-right" x1="100%" y1="50%" x2="0%" y2="50%">
            <stop offset="0%" stopColor="#E5A938" stopOpacity="0.9" />
            <stop offset="32%" stopColor="#FFE086" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#FFE086" stopOpacity="0" />
          </linearGradient>

          {/* Máscara vertical suave para as faixas laterais e feixes internos */}
          <linearGradient id="gift-vertical-fade" x1="50%" y1="100%" x2="50%" y2="0%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
            <stop offset="55%" stopColor="#FFFFFF" stopOpacity="0.72" />
            <stop offset="88%" stopColor="#FFFFFF" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>

          <mask id="gift-edge-fade-mask">
            <rect x="0" y="0" width="200" height="98" fill="url(#gift-vertical-fade)" />
          </mask>

          {/* Flash intenso na boca interna da caixa */}
          <linearGradient id="gift-opening-flash" x1="50%" y1="100%" x2="50%" y2="0%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
            <stop offset="45%" stopColor="#FFE79A" stopOpacity="0.92" />
            <stop offset="100%" stopColor="#EAB243" stopOpacity="0" />
          </linearGradient>

          {/* Pequena luz escapando pela fresta no final da preparação */}
          <linearGradient id="gift-charge-leak" x1="50%" y1="100%" x2="50%" y2="0%">
            <stop offset="0%" stopColor="#FFF5CC" stopOpacity="0.95" />
            <stop offset="55%" stopColor="#F5C353" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#D99A35" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Sombra suave sob a caixa */}
        <ellipse
          cx="100"
          cy="172"
          rx="52"
          ry="7.5"
          className="gift-hero-shadow fill-pine-900/15"
        />

        {/* Corpo + luz recortada + partículas + tampa agrupados para movimento coeso */}
        <g className="gift-hero-box">
          {/* Interior escuro da caixa: recuado e contido sob a tampa fechada, limpo ao abrir */}
          <path
            d="M50.5 95H149.5Q151 95 151 96.5V98.5H49V96.5Q49 95 50.5 95Z"
            fill="#18372D"
          />

          {/* Iluminação projetada em leque trapezoidal suave a partir da abertura da caixa */}
          <g clipPath="url(#gift-light-clip)">
            {/* Vazamento crescente de luz nos instantes finais do tremor */}
            <polygon
              points="40,72 160,72 152,98 48,98"
              fill="url(#gift-charge-leak)"
              className="gift-light-charge-leak"
            />

            {/* Grupo principal da luz aberta: feixe trapezoidal, faixas em leque, núcleo central e flash */}
            <g className="gift-light-shaft">
              {/* Camada 1: feixe trapezoidal principal de luz dourada */}
              <polygon
                points="18,0 182,0 152,98 48,98"
                fill="url(#gift-shaft-vertical)"
                className="gift-light-column"
              />

              {/* Camada 2: faixas laterais acompanhando a abertura suave do feixe */}
              <g mask="url(#gift-edge-fade-mask)" className="gift-light-edges">
                <polygon points="18,0 38,0 64,98 48,98" fill="url(#gift-edge-left)" />
                <polygon points="162,0 182,0 152,98 136,98" fill="url(#gift-edge-right)" />
                {/* Filetes inclinados sutis demarcando a expansão suave do feixe */}
                <polygon points="18,0 20.5,0 50,98 48,98" fill="#F2BE52" opacity="0.7" />
                <polygon points="179.5,0 182,0 152,98 150,98" fill="#F2BE52" opacity="0.7" />

                {/* Feixes internos abrindo em leque suave */}
                <polygon
                  points="52,4 62,4 73,98 66,98"
                  fill="#FFF2BE"
                  className="gift-light-streak gift-light-streak-a"
                />
                <polygon
                  points="87,0 113,0 107,98 93,98"
                  fill="#FFFFFF"
                  className="gift-light-streak gift-light-streak-b"
                />
                <polygon
                  points="138,6 148,6 134,98 127,98"
                  fill="#FFF2BE"
                  className="gift-light-streak gift-light-streak-c"
                />
              </g>

              {/* Camada 3: núcleo central mais luminoso abrindo para cima */}
              <polygon
                points="52,6 148,6 130,98 70,98"
                fill="url(#gift-center-beam)"
                className="gift-light-core"
              />

              {/* Camada 4: fonte intensa concentrada na boca da abertura */}
              <polygon
                points="41,74 159,74 152,98 48,98"
                fill="url(#gift-opening-flash)"
                className="gift-light-mouth"
              />

              {/* Camada 5: flash inicial brilhante no instante em que a tampa se abre */}
              <polygon
                points="18,0 182,0 152,98 48,98"
                fill="#FFF8DF"
                className="gift-light-flash"
              />
            </g>
          </g>

          {/* Explosão inicial de partículas subindo a partir da abertura */}
          <g>
            <circle
              cx="66"
              cy="92"
              r="3.2"
              fill="#D99A35"
              className="gift-hero-spark"
              style={{ '--spark-x': '-14px', '--spark-y': '-68px', '--spark-delay': '20ms' }}
            />
            <rect
              x="130"
              y="90"
              width="4.8"
              height="4.8"
              rx="1.2"
              fill="#C7474F"
              className="gift-hero-spark"
              style={{
                '--spark-x': '14px',
                '--spark-y': '-64px',
                '--spark-rot': '75deg',
                '--spark-delay': '40ms',
              }}
            />
            <circle
              cx="84"
              cy="92"
              r="3"
              fill="#E87954"
              className="gift-hero-spark"
              style={{ '--spark-x': '-10px', '--spark-y': '-82px', '--spark-delay': '55ms' }}
            />
            <rect
              x="114"
              y="90"
              width="4.6"
              height="4.6"
              rx="1"
              fill="#D99A35"
              className="gift-hero-spark"
              style={{
                '--spark-x': '10px',
                '--spark-y': '-84px',
                '--spark-rot': '-55deg',
                '--spark-delay': '30ms',
              }}
            />
            <circle
              cx="56"
              cy="92"
              r="2.6"
              fill="#EAB243"
              className="gift-hero-spark"
              style={{ '--spark-x': '-6px', '--spark-y': '-52px', '--spark-delay': '75ms' }}
            />
            <circle
              cx="144"
              cy="92"
              r="2.6"
              fill="#EAB243"
              className="gift-hero-spark"
              style={{ '--spark-x': '6px', '--spark-y': '-54px', '--spark-delay': '60ms' }}
            />
            <path
              d="M100 86L101.6 89.4L105 91L101.6 92.6L100 96L98.4 92.6L95 91L98.4 89.4L100 86Z"
              fill="#D99A35"
              className="gift-hero-spark"
              style={{
                '--spark-x': '0px',
                '--spark-y': '-88px',
                '--spark-rot': '45deg',
                '--spark-delay': '15ms',
              }}
            />
          </g>

          {/* Partículas luminosas contínuas em loop saindo de dentro da caixa */}
          <g>
            <circle
              cx="82"
              cy="94"
              r="2.9"
              fill="#EAB243"
              className="gift-hero-ember"
              style={{
                '--ember-x': '-6px',
                '--ember-sway': '5px',
                '--ember-y': '-76px',
                '--ember-dur': '2.4s',
                '--ember-delay': '0.05s',
              }}
            />
            <circle
              cx="118"
              cy="94"
              r="2.6"
              fill="#D99A35"
              className="gift-hero-ember"
              style={{
                '--ember-x': '6px',
                '--ember-sway': '-6px',
                '--ember-y': '-80px',
                '--ember-dur': '2.8s',
                '--ember-delay': '0.5s',
              }}
            />
            <path
              d="M100 89.5L101.8 93.2L105.5 95L101.8 96.8L100 100.5L98.2 96.8L94.5 95L98.2 93.2L100 89.5Z"
              fill="#D99A35"
              className="gift-hero-ember"
              style={{
                '--ember-x': '2px',
                '--ember-sway': '-5px',
                '--ember-y': '-88px',
                '--ember-dur': '2.6s',
                '--ember-delay': '0.25s',
              }}
            />
            <circle
              cx="66"
              cy="95"
              r="2.4"
              fill="#E87954"
              className="gift-hero-ember"
              style={{
                '--ember-x': '-4px',
                '--ember-sway': '5px',
                '--ember-y': '-68px',
                '--ember-dur': '3.1s',
                '--ember-delay': '1.0s',
              }}
            />
            <circle
              cx="134"
              cy="95"
              r="2.4"
              fill="#C5A16B"
              className="gift-hero-ember"
              style={{
                '--ember-x': '4px',
                '--ember-sway': '-5px',
                '--ember-y': '-70px',
                '--ember-dur': '2.7s',
                '--ember-delay': '1.35s',
              }}
            />
            <rect
              x="90"
              y="93"
              width="3.8"
              height="3.8"
              rx="0.9"
              fill="#D99A35"
              className="gift-hero-ember"
              style={{
                '--ember-x': '-5px',
                '--ember-sway': '6px',
                '--ember-y': '-84px',
                '--ember-dur': '3.3s',
                '--ember-delay': '1.75s',
              }}
            />
            <path
              d="M111 90.5L112.4 93.6L115.5 95L112.4 96.4L111 99.5L109.6 96.4L106.5 95L109.6 93.6L111 90.5Z"
              fill="#EAB243"
              className="gift-hero-ember"
              style={{
                '--ember-x': '5px',
                '--ember-sway': '-5px',
                '--ember-y': '-74px',
                '--ember-dur': '2.3s',
                '--ember-delay': '0.85s',
              }}
            />
            <circle
              cx="96"
              cy="94"
              r="2.2"
              fill="#C7474F"
              className="gift-hero-ember"
              style={{
                '--ember-x': '-3px',
                '--ember-sway': '4px',
                '--ember-y': '-72px',
                '--ember-dur': '2.5s',
                '--ember-delay': '1.55s',
              }}
            />
            <circle
              cx="74"
              cy="95"
              r="2.1"
              fill="#FFF4CC"
              className="gift-hero-ember"
              style={{
                '--ember-x': '-2px',
                '--ember-sway': '4px',
                '--ember-y': '-62px',
                '--ember-dur': '2.2s',
                '--ember-delay': '2.0s',
              }}
            />
            <circle
              cx="126"
              cy="95"
              r="2.2"
              fill="#FFF4CC"
              className="gift-hero-ember"
              style={{
                '--ember-x': '2px',
                '--ember-sway': '-4px',
                '--ember-y': '-64px',
                '--ember-dur': '2.9s',
                '--ember-delay': '2.2s',
              }}
            />
          </g>

          {/* Estrelas cintilantes dentro da faixa vertical iluminada */}
          <g>
            <path
              d="M64 38L65.6 42.9L70.5 44.5L65.6 46.1L64 51L62.4 46.1L57.5 44.5L62.4 42.9L64 38Z"
              fill="#D99A35"
              className="gift-hero-twinkle"
              style={{ '--twinkle-dur': '2.2s', '--twinkle-delay': '0.15s' }}
            />
            <path
              d="M136 34L137.5 38.5L142 40L137.5 41.5L136 46L134.5 41.5L130 40L134.5 38.5L136 34Z"
              fill="#EAB243"
              className="gift-hero-twinkle"
              style={{ '--twinkle-dur': '2.7s', '--twinkle-delay': '0.75s' }}
            />
            <path
              d="M101 14L102.5 18.5L107 20L102.5 21.5L101 26L99.5 21.5L95 20L99.5 18.5L101 14Z"
              fill="#D99A35"
              className="gift-hero-twinkle"
              style={{ '--twinkle-dur': '2.4s', '--twinkle-delay': '0.4s' }}
            />
            <path
              d="M122 58L123.1 61.4L126.5 62.5L123.1 63.6L122 67L120.9 63.6L117.5 62.5L120.9 61.4L122 58Z"
              fill="#FFF4CC"
              className="gift-hero-twinkle"
              style={{ '--twinkle-dur': '2.9s', '--twinkle-delay': '1.15s' }}
            />
          </g>

          {/* Corpo principal da caixa: cantos superiores discretos (r=2) para encaixe reto sob a tampa e base arredondada (r=14) */}
          <path
            d="M48 96H152Q154 96 154 98V156A14 14 0 0 1 140 170H60A14 14 0 0 1 46 156V98Q46 96 48 96Z"
            fill="#244638"
          />
          <rect x="89" y="96" width="22" height="74" fill="#A83D46" />
          <rect x="89" y="96" width="2" height="74" fill="#C5A16B" opacity="0.8" />
          <rect x="109" y="96" width="2" height="74" fill="#C5A16B" opacity="0.8" />

          {/* Fresta luminosa estritamente dentro da largura da caixa durante o tremor */}
          <rect
            x="48"
            y="95.5"
            width="104"
            height="4"
            rx="2"
            fill="#FFE08A"
            className="gift-hero-seam"
          />

          {/* Tampa e laço (Deep Pine + Cranberry + Antique Gold) */}
          <g className="gift-hero-lid">
            <rect x="38" y="72" width="124" height="27" rx="9" fill="#18372D" />
            <rect x="89" y="72" width="22" height="27" fill="#A83D46" />
            <rect x="89" y="72" width="2" height="27" fill="#C5A16B" opacity="0.8" />
            <rect x="109" y="72" width="2" height="27" fill="#C5A16B" opacity="0.8" />

            {/* Laço esculpido */}
            <path
              d="M100 72c-8-18-32-24-35-10-3 10 17 12 35 10Z"
              fill="#A83D46"
            />
            <path
              d="M100 72c8-18 32-24 35-10 3 10-17 12-35 10Z"
              fill="#8B2F37"
            />
            <path
              d="M99 71c-6-10-20-13-22-6-1 5 10 7 22 6Z"
              fill="#C5A16B"
              opacity="0.35"
            />
            <path
              d="M101 71c6-10 20-13 22-6 1 5-10 7-22 6Z"
              fill="#C5A16B"
              opacity="0.28"
            />
            <rect x="93" y="66" width="14" height="10" rx="5" fill="#C5A16B" />
          </g>
        </g>
      </svg>
    );
  }

  if (variant === 'trio') {
    return (
      <svg viewBox="0 0 280 112" className={className} aria-hidden="true" focusable="false">
        {/* Presente esquerdo (Muted Sage + laço e faixa inteiramente dourados) */}
        <g transform="rotate(-9 58 76)">
          <path
            d="M22 51H84Q86 51 86 53V90A10 10 0 0 1 76 100H30A10 10 0 0 1 20 90V53Q20 51 22 51Z"
            fill="#A9B7A0"
          />
          <rect x="16" y="38" width="74" height="16" rx="6" fill="#92A388" />
          <rect x="20" y="54" width="66" height="2" fill="#98A88E" />
          <rect x="47" y="38" width="12" height="62" fill="#C5A16B" />
          <rect x="47" y="54" width="12" height="2" fill="#B28C55" opacity="0.55" />
          <path d="M53 38c-5-11-20-15-22-6-2 7 11 8 22 6Z" fill="#D7B98A" />
          <path d="M53 38c5-11 20-15 22-6 2 7-11 8-22 6Z" fill="#C5A16B" />
          <rect x="48" y="34" width="10" height="7" rx="3.5" fill="#B58E56" />
        </g>

        {/* Presente direito (Cranberry + laço e faixa inteiramente dourados) */}
        <g transform="rotate(9 222 76)">
          <path
            d="M196 51H258Q260 51 260 53V90A10 10 0 0 1 250 100H204A10 10 0 0 1 194 90V53Q194 51 196 51Z"
            fill="#A83D46"
          />
          <rect x="190" y="38" width="74" height="16" rx="6" fill="#8F3139" />
          <rect x="194" y="54" width="66" height="2" fill="#97343C" />
          <rect x="221" y="38" width="12" height="62" fill="#C5A16B" />
          <rect x="221" y="54" width="12" height="2" fill="#B28C55" opacity="0.55" />
          <path d="M227 38c-5-11-20-15-22-6-2 7 11 8 22 6Z" fill="#D7B98A" />
          <path d="M227 38c5-11 20-15 22-6 2 7-11 8-22 6Z" fill="#C5A16B" />
          <rect x="222" y="34" width="10" height="7" rx="3.5" fill="#B58E56" />
        </g>

        {/* Presente central (Forest Green + tampa Deep Pine + laço e faixa inteiramente dourados) */}
        <g>
          <g className={`gift-glow ${opened ? 'gift-glow-open' : ''}`}>
            <ellipse cx="140" cy="40" rx="34" ry="10" fill="#F5ECD9" />
            <circle cx="96" cy="20" r="3" fill="#C5A16B" />
            <circle cx="184" cy="18" r="2.5" fill="#A83D46" />
          </g>

          <path
            d="M98 46H182Q184 46 184 48V94A12 12 0 0 1 172 106H108A12 12 0 0 1 96 94V48Q96 46 98 46Z"
            fill="#244638"
          />
          <rect x="96" y="48" width="88" height="2.2" fill="#1E3C30" />
          <rect x="132" y="46" width="16" height="60" fill="#C5A16B" />
          <rect x="132" y="48" width="16" height="2.2" fill="#B28C55" opacity="0.55" />

          <g className={`gift-lid ${opened ? 'gift-lid-open' : ''}`}>
            <rect x="90" y="28" width="100" height="20" rx="8" fill="#1A382D" />
            <rect x="132" y="28" width="16" height="20" fill="#C5A16B" />
            <path d="M140 28c-6-14-24-18-27-8-2 8 13 9 27 8Z" fill="#D7B98A" />
            <path d="M140 28c6-14 24-18 27-8 2 8-13 9-27 8Z" fill="#C5A16B" />
            <rect x="134" y="23.5" width="12" height="8.5" rx="4.25" fill="#B58E56" />
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
      <rect x="22" y="52" width="76" height="52" rx="12" className="fill-pine-800" />
      <rect x="53" y="52" width="14" height="52" className="fill-gold-500" />
      <g className={`gift-lid ${opened ? 'gift-lid-open' : ''}`}>
        <rect x="16" y="36" width="88" height="20" rx="8" className="fill-pine-900" />
        <rect x="53" y="36" width="14" height="20" className="fill-gold-500" />
        <path d="M60 36c-6-13-24-18-27-8-2 8 13 9 27 8Z" className="fill-berry-600" />
        <path d="M60 36c6-13 24-18 27-8 2 8-13 9-27 8Z" className="fill-berry-700" />
        <circle cx="60" cy="36" r="5" className="fill-gold-500" />
      </g>
    </svg>
  );
}
