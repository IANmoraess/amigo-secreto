import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react';

const TYPES = {
  success: {
    Icon: CircleCheck,
    iconLabel: 'Sucesso',
    classes: 'bg-mint-50 text-pine-900',
    iconColor: 'text-pine-700',
  },
  error: {
    Icon: CircleAlert,
    iconLabel: 'Erro',
    classes: 'bg-berry-50 text-berry-700',
    iconColor: 'text-berry-600',
  },
  warning: {
    Icon: TriangleAlert,
    iconLabel: 'Atenção',
    classes: 'bg-gold-100/75 text-neutral-900',
    iconColor: 'text-gold-600',
  },
  info: {
    Icon: Info,
    iconLabel: 'Informação',
    classes: 'bg-neutral-100/90 text-neutral-800',
    iconColor: 'text-pine-700',
  },
};

/**
 * Mensagem de feedback Modern Flat (sucesso, erro, atenção ou informação).
 * Erros usam role="alert"; os demais tipos usam role="status".
 */
export default function Alert({ type = 'info', title, children, className = '' }) {
  const { Icon, iconLabel, classes, iconColor } = TYPES[type];

  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      className={`flex gap-3 rounded-2xl p-4 text-left text-sm ${classes} ${className}`}
    >
      <Icon className={`mt-0.5 h-5 w-5 flex-none ${iconColor}`} role="img" aria-label={iconLabel} />
      <div className="space-y-1">
        {title && <p className="font-semibold">{title}</p>}
        <div>{children}</div>
      </div>
    </div>
  );
}
