import { ButtonHTMLAttributes } from 'react';

export function Toast({
  message,
  tone = 'success',
  onClose,
}: {
  message: string;
  tone?: 'success' | 'error';
  onClose?: ButtonHTMLAttributes<HTMLButtonElement>['onClick'];
}) {
  return (
    <div className={`toast ${tone === 'error' ? 'error' : 'success'}`}>
      <span>{message}</span>
      {onClose ? (
        <button type="button" className="toast-close" onClick={onClose} aria-label="Dismiss notification">
          ×
        </button>
      ) : null}
    </div>
  );
}
