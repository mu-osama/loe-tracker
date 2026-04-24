export function LoeSummaryRow({ label, values }: { label: string; values: (string | number)[] }) {
  return (
    <tr>
      <th>{label}</th>
      {values.map((value, index) => <th key={`${label}-${index}`}>{value}</th>)}
    </tr>
  );
}
