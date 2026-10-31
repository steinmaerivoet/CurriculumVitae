import { useRef, useState } from "react";
import { useFollow } from "@/web/deck/follow";

/**
 * Lights up a project for a moment when something links to it, so the
 * visitor sees where they landed. `onFollow` can bring it into view.
 */
export function useProjectSpotlight(onFollow?: (id: string) => void, ms = 2400) {
  const [lit, setLit] = useState<string | null>(null);
  const timer = useRef(0);
  useFollow("project", (ref) => {
    setLit(ref.id);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setLit(null), ms);
    onFollow?.(ref.id);
  });
  return lit;
}
