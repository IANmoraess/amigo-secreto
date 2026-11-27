import Spinner from './Spinner.jsx';

const VARIANTS = {
  // Verde Festivo — ações positivas padrão (criar evento, adicionar, confirmar)
  primary:
    'bg-btn-festive text-btn-festive-text hover:bg-btn-festive-hover active:bg-btn-festive-active focus-visible:outline-btn-festive',
  // Vermelho Cranberry — ações principais de destaque (abrir presente, revelar, CTA inicial)
  cranberry:
    'bg-btn-cranberry text-btn-cranberry-text hover:bg-btn-cranberry-hover active:bg-btn-cranberry-active focus-visible:outline-btn-cranberry',
  // Dourado Natalino — ações especiais (realizar sorteio)
  gold:
    'bg-btn-gold text-btn-gold-text hover:bg-btn-gold-hover active:bg-btn-gold-active focus-visible:outline-gold-600',
  // Coral — ações alternativas e elementos que precisam de destaque
  coral:
    'bg-btn-coral text-btn-coral-text hover:bg-btn-coral-hover active:bg-btn-coral-active focus-visible:outline-btn-coral-active',
  // Secundário suave integrado à paleta
  secondary:
    'border border-btn-secondary-border bg-btn-secondary text-btn-secondary-text hover:bg-btn-secondary-hover active:bg-btn-secondary-active focus-visible:outline-pine-700',
  // Ações destrutivas (remover participante, confirmações críticas)
  danger:
    'bg-btn-cranberry text-btn-cranberry-text hover:bg-btn-cranberry-hover active:bg-btn-cranberry-active focus-visible:outline-btn-cranberry',
  // Ações discretas de navegação/lista
  ghost:
    'text-pine-800 hover:bg-mint-100/85 active:bg-mint-200/60 focus-visible:outline-pine-700',
};

const SIZES = {
  md: 'min-h-12 px-6 text-base',
  sm: 'min-h-11 px-3.5 text-sm',
};

/** Classes compartilhadas entre <button> e links com aparência de botão. */
export function buttonClasses({ variant = 'primary', size = 'md', className = '' } = {}) {
  return [
    'inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition-colors',
    'focus-visible:outline-3 focus-visible:outline-offset-2',
    'disabled:cursor-not-allowed disabled:opacity-55',
    VARIANTS[variant] ?? VARIANTS.primary,
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
