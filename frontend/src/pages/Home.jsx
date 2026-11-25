import { Link } from 'react-router-dom';
import { Lock, Send, ShieldCheck, Shuffle, Sparkles, UserPlus, Users } from 'lucide-react';
import Card from '../components/Card.jsx';
import GiftIllustration from '../components/GiftIllustration.jsx';
import { buttonClasses } from '../components/Button.jsx';

const STEPS = [
  {
    Icon: UserPlus,
    badgeClasses: 'bg-mint-100 text-pine-800',
    title: 'Crie o evento',
    text: 'Escolha o nome da confraternização de Natal com a família ou amigos.',
  },
  {
    Icon: Users,
    badgeClasses: 'bg-gold-100 text-gold-600',
    title: 'Adicione os participantes',
    text: 'Cadastre todo mundo e confira a lista com calma antes de sortear.',
  },
  {
    Icon: Shuffle,
    badgeClasses: 'bg-berry-100 text-berry-600',
    title: 'Realize o sorteio',
    text: 'O sorteio acontece uma única vez e ninguém tira a si mesmo.',
  },
  {
    Icon: Send,
    badgeClasses: 'bg-mint-100 text-pine-800',
    title: 'Envie os links secretos',
    text: 'Cada pessoa recebe seu link privado para abrir o próprio ticket.',
  },
];

export default function Home() {
  return (
    <div className="space-y-9 sm:space-y-11">
      <title>Amigo Secreto</title>

      <div>
        <GiftIllustration
          variant="trio"
          className="relative z-0 mx-auto -mb-3.5 h-24 w-60 sm:h-28 sm:w-72"
        />

        <Card className="relative z-1 text-center">
          <div className="mx-auto inline-flex items-center gap-1.5 rounded-full bg-mint-50 px-3.5 py-1 text-xs font-semibold text-pine-800">
            <Lock className="h-3.5 w-3.5 text-berry-600" aria-hidden="true" />
            Amigo secreto de Natal · online e gratuito
          </div>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-balance text-pine-900 sm:text-4xl">
            Organize seu Amigo Secreto sem estresse
          </h1>
          <p className="mx-auto mt-3 max-w-prose text-pretty text-charcoal-soft">
            Reúna quem você ama mesmo à distância. Crie o grupo, faça o sorteio em segundos e
            envie um link secreto para cada participante.
          </p>

          <div className="mt-6 flex flex-col items-center gap-3">
            <Link
              to="/admin"
              className={buttonClasses({ variant: 'cranberry', className: 'w-full sm:w-auto' })}
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Acessar área do organizador
            </Link>
            <p className="text-xs text-charcoal-soft">
              Recebeu um link? Basta abri-lo para descobrir quem você tirou.
            </p>
          </div>
        </Card>
      </div>

      <section aria-labelledby="como-funciona">
        <h2 id="como-funciona" className="text-xl font-bold tracking-tight text-pine-900 sm:text-2xl">
          Como funciona
        </h2>
        <ol className="mt-4 grid gap-4 sm:grid-cols-2">
          {STEPS.map(({ Icon, badgeClasses, title, text }, index) => (
            <li
              key={title}
              style={{ '--stagger-index': index }}
              className="stagger-item flex gap-4 rounded-3xl border border-sage/30 bg-warm-white p-5 shadow-[0_6px_22px_-12px_rgb(24_55_45/0.09)]"
            >
              <div
                className={`relative flex h-12 w-12 flex-none items-center justify-center rounded-2xl ${badgeClasses}`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-pine-900 text-[11px] font-bold text-warm-white">
                  {index + 1}
                </span>
              </div>
              <div>
                <h3 className="font-bold text-pine-900">
                  <span className="sr-only">Passo {index + 1}: </span>
                  {title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-charcoal-soft">{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section
        aria-labelledby="privacidade"
        className="relative flex items-start gap-4 overflow-hidden rounded-3xl bg-pine-800 p-6 text-mint-50 shadow-[0_10px_28px_-14px_rgb(24_55_45/0.30)] sm:p-7"
      >
        <svg
          viewBox="0 0 96 96"
          fill="none"
          aria-hidden="true"
          focusable="false"
          className="pointer-events-none absolute -right-2 -bottom-2 h-24 w-24 opacity-15"
        >
          <path d="M88 88C68 74 52 54 38 26" stroke="#C5A16B" strokeWidth="2" strokeLinecap="round" />
          <path d="M68 68C60 76 48 77 42 70C50 64 60 63 68 68Z" fill="#C5A16B" />
          <path d="M54 50C44 56 34 55 30 48C38 43 47 44 54 50Z" fill="#C5A16B" />
          <path d="M72 64C78 54 77 44 70 39C65 48 66 57 72 64Z" fill="#C5A16B" />
        </svg>
        <span className="relative flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-warm-white/10 text-gold-400">
          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="relative">
          <h2 id="privacidade" className="font-bold text-warm-white">
            Segredo guardado de verdade
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-mint-100">
            O painel não mostra quem tirou quem. Cada participante acessa apenas o próprio ticket
            por meio de um link individual.
          </p>
        </div>
      </section>
    </div>
  );
}
