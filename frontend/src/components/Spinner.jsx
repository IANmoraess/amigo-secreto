/**
 * Indicador de carregamento acessível.
 * O <progress> sem `value` é anunciado como "ocupado" pelas tecnologias assistivas.
 */
export default function Spinner({ label = 'Carregando', className = '' }) {
  return <progress className={`spinner ${className}`} aria-label={label} />;
}
