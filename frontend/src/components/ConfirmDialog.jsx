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
  confirmDisabled = false,
  confirmLoading = false,
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
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-3xl bg-warm-white p-6 text-charcoal shadow-[0_16px_40px_-16px_rgb(24_55_45/0.25)] sm:p-8"
    >
      <h1 id={titleId} className="text-xl font-bold tracking-tight text-pine-900">
        {title}
      </h1>
      <div id={descriptionId} className="mt-3 space-y-2 text-sm text-charcoal-soft">
        {children}
      </div>
      <form method="dialog" className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button ref={cancelRef} type="submit" value="cancel" variant="secondary" disabled={confirmLoading}>
          {cancelLabel}
        </Button>
        <Button
          type="submit"
          value="confirm"
          variant={confirmVariant}
          disabled={confirmDisabled}
          loading={confirmLoading}
          loadingLabel={confirmLabel}
        >
          {confirmLabel}
        </Button>
      </form>
    </dialog>
  );
}
