import { useState } from "react";
import { useProjectSpotlight } from "./useSpotlight";

/**
 * Which project is open on a projects slide that shows one at a time (a
 * list with a detail pane). A link to a project opens it and lights it up.
 */
export function useProjectSelection<P extends { id: string }>(items: P[]) {
  const [active, setActive] = useState(0);
  const lit = useProjectSpotlight((id) => {
    const i = items.findIndex((p) => p.id === id);
    if (i !== -1) setActive(i);
  });
  return { active, item: items[active], select: setActive, lit };
}
