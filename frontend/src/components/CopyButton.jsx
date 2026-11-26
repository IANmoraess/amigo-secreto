import { useEffect, useRef, useState } from 'react';
import { CircleAlert, Check, Copy } from 'lucide-react';
import { buttonClasses } from './Button.jsx';

const FEEDBACK_DURATION_MS = 2000;

// O VoiceOver ignora mensagens idênticas em sequência; um espaço invisível as diferencia.
let lastMessage = '';

/**
 * Botão que copia um texto para a área de transferência sem causar deslocamento de layout.
 * Mantém largura e altura constantes entre os estados normal, copiado e erro,
 * além de anunciar o resultado em uma região `role="status"` acessível.
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

  const Icon = state === 'copied' ? Check : state === 'failed' ? CircleAlert : Copy;
  const displayLabel = state === 'copied' ? 'Copiado' : state === 'failed' ? 'Falhou' : label;

  return (
    <span className="inline-flex items-center">
      <button
        type="button"
        onClick={handleClick}
        data-state={state}
        className={buttonClasses({ variant, size })}
      >
        <span className="inline-flex items-center gap-2 whitespace-nowrap">
          <Icon className="h-4 w-4" aria-hidden="true" />
          {displayLabel}
        </span>
        {srLabel && <span className="sr-only"> {srLabel}</span>}
      </button>
      <span role="status" className="sr-only">
        {message}
      </span>
    </span>
  );
}
