import { Link, Outlet } from 'react-router-dom';
import { Gift } from 'lucide-react';

/** Estrutura comum das páginas: cabeçalho fixo discreto, conteúdo e rodapé. */
export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-pine-100 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3.5">
          <Link
            to="/"
            className="flex items-center gap-2.5 rounded-lg font-semibold text-pine-900 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-pine-700"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-pine-800 text-white shadow-xs">
              <Gift className="h-5 w-5" aria-hidden="true" />
            </span>
            <span>Amigo Secreto</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:py-10">
        <Outlet />
      </main>

      <footer className="px-4 py-6 text-center text-sm text-neutral-600">
        Amigo Secreto · feito para aproximar quem está longe
      </footer>
    </div>
  );
}
