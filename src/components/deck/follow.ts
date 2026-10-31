import { useEffect, useRef } from "react";
import type { SlideId } from "@/lib/cv";
import type { Target } from "@/lib/links";

/**
 * Cross-links between slides. `follow(target)` glides the deck to the slide
 * that owns the target, and that slide brings the item into focus
 * (`useFollow`). See src/lib/links.ts for how targets are derived.
 */
const EVENT = "cv:follow";

export const slideFor = (t: Target): SlideId =>
  t.kind === "skill" ? "skills" : t.kind === "employer" ? "experience" : "projects";

export function follow(target: Target) {
  window.dispatchEvent(new CustomEvent<Target>(EVENT, { detail: target }));
}

/** Runs `handler` when something links to an item of this kind. */
export function useFollow<K extends Target["kind"]>(kind: K, handler: (t: Extract<Target, { kind: K }>) => void) {
  const h = useRef(handler);
  h.current = handler;
  useEffect(() => {
    const on = (e: Event) => {
      const t = (e as CustomEvent<Target>).detail;
      if (t.kind === kind) h.current(t as Extract<Target, { kind: K }>);
    };
    window.addEventListener(EVENT, on);
    return () => window.removeEventListener(EVENT, on);
  }, [kind]);
}

/** The deck itself: go to the slide that owns the target. */
export function useFollowSlides(goToId: (id: SlideId) => void) {
  const g = useRef(goToId);
  g.current = goToId;
  useEffect(() => {
    const on = (e: Event) => g.current(slideFor((e as CustomEvent<Target>).detail));
    window.addEventListener(EVENT, on);
    return () => window.removeEventListener(EVENT, on);
  }, []);
}
