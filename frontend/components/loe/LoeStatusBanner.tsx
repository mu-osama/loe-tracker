import { Badge } from '../ui/Badge';

export function LoeStatusBanner({
  status,
  delayed,
  reopenComment,
}: {
  status: string;
  delayed?: boolean;
  reopenComment?: string | null;
}) {
  return (
    <div className={`banner ${status === 'REOPENED' || delayed ? 'warn' : 'error'}`}>
      <div style={{ display: 'grid', gap: 8 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Badge tone={status.toLowerCase()}>{status}</Badge>
        {delayed ? <Badge tone="delayed">Overdue</Badge> : null}
        <span>
          {status === 'REOPENED'
            ? 'Re-opened by reviewer. Update and submit again.'
            : status === 'SUBMITTED'
              ? 'Submitted sheets are locked pending review.'
              : status === 'APPROVED'
                ? 'Approved sheets are locked unless a reviewer reopens them.'
                : 'Draft sheet is editable.'}
        </span>
        </div>
        {status === 'REOPENED' && reopenComment ? (
          <div style={{ color: '#92400e', fontWeight: 600 }}>
            Reviewer comment: {reopenComment}
          </div>
        ) : null}
      </div>
    </div>
  );
}
