import type { Term } from "@/core/model";
import { TermLink } from "@/web/shared/TermLink";

/** A technology chip; when it names one of the skills, it links to that skill. */
export default function Chip({ term }: { term: Term }) {
  return (
    <TermLink
      term={term}
      className="rounded-full border border-line px-2.5 py-0.5 text-xs"
      textClassName="text-fg/60"
      linkClassName="text-fg/85 transition-colors hover:border-accent hover:text-accent"
    />
  );
}
