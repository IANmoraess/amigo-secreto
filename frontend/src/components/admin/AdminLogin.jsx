import { useEffect, useRef, useState } from 'react';
import { KeyRound } from 'lucide-react';
import Button from '../Button.jsx';
import Card from '../Card.jsx';
import TextField from '../TextField.jsx';

function formatCountdown(totalSeconds) {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

/**
 * Solicita a chave administrativa.
 * A chave é enviada uma única vez ao servidor em troca de uma sessão temporária e
 * nunca é salva no navegador. O bloqueio após tentativas inválidas é aplicado pelo
 * backend; aqui apenas se exibe a contagem regressiva (`lockedUntil`, em ms).
 * `onSubmit` deve retornar uma Promise<boolean> (true = autenticado).
 */
export default function AdminLogin({ onSubmit, onBack, loading = false, lockedUntil = 0 }) {
  const [now, setNow] = useState(() => Date.now());
  const inputRef = useRef(null);

  useEffect(() => {
    if (!lockedUntil || lockedUntil <= Date.now()) return undefined;

    const tick = () => {
      const current = Date.now();
      setNow(current);
      if (current >= lockedUntil) clearInterval(intervalId);
    };
    const intervalId = setInterval(tick, 250);
    tick();

    return () => clearInterval(intervalId);
  }, [lockedUntil]);

  const remainingSeconds = lockedUntil > now ? Math.ceil((lockedUntil - now) / 1000) : 0;
  const locked = remainingSeconds > 0;

  async function handleSubmit(event) {
    event.preventDefault();
    if (locked || loading) return;

    const form = event.currentTarget;
    const key = new FormData(form).get('adminKey').trim();
    if (!key) return;

    const authenticated = await onSubmit(key);
    if (!authenticated) {
      form.reset(); // não mantém a chave incorreta no campo
      inputRef.current?.focus();
    }
  }

  return (
    <Card className="mx-auto max-w-md">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-mint-100 text-pine-800">
          <KeyRound className="h-5 w-5" aria-hidden="true" />
        </span>
        <h1 id="admin-login-title" className="text-2xl font-bold tracking-tight text-pine-900">
          Área do organizador
        </h1>
      </div>

      <form onSubmit={handleSubmit} aria-labelledby="admin-login-title" className="space-y-5">
        <TextField
          ref={inputRef}
          label="Chave administrativa"
          hint="Informe a chave configurada no servidor. Ela não é salva no navegador; a sessão expira após 15 minutos sem atividade."
          name="adminKey"
          type="password"
          required
          pattern=".*\S.*"
          autoComplete="current-password"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="go"
          disabled={locked}
        />
        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          {onBack && (
            <Button
              type="button"
              variant="secondary"
              onClick={onBack}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              Voltar
            </Button>
          )}
          <Button
            type="submit"
            loading={loading}
            loadingLabel="Verificando chave"
            disabled={locked}
            className="w-full sm:flex-1"
          >
            {loading
              ? 'Verificando...'
              : locked
                ? `Tente novamente em ${formatCountdown(remainingSeconds)}`
                : 'Entrar'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
