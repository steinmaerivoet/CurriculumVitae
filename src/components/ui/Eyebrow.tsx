import type { SlideId } from "@/lib/cv";
import { pad } from "@/lib/format";
import { useDeck } from "@/components/deck/context";

/** Section label such as "02 · Experience", numbered by the slide's position. */
export default function Eyebrow({ id, label }: { id: SlideId; label: string }) {
  const { ids } = useDeck();
  const n = ids.indexOf(id);
  return (
    <p className="eyebrow mb-6 sm:mb-10 short:mb-6" data-reveal>
      {n >= 0 ? `${pad(n)} · ` : ""}
      {label}
    </p>
  );
}
