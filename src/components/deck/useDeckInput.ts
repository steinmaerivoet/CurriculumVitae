import { useEffect, useRef } from "react";

type Handlers = {
  next: () => boolean;
  prev: () => boolean;
  first: () => void;
  last: () => void;
  isLocked: () => boolean;
  /** The scroll container of the active slide, for content taller than the screen. */
  activeScroller: () => HTMLElement | null;
  onEdge: (direction: 1 | -1) => void;
};

// Tuning
const WHEEL_THRESHOLD = 30; // accumulated delta (px) before a gesture counts
const WHEEL_IDLE_MS = 200; // silence that ends a wheel/trackpad gesture
const SWIPE_MIN_PX = 45;
const SWIPE_MIN_VELOCITY = 0.3; // px/ms; a short fast flick also counts

function canScroll(el: HTMLElement | null, direction: number): boolean {
  if (!el || el.scrollHeight <= el.clientHeight + 1) return false;
  return direction > 0
    ? Math.ceil(el.scrollTop + el.clientHeight) < el.scrollHeight - 1
    : el.scrollTop > 1;
}

/**
 * Turns wheel, trackpad, touch and keyboard input into "one step" navigation.
 *
 * Trackpads (and Magic Mice) keep emitting wheel events for a second or more
 * after the fingers lift. A naive threshold would skip several slides. We treat
 * an uninterrupted stream of events as a single gesture that may move at most
 * one slide; a new gesture starts after a short silence, on a reversal, or when
 * the delta clearly jumps up again (a fresh flick during the inertia tail).
 */
export function useDeckInput(target: React.RefObject<HTMLElement | null>, handlers: Handlers) {
  const h = useRef(handlers);
  h.current = handlers;

  useEffect(() => {
    const root = target.current;
    if (!root) return;

    // ---------- Wheel ----------
    let accum = 0;
    let lastTime = 0;
    let lastAbs = 0;
    let used = false;

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return; // pinch zoom
      let dy = e.deltaY;
      if (e.deltaMode === 1) dy *= 16;
      else if (e.deltaMode === 2) dy *= window.innerHeight;
      if (Math.abs(e.deltaX) > Math.abs(dy)) return; // horizontal scrolling (carousels)

      const dir = Math.sign(dy);
      if (!dir) return;

      const scroller = h.current.activeScroller();
      if (scroller && scroller.contains(e.target as Node) && canScroll(scroller, dir)) {
        accum = 0;
        used = true; // reaching the edge mid-gesture must not flip the slide
        lastTime = e.timeStamp || performance.now();
        return;
      }

      e.preventDefault();

      // timeStamp is when the input happened, so main-thread jank can't fake a pause.
      const now = e.timeStamp || performance.now();
      const abs = Math.abs(dy);
      const gap = now - lastTime;
      const idle = gap > WHEEL_IDLE_MS;
      if (gap > 1000) lastAbs = 0;
      const reversed = accum !== 0 && Math.sign(accum) !== dir;
      const freshFlick = !h.current.isLocked() && abs > 24 && abs > lastAbs * 1.8;
      // Inertia only ever slows down; a real new gesture speeds up.
      const decaying = abs < lastAbs * 0.9;
      if (idle || reversed || freshFlick) {
        used = false;
        accum = 0;
      }
      lastTime = now;
      lastAbs = abs;

      if (used || h.current.isLocked()) return;
      // Ignore the long, tiny tail of inertia; only intentional movement counts.
      if (abs <= 2 || decaying) return;

      accum += dy;
      if (Math.abs(accum) >= WHEEL_THRESHOLD) {
        used = true;
        accum = 0;
        const moved = dir > 0 ? h.current.next() : h.current.prev();
        if (!moved) h.current.onEdge(dir as 1 | -1);
      }
    };

    // ---------- Touch ----------
    let startX = 0;
    let startY = 0;
    let startT = 0;
    let startScrollTop = 0;
    let startScroller: HTMLElement | null = null;
    let tracking = false;

    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      if (e.touches.length !== 1 || !t) {
        tracking = false;
        return;
      }
      tracking = true;
      startX = t.clientX;
      startY = t.clientY;
      startT = performance.now();
      const scroller = h.current.activeScroller();
      startScroller = scroller && scroller.contains(e.target as Node) ? scroller : null;
      startScrollTop = startScroller?.scrollTop ?? 0;
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!tracking) return;
      tracking = false;
      const t = e.changedTouches[0];
      if (!t) return;
      const dy = startY - t.clientY;
      const dx = startX - t.clientX;
      if (Math.abs(dx) > Math.abs(dy)) return;
      const dt = Math.max(1, performance.now() - startT);
      if (Math.abs(dy) < 12) return;
      if (Math.abs(dy) < SWIPE_MIN_PX && Math.abs(dy) / dt < SWIPE_MIN_VELOCITY) return;

      const dir = Math.sign(dy);
      // In an overflowing slide, only leave when the gesture started at its edge.
      if (startScroller) {
        const el = startScroller;
        const atTop = startScrollTop <= 1;
        const atBottom = startScrollTop + el.clientHeight >= el.scrollHeight - 1;
        if ((dir > 0 && !atBottom) || (dir < 0 && !atTop)) return;
      }
      if (h.current.isLocked()) return;
      const moved = dir > 0 ? h.current.next() : h.current.prev();
      if (!moved) h.current.onEdge(dir as 1 | -1);
    };

    // ---------- Keyboard ----------
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.defaultPrevented) return;
      const el = e.target as HTMLElement;
      const tag = el.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || el.isContentEditable) return;

      const step = (dir: 1 | -1) => {
        e.preventDefault();
        if (h.current.isLocked()) return;
        const scroller = h.current.activeScroller();
        if (canScroll(scroller, dir) && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
          scroller?.scrollBy({ top: dir * 120, behavior: "smooth" });
          return;
        }
        const moved = dir > 0 ? h.current.next() : h.current.prev();
        if (!moved) h.current.onEdge(dir);
      };

      switch (e.key) {
        case "ArrowDown":
        case "PageDown":
          step(1);
          break;
        case "ArrowUp":
        case "PageUp":
          step(-1);
          break;
        case " ":
          if (tag === "BUTTON" || tag === "A") return;
          step(e.shiftKey ? -1 : 1);
          break;
        case "Home":
          e.preventDefault();
          h.current.first();
          break;
        case "End":
          e.preventDefault();
          h.current.last();
          break;
      }
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    root.addEventListener("touchstart", onTouchStart, { passive: true });
    root.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("wheel", onWheel);
      root.removeEventListener("touchstart", onTouchStart);
      root.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("keydown", onKey);
    };
  }, [target]);
}
