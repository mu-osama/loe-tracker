import { ButtonHTMLAttributes, ReactNode } from 'react';

export function Button({
  className = '',
  disabled,
  children,
  loading = false,
  loadingText,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  loadingText?: ReactNode;
}) {
  return (
    <button
      className={`button ${loading ? 'is-loading' : ''} ${className}`.trim()}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading ? <span className="button-spinner" aria-hidden="true" /> : null}
      <span>{loading ? loadingText || children : children}</span>
    </button>
  );
}
