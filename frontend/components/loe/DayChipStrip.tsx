export function DayChipStrip({ chips }: { chips: { label: string; ok: boolean }[] }) {
  return (
    <div className="day-chip-strip">
      {chips.map((chip) => (
        <span key={chip.label} className={chip.ok ? 'day-chip ok' : 'day-chip missing'}>
          <span>{chip.label}</span>
          <span>{chip.ok ? '✓' : '✗'}</span>
        </span>
      ))}
    </div>
  );
}
