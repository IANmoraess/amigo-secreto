import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from 'lucide-react';

const TYPES = {
  success: {
    Icon: CircleCheck,
    iconLabel: 'Sucesso',
    classes: 'border border-alert-success-icon/20 bg-alert-success-bg text-alert-success-text',
    iconBg: 'bg-alert-success-icon/12 text-alert-success-icon',
  },
  info: {
    Icon: Info,
    iconLabel: 'Informação',
    classes: 'border border-alert-info-icon/18 bg-alert-info-bg text-alert-info-text',
    iconBg: 'bg-alert-info-icon/12 text-alert-info-icon',
  },
  warning: {
    Icon: TriangleAlert,
    iconLabel: 'Atenção',
    classes: 'border border-alert-warning-icon/22 bg-alert-warning-bg text-alert-warning-text',
    iconBg: 'bg-alert-warning-icon/12 text-alert-warning-icon',
  },
  error: {
    Icon: CircleAlert,
    iconLabel: 'Erro',
    classes: 'border border-alert-error-icon/22 bg-alert-error-bg text-alert-error-text',
    iconBg: 'bg-alert-error-icon/12 text-alert-error-icon',
  },
};

/**
 * Mensagem de feedback Modern Flat (sucesso, informação, atenção ou erro).
 * Erros usam role="alert"; os demais tipos usam role="status".
 */
export default function Alert({ type = 'info', title, align = 'top', icon: CustomIcon, onClose, children, className = '' }) {
  const { Icon: DefaultIcon, iconLabel, classes, iconBg } = TYPES[type] ?? TYPES.info;
  const Icon = CustomIcon ?? DefaultIcon;
  const alignClass = align === 'center' ? 'items-center' : 'items-start';

  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      className={`flex ${alignClass} gap-3.5 rounded-2xl p-4 text-left text-sm ${classes} ${className}`}
    >
      <span className={`flex h-8 w-8 flex-none items-center justify-center rounded-xl ${iconBg}`}>
        <Icon className="h-4 w-4" role="img" aria-label={iconLabel} />
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        {title && <p className="font-semibold leading-snug">{title}</p>}
        <div className="leading-relaxed">{children}</div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar aviso"
          className="-m-1 flex h-7 w-7 flex-none items-center justify-center rounded-lg opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-pine-700"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
