export function LoeCell({ value }: { value?: string | number }) {
  return <span>{value ?? '—'}</span>;
}

