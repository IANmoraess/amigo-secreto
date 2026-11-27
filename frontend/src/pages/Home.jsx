import { Link } from 'react-router-dom';
import { Gift, Send, Shuffle, Sparkles, UserPlus, Users } from 'lucide-react';
import Card from '../components/Card.jsx';
import GiftIllustration from '../components/GiftIllustration.jsx';
import { buttonClasses } from '../components/Button.jsx';
import { loadParticipantToken } from '../services/participantSession.js';

const STEPS = [
  {
    number: '01',
    Icon: UserPlus,
    badgeClasses: 'bg-mint-100 text-pine-800',
    title: 'Crie o evento',
    text: 'Dê um nome à sua confraternização.',
  },
  {
    number: '02',
    Icon: Users,
    badgeClasses: 'bg-gold-100 text-gold-600',
    title: 'Adicione pessoas',
    text: 'Cadastre e confira os participantes.',
  },
  {
    number: '03',
    Icon: Shuffle,
    badgeClasses: 'bg-berry-50 text-berry-700',
    title: 'Faça o sorteio',
    text: 'Um sorteio único, sem tirar a si mesmo.',
  },
  {
    number: '04',
    Icon: Send,
    badgeClasses: 'bg-gold-100 text-gold-600',
    title: 'Envie os links',
    text: 'Cada pessoa recebe seu resultado privado.',
  },
];

export default function Home() {
  const participantToken = loadParticipantToken();

  return (
    <div className="space-y-9 sm:space-y-11">
      <title>Amigo Secreto</title>

      <div>
        <GiftIllustration
          variant="trio"
          className="relative z-0 mx-auto -mb-4 aspect-[5/2] w-72 max-w-full sm:-mb-5 sm:w-[350px]"
        />

        <Card className="relative z-1 text-center">
          <div className="mx-auto inline-flex items-center gap-1.5 rounded-full bg-gold-100 px-3.5 py-1 text-xs font-semibold text-gold-600">
            Amigo secreto de Natal
          </div>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-balance text-pine-900 sm:text-4xl">
            Sorteie seu Amigo Secreto em instantes
          </h1>
          <p className="mx-auto mt-3 max-w-prose text-pretty text-charcoal-soft">
            Cadastre os participantes, realize o sorteio com um clique e envie um link individual
            para cada pessoa descobrir quem tirou.
          </p>

          <div className="mt-6 flex flex-col items-center gap-3">
            <Link
              to="/admin"
              className={buttonClasses({ variant: 'cranberry', className: 'w-full sm:w-auto' })}
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Acessar área do organizador
            </Link>
            {participantToken && (
              <Link
                to={`/sorteio#${encodeURIComponent(participantToken)}`}
                className={buttonClasses({ variant: 'secondary', className: 'w-full sm:w-auto' })}
              >
                <Gift className="h-4 w-4" aria-hidden="true" />
                Voltar ao meu sorteio
              </Link>
            )}
            <p className="text-xs text-charcoal-soft">
              Recebeu um link? Basta abri-lo para descobrir quem você tirou.
            </p>
          </div>
        </Card>
      </div>

      <section aria-labelledby="como-funciona">
        <h2 id="como-funciona" className="text-xl font-bold tracking-tight text-pine-900 sm:text-2xl">
          Como funciona?
        </h2>
        <ol className="relative mt-6 grid grid-cols-1 md:mt-8 md:grid-cols-4 md:gap-4">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-5 right-[12.5%] left-[12.5%] hidden h-px bg-gold-500/60 md:block"
          />
          {STEPS.map(({ number, Icon, badgeClasses, title, text }, index) => (
            <li
              key={number}
              style={{ '--stagger-index': index }}
              className="stagger-item relative flex items-start gap-4 pb-7 last:pb-0 md:flex-col md:items-center md:gap-0 md:pb-0 md:text-center"
            >
              {index < STEPS.length - 1 && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute top-10 bottom-0 left-5 w-px bg-gold-500/55 md:hidden"
                />
              )}
              <span className="relative z-10 flex h-10 w-10 flex-none items-center justify-center rounded-full border border-[#C5A16B] bg-[#1F272E] text-sm font-bold tracking-wide text-[#F2EFE9] ring-4 ring-cream">
                {number}
              </span>
              <div className="flex-1 pt-0.5 md:mt-5 md:flex md:flex-col md:items-center md:pt-0">
                <span className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${badgeClasses}`}>
                  <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                </span>
                <h3 className="mt-3 text-[15px] leading-tight font-bold text-pine-900 md:whitespace-nowrap">
                  <span className="sr-only">Passo {index + 1}: </span>
                  {title}
                </h3>
                <p className="mt-1.5 text-sm leading-snug text-pretty text-charcoal-soft">{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section
        aria-labelledby="privacidade"
        className="relative overflow-hidden rounded-3xl border border-[#C5A16B]/25 bg-[#1F272E] px-6 py-6 text-left text-[#F2EFE9] shadow-[0_10px_28px_-14px_rgb(15_20_26/0.35)] sm:px-8 sm:py-7"
      >
        <svg
          viewBox="0 0 96 96"
          fill="none"
          aria-hidden="true"
          focusable="false"
          className="pointer-events-none absolute -right-2 -bottom-2 h-24 w-24 opacity-20"
        >
          <path d="M88 88C68 74 52 54 38 26" stroke="#C5A16B" strokeWidth="2" strokeLinecap="round" />
          <path d="M68 68C60 76 48 77 42 70C50 64 60 63 68 68Z" fill="#C5A16B" />
          <path d="M54 50C44 56 34 55 30 48C38 43 47 44 54 50Z" fill="#C5A16B" />
          <path d="M72 64C78 54 77 44 70 39C65 48 66 57 72 64Z" fill="#C5A16B" />
        </svg>
        <div className="relative max-w-prose">
          <h2 id="privacidade" className="text-base font-bold text-[#E5B96B] sm:text-lg">
            Privacidade do sorteio
          </h2>
          <p className="mt-2.5 text-sm leading-relaxed text-[#C6D0D8]">
            Cada participante acessa apenas o próprio resultado pelo link individual. Os pares não
            são exibidos no painel.
          </p>
        </div>
      </section>
    </div>
  );
}
