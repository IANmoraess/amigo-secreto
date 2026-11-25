import { useId } from 'react';

/**
 * Campo de texto Modern Flat com rótulo visível e dica opcional acima do campo.
 * O estilo de erro só aparece após a interação do usuário (:user-invalid).
 */
export default function TextField({ label, hint, id, className = '', ref, ...inputProps }) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = hint ? `${inputId}-hint` : undefined;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={inputId} className="text-sm font-semibold text-neutral-800">
        {label}
      </label>
      {hint && (
        <p id={hintId} className="text-sm text-neutral-600">
          {hint}
        </p>
      )}
      <input
        ref={ref}
        id={inputId}
        aria-describedby={hintId}
        className="min-h-12 w-full rounded-2xl border border-neutral-300 bg-cream/50 px-4 text-base text-neutral-900 placeholder:text-neutral-400 transition-colors focus:bg-white focus-visible:outline-3 focus-visible:outline-offset-1 focus-visible:outline-pine-700 user-invalid:border-berry-600 user-invalid:bg-berry-50"
        {...inputProps}
      />
    </div>
  );
}
