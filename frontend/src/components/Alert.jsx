import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react';

const TYPES = {
  success: {
    Icon: CircleCheck,
    iconLabel: 'Sucesso',
    classes: 'border-pine-700/30 bg-pine-50 text-pine-900',
  },
  error: {
    Icon: CircleAlert,
    iconLabel: 'Erro',
    classes: 'border-berry-600/30 bg-berry-50 text-berry-700',
  },
  warning: {
    Icon: TriangleAlert,
    iconLabel: 'Atenção',
    classes: 'border-amber-600/40 bg-amber-50 text-amber-900',
  },
  info: {
    Icon: Info,
    iconLabel: 'Informação',
    classes: 'border-neutral-300 bg-white text-neutral-700',
  },
};

/**
 * Mensagem de feedback (sucesso, erro, atenção ou informação).
 * Erros usam role="alert"; os demais tipos usam role="status".
 * O estado não depende só da cor: há ícone com texto alternativo e título opcional.
 */
export default function Alert({ type = 'info', title, children, className = '' }) {
  const { Icon, iconLabel, classes } = TYPES[type];

  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      className={`flex gap-3 rounded-xl border p-4 text-left text-sm ${classes} ${className}`}
    >
      <Icon className="mt-0.5 h-5 w-5 flex-none" role="img" aria-label={iconLabel} />
      <div className="space-y-1">
        {title && <p className="font-semibold">{title}</p>}
        <div>{children}</div>
      </div>
    </div>
  );
}
