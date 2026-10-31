import { useEffect, useRef } from "react";
import type { Ref, SectionId } from "@/core/model";

/**
 * Cross-links between slides. `follow(ref)` glides the deck to the slide
 * that owns the ref, and that slide brings the item into focus
 * (`useFollow`). Refs are derived in src/core/linker.ts.
 */
const EVENT = "cv:follow";

export const slideFor = (t: Ref): SectionId =>
  t.kind === "skill" ? "skills" : t.kind === "employer" ? "experience" : "projects";

export function follow(ref: Ref) {
  window.dispatchEvent(new CustomEvent<Ref>(EVENT, { detail: ref }));
}

/** Runs `handler` when something links to an item of this kind. */
export function useFollow<K extends Ref["kind"]>(kind: K, handler: (t: Extract<Ref, { kind: K }>) => void) {
  const h = useRef(handler);
  h.current = handler;
  useEffect(() => {
    const on = (e: Event) => {
      const t = (e as CustomEvent<Ref>).detail;
      if (t.kind === kind) h.current(t as Extract<Ref, { kind: K }>);
    };
    window.addEventListener(EVENT, on);
    return () => window.removeEventListener(EVENT, on);
  }, [kind]);
}

/** The deck itself: go to the slide that owns the ref. */
export function useFollowSlides(goToId: (id: SectionId) => void) {
  const g = useRef(goToId);
  g.current = goToId;
  useEffect(() => {
    const on = (e: Event) => g.current(slideFor((e as CustomEvent<Ref>).detail));
    window.addEventListener(EVENT, on);
    return () => window.removeEventListener(EVENT, on);
  }, []);
}
