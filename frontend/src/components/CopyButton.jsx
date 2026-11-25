import { useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { buttonClasses } from './Button.jsx';

const FEEDBACK_DURATION_MS = 2000;

// O VoiceOver ignora mensagens idênticas em sequência; um espaço invisível as diferencia.
let lastMessage = '';

/**
 * Botão que copia um texto para a área de transferência.
 * O texto copiado nunca é exibido na tela. A confirmação aparece em uma
 * região role="status" fora do botão, para ser lida por leitores de tela.
 */
export default function CopyButton({
  text,
  label = 'Copiar',
  srLabel,
  variant = 'secondary',
  size = 'sm',
  onCopied,
  onFailed,
}) {
  const [state, setState] = useState('idle');
  const [message, setMessage] = useState('');
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  async function handleClick() {
    clearTimeout(timerRef.current);

    let copied = true;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard indisponível (contexto não seguro) ou permissão negada.
      copied = false;
    }

    let next = copied ? 'Copiado!' : 'Não foi possível copiar';
    if (next === lastMessage) next += '\u00A0';
    lastMessage = next;

    setState(copied ? 'copied' : 'failed');
    setMessage(next);
    if (copied) onCopied?.();
    else onFailed?.();

    timerRef.current = setTimeout(() => {
      setState('idle');
      setMessage('');
    }, FEEDBACK_DURATION_MS);
  }

  const Icon = state === 'copied' ? Check : Copy;

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={handleClick}
        data-state={state}
        className={buttonClasses({ variant, size })}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
        {label}
        {srLabel && <span className="sr-only"> {srLabel}</span>}
      </button>
      <span
        role="status"
        className={`text-sm transition-opacity ${message ? 'opacity-100' : 'opacity-0'} ${
          state === 'failed' ? 'text-berry-700' : 'text-pine-700'
        }`}
      >
        {message}
      </span>
    </span>
  );
}
