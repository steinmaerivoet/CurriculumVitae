import { useEffect, type RefObject } from "react";
import { gsap } from "gsap";

/**
 * Fades a theme's chrome in once the deck is ready. Elements marked
 * `data-chrome` start hidden (see base.css) until this runs.
 */
export function useChromeIntro(rootRef: RefObject<HTMLElement | null>, ready: boolean, delay = 0.6) {
  useEffect(() => {
    if (!ready || !rootRef.current) return;
    gsap.fromTo(
      rootRef.current.querySelectorAll("[data-chrome]"),
      { autoAlpha: 0, y: (i) => (i % 2 ? 10 : -10) },
      { autoAlpha: 1, y: 0, duration: 1, ease: "expo.out", stagger: 0.08, delay },
    );
  }, [ready, rootRef, delay]);
}
