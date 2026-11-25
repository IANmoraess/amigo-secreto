/** Superfície padrão Modern Flat para agrupar conteúdo. */
export default function Card({ as: Tag = 'section', className = '', children, ...props }) {
  return (
    <Tag
      className={`rounded-3xl bg-white p-6 shadow-[0_8px_28px_-12px_rgb(15_61_46/0.10)] sm:p-8 ${className}`}
      {...props}
    >
      {children}
    </Tag>
  );
}
