import type { Chip } from "@/lib/links";
import { follow } from "@/components/deck/follow";

/** A technology chip; when it names one of the skills, it links to that skill. */
export default function LinkChip({ chip, className = "" }: { chip: Chip; className?: string }) {
  const base = `rounded-full border px-2.5 py-0.5 text-xs ${className}`;
  if (!chip.skill) return <span className={`${base} border-line text-paper/60`}>{chip.label}</span>;
  const skill = chip.skill;
  return (
    <button
      type="button"
      onClick={() => follow({ kind: "skill", name: skill })}
      title={skill}
      className={`${base} border-line text-paper/85 transition-colors hover:border-accent hover:text-accent`}
    >
      {chip.label}
    </button>
  );
}
