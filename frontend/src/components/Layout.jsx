import { Link, Outlet } from 'react-router-dom';
import { Gift } from 'lucide-react';

/** Ramo botânico natalino minimalista para áreas vazias laterais (telas largas). */
function CornerSprig({ className = '' }) {
  return (
    <svg
      viewBox="0 0 160 160"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={`pointer-events-none select-none ${className}`}
    >
      {/* Haste principal */}
      <path
        d="M148 16C116 34 88 64 62 104"
        stroke="#A9B7A0"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Folhas botânicas minimalistas */}
      <path d="M126 30C114 22 102 22 96 30C106 36 118 36 126 30Z" fill="#A9B7A0" opacity="0.55" />
      <path d="M132 34C140 46 138 58 129 63C124 52 125 41 132 34Z" fill="#A9B7A0" opacity="0.45" />
      <path d="M104 54C91 48 79 49 74 58C85 63 96 62 104 54Z" fill="#A9B7A0" opacity="0.55" />
      <path d="M107 58C114 70 112 83 102 88C97 77 99 66 107 58Z" fill="#A9B7A0" opacity="0.45" />
      <path d="M82 80C69 75 58 78 54 87C65 91 75 89 82 80Z" fill="#A9B7A0" opacity="0.5" />
      <path d="M83 84C88 96 84 108 75 112C71 101 74 91 83 84Z" fill="#A9B7A0" opacity="0.4" />
      {/* Pequenas bagas Cranberry */}
      <circle cx="112" cy="46" r="3" fill="#A83D46" opacity="0.55" />
      <circle cx="118" cy="51" r="2.5" fill="#A83D46" opacity="0.45" />
      <circle cx="88" cy="73" r="2.8" fill="#A83D46" opacity="0.5" />
      {/* Estrela discreta em Antique Gold */}
      <path
        d="M44 44L46.2 49.8L52 52L46.2 54.2L44 60L41.8 54.2L36 52L41.8 49.8L44 44Z"
        fill="#C5A16B"
        opacity="0.65"
      />
      <circle cx="30" cy="74" r="1.8" fill="#C5A16B" opacity="0.55" />
    </svg>
  );
}

/** Detalhe botânico minimalista para o rodapé. */
function FooterOrnament() {
  return (
    <svg
      viewBox="0 0 120 18"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className="mx-auto mb-2.5 h-4 w-28"
    >
      <path d="M12 9H46" stroke="#A9B7A0" strokeWidth="1.2" strokeLinecap="round" opacity="0.65" />
      <path d="M74 9H108" stroke="#A9B7A0" strokeWidth="1.2" strokeLinecap="round" opacity="0.65" />
      <path d="M46 9C42 5 36 5 33 9C36 13 42 13 46 9Z" fill="#A9B7A0" opacity="0.5" />
      <path d="M74 9C78 5 84 5 87 9C84 13 78 13 74 9Z" fill="#A9B7A0" opacity="0.5" />
      <path
        d="M60 2.5L61.7 7.3L66.5 9L61.7 10.7L60 15.5L58.3 10.7L53.5 9L58.3 7.3L60 2.5Z"
        fill="#C5A16B"
        opacity="0.85"
      />
    </svg>
  );
}

/** Estrutura comum das páginas: cabeçalho limpo, ornamentos discretos, conteúdo e rodapé. */
export default function Layout() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-x-clip">
      {/* Ornamentos botânicos discretos restritos às áreas vazias laterais em telas largas */}
      <CornerSprig className="fixed top-16 right-0 z-0 hidden h-44 w-44 opacity-60 lg:block" />
      <CornerSprig className="fixed bottom-4 left-0 z-0 hidden h-44 w-44 rotate-180 opacity-50 lg:block" />

      <header className="sticky top-0 z-20 border-b border-sage/35 bg-warm-white/92 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3.5">
          <Link
            to="/"
            className="flex items-center gap-2.5 rounded-xl font-bold tracking-tight text-pine-900 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-pine-700"
          >
            <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-pine-800 text-warm-white">
              <Gift className="h-5 w-5" aria-hidden="true" />
              <span
                aria-hidden="true"
                className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-warm-white bg-gold-500"
              />
            </span>
            <span className="text-lg">Amigo Secreto</span>
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-3xl flex-1 px-4 py-7 sm:py-11">
        <Outlet />
      </main>

      <footer className="relative z-10 px-4 py-7 text-center text-sm text-charcoal-soft">
        <FooterOrnament />
        Amigo Secreto · feito para celebrar o Natal à distância
      </footer>
    </div>
  );
}
