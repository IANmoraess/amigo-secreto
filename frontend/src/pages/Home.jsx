import { Link } from 'react-router-dom';
import { Lock, Send, ShieldCheck, Shuffle, Sparkles, UserPlus, Users } from 'lucide-react';
import Card from '../components/Card.jsx';
import GiftIllustration from '../components/GiftIllustration.jsx';
import { buttonClasses } from '../components/Button.jsx';

const STEPS = [
  {
    Icon: UserPlus,
    title: 'Crie o evento',
    text: 'O organizador dá um nome ao amigo secreto da turma.',
  },
  {
    Icon: Users,
    title: 'Cadastre os participantes',
    text: 'Adicione todo mundo e confira a lista antes de sortear.',
  },
  {
    Icon: Shuffle,
    title: 'Realize o sorteio',
    text: 'O sorteio acontece uma única vez, de forma segura e sem ninguém tirar a si mesmo.',
  },
  {
    Icon: Send,
    title: 'Envie os links',
    text: 'Cada pessoa recebe um link individual e descobre só quem ela tirou.',
  },
];

export default function Home() {
  return (
    <div className="space-y-8 sm:space-y-10">
      <title>Amigo Secreto</title>

      <Card className="relative overflow-hidden border-pine-700/15 text-center">
        <div className="mx-auto inline-flex items-center gap-1.5 rounded-full bg-pine-50 px-3 py-1 text-xs font-medium text-pine-800 border border-pine-100">
          <Lock className="h-3.5 w-3.5 text-berry-600" aria-hidden="true" />
          Sorteio privado e gratuito
        </div>

        <GiftIllustration className="mx-auto mt-4 h-28 w-28 sm:h-32 sm:w-32" />

        <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-balance text-pine-900 sm:text-4xl">
          Amigo Secreto
        </h1>
        <p className="mx-auto mt-3 max-w-prose text-pretty text-neutral-700">
          Organize o sorteio com a família e os amigos, mesmo que cada um esteja em um lugar
          diferente. Simples, gratuito e sem ninguém descobrir o segredo antes da hora.
        </p>

        <div className="mt-6 flex flex-col items-center gap-3">
          <Link to="/admin" className={buttonClasses({ className: 'w-full sm:w-auto shadow-xs' })}>
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Acessar área do organizador
          </Link>
          <p className="text-xs text-neutral-600">
            Já é participante? Abra o link individual enviado pelo organizador.
          </p>
        </div>
      </Card>

      <section aria-labelledby="como-funciona">
        <h2 id="como-funciona" className="font-serif text-xl font-semibold text-pine-900 sm:text-2xl">
          Como funciona
        </h2>
        <ol className="mt-4 grid gap-3.5 sm:grid-cols-2 sm:gap-4">
          {STEPS.map(({ Icon, title, text }, index) => (
            <li
              key={title}
              style={{ '--stagger-index': index }}
              className="stagger-item flex gap-4 rounded-2xl border border-pine-100 bg-white p-5 shadow-xs"
            >
              <div className="relative flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-pine-100 text-pine-800">
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-berry-600 text-[11px] font-bold text-white">
                  {index + 1}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900">
                  <span className="sr-only">Passo {index + 1}: </span>
                  {title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-neutral-600">{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section
        aria-labelledby="privacidade"
        className="flex items-start gap-4 rounded-2xl bg-pine-800 p-6 text-pine-50 shadow-sm"
      >
        <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-pine-700/70 text-white">
          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 id="privacidade" className="font-semibold text-white">
            Privacidade em primeiro lugar
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-pine-100">
            Nem o organizador sabe quem tirou quem. Cada participante vê apenas o próprio
            resultado, usando um link secreto e individual.
          </p>
        </div>
      </section>
    </div>
  );
}
