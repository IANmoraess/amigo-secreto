import { useEffect, useId, useRef } from 'react';
import Button from './Button.jsx';

/**
 * Diálogo de confirmação baseado no <dialog> nativo aberto com showModal().
 * O navegador cuida do foco, da tecla Esc, do fundo inerte e do retorno do foco.
 * O foco inicial vai para a ação segura (Cancelar).
 */
export default function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  confirmVariant = 'primary',
  onConfirm,
  onCancel,
}) {
  const dialogRef = useRef(null);
  const cancelRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
      cancelRef.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  function handleClose() {
    const dialog = dialogRef.current;
    const choice = dialog.returnValue;
    // Esc não define valor; limpar evita reaproveitar uma escolha antiga.
    dialog.returnValue = '';

    if (choice === 'confirm') onConfirm();
    else onCancel();
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onClose={handleClose}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl bg-white p-6 text-neutral-800 shadow-xl sm:p-8"
    >
      <h1 id={titleId} className="text-xl font-semibold text-pine-900">
        {title}
      </h1>
      <div id={descriptionId} className="mt-3 space-y-2 text-sm text-neutral-700">
        {children}
      </div>
      <form method="dialog" className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button ref={cancelRef} type="submit" value="cancel" variant="secondary">
          {cancelLabel}
        </Button>
        <Button type="submit" value="confirm" variant={confirmVariant}>
          {confirmLabel}
        </Button>
      </form>
    </dialog>
  );
}
