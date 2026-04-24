export function Badge({ children, tone }: { children?: any; tone: string }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
