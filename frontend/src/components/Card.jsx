/** Superfície padrão para agrupar conteúdo. */
export default function Card({ as: Tag = 'section', className = '', children, ...props }) {
  return (
    <Tag
      className={`rounded-2xl border border-pine-100 bg-white p-6 shadow-sm sm:p-8 ${className}`}
      {...props}
    >
      {children}
    </Tag>
  );
}
