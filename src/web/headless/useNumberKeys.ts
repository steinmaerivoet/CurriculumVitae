import { useEffect, useRef } from "react";

/**
 * Number keys jump to a slide: 1 is the first slide. For themes that show
 * their slides as numbered windows or tabs. Ignored while typing in a field.
 */
export function useNumberKeys(count: number, goTo: (index: number) => unknown) {
  const go = useRef(goTo);
  go.current = goTo;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t?.closest("input, textarea, select, [contenteditable]")) return;
      const n = Number(e.key);
      if (Number.isInteger(n) && n >= 1 && n <= count) go.current(n - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [count]);
}
