import { useState } from 'react';
import { CircleCheck, Send } from 'lucide-react';
import Alert from '../Alert.jsx';
import Button from '../Button.jsx';
import Card from '../Card.jsx';
import ConfirmDialog from '../ConfirmDialog.jsx';
import CopyButton from '../CopyButton.jsx';

/**
 * Monta o link individual usando fragmento (#), evitando que o token
 * seja enviado ao servidor ou registrado em logs de acesso HTTP.
 */
function buildRevealLink(token) {
  return `${window.location.origin}/sorteio#${encodeURIComponent(token)}`;
}

/**
 * Tela exclusiva de distribuição dos links individuais, exibida logo após o sorteio.
 *
 * - Os tokens existem apenas em memória nesta tela (o banco guarda somente o hash).
 * - Os links nunca são exibidos em lista aberta: cada um só pode ser copiado
 *   individualmente pelo botão do participante correspondente.
 * - Ao concluir, os tokens são descartados e não podem ser recuperados.
 */
export default function LinkDistribution({ links, onFinish }) {
  const [copiedIds, setCopiedIds] = useState(() => new Set());
  const [confirmingFinish, setConfirmingFinish] = useState(false);

  const total = links.length;
  const copiedCount = copiedIds.size;
  const allCopied = copiedCount === total;
  const progressPercent = total > 0 ? Math.round((copiedCount / total) * 100) : 0;

  function markCopied(participantId) {
    setCopiedIds((current) => new Set(current).add(participantId));
  }

  return (
    <Card className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-pine-900">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold-100 text-gold-600">
            <Send className="h-5 w-5" aria-hidden="true" />
          </span>
          Distribuição dos links individuais
        </h2>
        <p className="mt-2 text-sm text-charcoal-soft">
          Copie o link de cada participante e envie somente para a pessoa indicada, pelo meio
          que preferir.
        </p>
      </div>

      <Alert type="warning" title="Guarde os links agora">
        Por segurança, os links não ficam armazenados no sistema e{' '}
        <strong>não poderão ser recuperados depois</strong> que você sair desta tela. Não abra
        os links: cada um mostra o resultado da pessoa correspondente.
      </Alert>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm font-medium text-charcoal">
          <span aria-live="polite">
            {copiedCount} de {total} links copiados
          </span>
          <span className="text-pine-800">{progressPercent}%</span>
        </div>
        <div
          className="h-2.5 w-full overflow-hidden rounded-full bg-mint-100"
          role="progressbar"
          aria-valuenow={copiedCount}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-label="Progresso de links copiados"
        >
          <div
            className="h-full rounded-full bg-pine-800 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <ul className="space-y-2.5">
        {links.map((link) => {
          const copied = copiedIds.has(link.participantId);
          return (
            <li
              key={link.participantId}
              className={`flex flex-col gap-3 rounded-2xl p-3.5 transition-colors sm:flex-row sm:items-center sm:justify-between ${
                copied ? 'bg-mint-50' : 'bg-cream/65'
              }`}
            >
              <span className="flex items-center gap-2.5 break-words font-medium text-charcoal">
                {copied && (
                  <CircleCheck className="h-5 w-5 flex-none text-pine-700" role="img" aria-label="Link já copiado" />
                )}
                {link.name}
              </span>
              <CopyButton
                text={buildRevealLink(link.token)}
                variant={copied ? 'secondary' : 'coral'}
                label="Copiar link"
                srLabel={`de ${link.name}`}
                onCopied={() => markCopied(link.participantId)}
              />
            </li>
          );
        })}
      </ul>

      <Button
        variant={allCopied ? 'primary' : 'secondary'}
        onClick={() => setConfirmingFinish(true)}
        className="w-full sm:w-auto"
      >
        Concluir distribuição
      </Button>

      <ConfirmDialog
        open={confirmingFinish}
        title="Concluir a distribuição?"
        confirmLabel="Concluir"
        confirmVariant={allCopied ? 'primary' : 'danger'}
        onConfirm={() => {
          setConfirmingFinish(false);
          onFinish();
        }}
        onCancel={() => setConfirmingFinish(false)}
      >
        {!allCopied && (
          <p className="font-medium text-berry-700">
            Atenção: {total - copiedCount} link(s) ainda não foram copiados.
          </p>
        )}
        <p>Depois de concluir, os links não poderão ser exibidos nem gerados novamente.</p>
      </ConfirmDialog>
    </Card>
  );
}
