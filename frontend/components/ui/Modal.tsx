'use client';

export function Modal({
  children,
  onClose,
}: {
  children?: any;
  onClose?: () => void;
}) {
  return (
    <div
      className="modal-backdrop"
      onClick={() => onClose?.()}
      role="dialog"
      aria-modal="true"
    >
      <div className="modal-card" onClick={(event) => event.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
