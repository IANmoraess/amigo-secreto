import Spinner from './Spinner.jsx';

const VARIANTS = {
  primary: 'bg-pine-800 text-white hover:bg-pine-900',
  secondary: 'bg-mint-50 text-pine-900 hover:bg-mint-100',
  danger: 'bg-berry-600 text-white hover:bg-berry-700',
  ghost: 'text-pine-800 hover:bg-mint-100',
};

const SIZES = {
  md: 'min-h-12 px-6 text-base',
  sm: 'min-h-11 px-3.5 text-sm',
};

/** Classes compartilhadas entre <button> e links com aparência de botão. */
export function buttonClasses({ variant = 'primary', size = 'md', className = '' } = {}) {
  return [
    'inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition-colors',
    'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-pine-700',
    'disabled:cursor-not-allowed disabled:opacity-60',
    VARIANTS[variant],
    SIZES[size],
    className,
  ].join(' ');
}

/**
 * Botão padrão da aplicação.
 * Durante o carregamento fica desabilitado para evitar envios duplicados.
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  type = 'button',
  loading = false,
  loadingLabel = 'Carregando',
  disabled = false,
  className = '',
  children,
  ref,
  ...props
}) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses({ variant, size, className })}
      {...props}
    >
      {loading && <Spinner label={loadingLabel} />}
      {children}
    </button>
  );
}
