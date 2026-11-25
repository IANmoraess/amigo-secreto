/** Superfície padrão Modern Flat para agrupar conteúdo. */
export default function Card({ as: Tag = 'section', className = '', children, ...props }) {
  return (
    <Tag
      className={`rounded-3xl border border-sage/30 bg-warm-white p-6 shadow-[0_8px_28px_-14px_rgb(24_55_45/0.09)] sm:p-8 ${className}`}
      {...props}
    >
      {children}
    </Tag>
  );
}
