import type { ReactNode } from "react";

/** A parameter table: a field name with its type, and a description. */
export default function Params({ rows, className = "" }: { rows: { name: string; type?: string; children: ReactNode }[]; className?: string }) {
  return (
    <dl className={`border-t border-line text-sm ${className}`} data-reveal>
      {rows.map((r) => (
        <div key={r.name} className="grid gap-x-3 gap-y-0.5 border-b border-line py-2 sm:grid-cols-[9.5rem_minmax(0,1fr)] sm:items-baseline">
          <dt className="font-mono text-[13px] font-medium">
            {r.name}
            {r.type ? <i className="ml-1.5 text-[11.5px] font-normal text-mute not-italic">{r.type}</i> : null}
          </dt>
          <dd className="min-w-0 text-mute">{r.children}</dd>
        </div>
      ))}
    </dl>
  );
}
