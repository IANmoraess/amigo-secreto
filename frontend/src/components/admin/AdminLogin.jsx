import { KeyRound } from 'lucide-react';
import Button from '../Button.jsx';
import Card from '../Card.jsx';
import TextField from '../TextField.jsx';

/**
 * Solicita a chave administrativa.
 * A chave fica apenas em memória e é validada pelo servidor em cada operação.
 */
export default function AdminLogin({ onSubmit, loading = false }) {
  function handleSubmit(event) {
    event.preventDefault();
    const key = new FormData(event.currentTarget).get('adminKey').trim();
    if (key) onSubmit(key);
  }

  return (
    <Card className="mx-auto max-w-md">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-mint-100 text-pine-800">
          <KeyRound className="h-5 w-5" aria-hidden="true" />
        </span>
        <h1 id="admin-login-title" className="text-2xl font-bold tracking-tight text-pine-900">
          Área do organizador
        </h1>
      </div>

      <form onSubmit={handleSubmit} aria-labelledby="admin-login-title" className="space-y-5">
        <TextField
          label="Chave administrativa"
          hint="Informe a chave configurada no servidor. Ela não é salva no navegador."
          name="adminKey"
          type="password"
          required
          pattern=".*\S.*"
          autoComplete="current-password"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="go"
        />
        <Button type="submit" loading={loading} loadingLabel="Verificando chave" className="w-full">
          Entrar
        </Button>
      </form>
    </Card>
  );
}
