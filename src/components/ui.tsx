export function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-[14px] border border-border bg-surface p-4">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="tnum mt-2 text-[28px] font-bold leading-8">{value}</p>
      <p className="mt-1 text-xs text-muted">{sub}</p>
    </div>
  );
}

export function EmptyBox({ text }: { text: string }) {
  return (
    <p className="rounded-[10px] border border-dashed border-border bg-background px-4 py-6 text-sm text-muted">
      {text}
    </p>
  );
}

export function SectionHead({ title, sub }: { title: string; sub: string }) {
  return (
    <>
      <h2 className="text-[15px] font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-muted">{sub}</p>
    </>
  );
}
