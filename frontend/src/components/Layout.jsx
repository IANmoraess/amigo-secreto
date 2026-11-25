import { Link, Outlet } from 'react-router-dom';
import { Gift } from 'lucide-react';

/** Estrutura comum das páginas: cabeçalho limpo, conteúdo e rodapé. */
export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-neutral-200/70 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3.5">
          <Link
            to="/"
            className="flex items-center gap-2.5 rounded-xl font-bold tracking-tight text-pine-900 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-pine-700"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-pine-800 text-white">
              <Gift className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="text-lg">Amigo Secreto</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-7 sm:py-11">
        <Outlet />
      </main>

      <footer className="px-4 py-6 text-center text-sm text-neutral-500">
        Amigo Secreto · feito para celebrar o Natal à distância
      </footer>
    </div>
  );
}
