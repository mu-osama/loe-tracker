export function MonthProgressBar({ filled, total }: { filled: number; total: number }) {
  const percent = total ? Math.round((filled / total) * 100) : 0;
  return (
    <div className="stack">
      <div>{filled} / {total} working days filled ({percent}%)</div>
      <div className="progress">
        <span style={{ width: `${percent}%`, background: percent === 100 ? 'var(--success)' : undefined }} />
      </div>
    </div>
  );
}

