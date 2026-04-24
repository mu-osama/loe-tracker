import { ReactNode } from 'react';

export function StateCard({
  title,
  message,
  tone = 'info',
  action,
}: {
  title: string;
  message: string;
  tone?: 'info' | 'error';
  action?: ReactNode;
}) {
  return (
    <div className={`state-card ${tone === 'error' ? 'error' : ''}`}>
      <div className="state-card-body">
        <div className="state-card-title">{title}</div>
        <div className="state-card-message">{message}</div>
      </div>
      {action ? <div className="state-card-action">{action}</div> : null}
    </div>
  );
}
