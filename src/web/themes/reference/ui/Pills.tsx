/** A row of pill tabs (versions, filters). */
export default function Pills({
  label,
  items,
  active,
  onSelect,
  counts,
}: {
  label: string;
  items: string[];
  active: number;
  onSelect: (i: number) => void;
  counts?: number[];
}) {
  return (
    <div role="tablist" aria-label={label} className="flex flex-wrap gap-1.5" data-reveal>
      {items.map((it, i) => {
        const on = i === active;
        return (
          <button
            key={it}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onSelect(i)}
            className={`rounded-full border px-2.5 py-1.5 font-mono text-xs leading-none transition-colors ${on ? "border-fg bg-fg text-bg" : "border-line bg-surface text-mute hover:text-fg"}`}
          >
            {it}
            {counts ? <span className="ml-1.5 opacity-60">{counts[i]}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
