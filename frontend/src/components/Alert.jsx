import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react';

const TYPES = {
  success: {
    Icon: CircleCheck,
    iconLabel: 'Sucesso',
    classes: 'border border-alert-success-icon/20 bg-alert-success-bg text-alert-success-text',
    iconColor: 'text-alert-success-icon',
  },
  info: {
    Icon: Info,
    iconLabel: 'Informação',
    classes: 'border border-alert-info-icon/20 bg-alert-info-bg text-alert-info-text',
    iconColor: 'text-alert-info-icon',
  },
  warning: {
    Icon: TriangleAlert,
    iconLabel: 'Atenção',
    classes: 'border border-alert-warning-icon/22 bg-alert-warning-bg text-alert-warning-text',
    iconColor: 'text-alert-warning-icon',
  },
  error: {
    Icon: CircleAlert,
    iconLabel: 'Erro',
    classes: 'border border-alert-error-icon/22 bg-alert-error-bg text-alert-error-text',
    iconColor: 'text-alert-error-icon',
  },
};

/**
 * Mensagem de feedback Modern Flat (sucesso, informação, atenção ou erro).
 * Erros usam role="alert"; os demais tipos usam role="status".
 */
export default function Alert({ type = 'info', title, children, className = '' }) {
  const { Icon, iconLabel, classes, iconColor } = TYPES[type] ?? TYPES.info;

  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      className={`flex gap-3 rounded-2xl p-4 text-left text-sm ${classes} ${className}`}
    >
      <Icon className={`mt-0.5 h-5 w-5 flex-none ${iconColor}`} role="img" aria-label={iconLabel} />
      <div className="space-y-1">
        {title && <p className="font-semibold">{title}</p>}
        <div className="leading-relaxed">{children}</div>
      </div>
    </div>
  );
}
