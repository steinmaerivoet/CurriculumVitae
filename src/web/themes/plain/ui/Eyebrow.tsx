import type { SectionId } from "@/core/model";
import { pad } from "@/bff/shared/format";
import { useDeck } from "@/web/deck/context";

/** Section label such as "02 · Experience", numbered by the slide's position. */
export default function Eyebrow({ id, label }: { id: SectionId; label: string }) {
  const { ids } = useDeck();
  const n = ids.indexOf(id);
  return (
    <p className="eyebrow mb-6 sm:mb-10 short:mb-6" data-reveal>
      {n >= 0 ? `${pad(n)} · ` : ""}
      {label}
    </p>
  );
}
