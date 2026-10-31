import { useEffect, useRef } from "react";

type Direction = 1 | -1;

export type DeckInputHandlers = {
  /** Move one slide forward or back. Returns false at the first/last slide. */
  step: (direction: Direction) => boolean;
  first: () => void;
  last: () => void;
  isLocked: () => boolean;
  /** Scroll container of the active slide, for content taller than the screen. */
  activeScroller: () => HTMLElement | null;
  onEdge: (direction: Direction) => void;
  /**
   * Wheel / trackpad magnet. `progress` runs from -1 to 1 (towards the
   * previous/next slide): the page is pulled along with growing resistance.
   */
  pull: (progress: number) => void;
  /** The pull went far enough: glide on to the next/previous slide. */
  commit: (direction: Direction) => boolean;
  /** The gesture ended before the commit point: spring back. */
  release: () => void;
  /** Touch: the page follows the finger. dy > 0 means the finger moved down. */
  dragStart: () => void;
  dragMove: (dy: number) => void;
  dragEnd: (dy: number, velocity: number) => void;
};

// Wheel / trackpad magnet tuning
const PULL_SOFTNESS = 200; // px of wheel delta for ~63% of the full pull
const COMMIT_AT = 0.6; // fraction of the full pull that commits to the next slide
const GESTURE_END_MS = 160; // silence that ends a trackpad gesture
const NOTCH_END_MS = 380; // mouse wheels tick in notches: allow a pause between clicks
const NOTCH_DELTA = 60; // deltas this big come from a notched mouse wheel
const DRAG_SLOP = 8; // px before a touch is treated as a drag

export function canScroll(el: HTMLElement | null, direction: number): boolean {
  if (!el || el.scrollHeight <= el.clientHeight + 1) return false;
  return direction > 0 ? Math.ceil(el.scrollTop + el.clientHeight) < el.scrollHeight - 1 : el.scrollTop > 1;
}

/**
 * Turns wheel, trackpad, touch and keyboard input into slide navigation.
 *
 * Wheel and trackpad work like a magnet. Scrolling pulls the page towards the
 * next slide with growing resistance. Pull far enough and it lets go and
 * glides to that slide; stop earlier and it springs back. One gesture moves at
 * most one slide: the inertia that trackpads add after the fingers lift is
 * part of the same gesture, and is ignored once the gesture has committed.
 *
 * Touch: the page follows the finger and the deck decides on release whether
 * to move on or snap back. Inside a slide whose content overflows, the content
 * scrolls first; horizontal swipes are left to carousels.
 */
export function useDeckInput(target: React.RefObject<HTMLElement | null>, handlers: DeckInputHandlers) {
  const h = useRef(handlers);
  h.current = handlers;

  useEffect(() => {
    const root = target.current;
    if (!root) return;

    // ---------- Wheel (magnet) ----------
    let accum = 0; // signed wheel delta of the current gesture
    let lastTime = 0;
    let lastAbs = 0;
    let committed = false;
    let pulling = false;
    let endTimer = 0;

    const endGesture = () => {
      if (pulling && !committed) h.current.release();
      pulling = false;
      committed = false;
      accum = 0;
      lastAbs = 0;
    };

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return; // pinch zoom
      let dy = e.deltaY;
      if (e.deltaMode === 1) dy *= 16;
      else if (e.deltaMode === 2) dy *= window.innerHeight;
      if (Math.abs(e.deltaX) > Math.abs(dy)) return; // horizontal scrolling

      const dir = Math.sign(dy);
      if (!dir) return;
      const now = e.timeStamp || performance.now();

      const scroller = h.current.activeScroller();
      if (!pulling && scroller && scroller.contains(e.target as Node) && canScroll(scroller, dir)) {
        // Content taller than the screen scrolls first. Reaching its edge
        // mid-gesture must not start a pull; that takes a new gesture.
        committed = true;
        lastTime = now;
        window.clearTimeout(endTimer);
        endTimer = window.setTimeout(endGesture, GESTURE_END_MS);
        return;
      }

      e.preventDefault();
      const abs = Math.abs(dy);
      const endAfter = abs >= NOTCH_DELTA ? NOTCH_END_MS : GESTURE_END_MS;
      window.clearTimeout(endTimer);
      endTimer = window.setTimeout(endGesture, endAfter);

      const gap = now - lastTime;
      lastTime = now;
      // After a commit, a clear speed-up is a new flick (inertia only slows down).
      const freshFlick = committed && !h.current.isLocked() && abs > 24 && abs > lastAbs * 1.8;
      lastAbs = abs;
      if (gap > endAfter || freshFlick) {
        committed = false;
        accum = 0;
      }
      if (committed || h.current.isLocked()) return;

      accum += dy;
      pulling = true;
      const progress = Math.sign(accum) * (1 - Math.exp(-Math.abs(accum) / PULL_SOFTNESS));
      if (Math.abs(progress) >= COMMIT_AT) {
        committed = true;
        pulling = false;
        accum = 0;
        if (!h.current.commit(Math.sign(progress) as Direction)) h.current.release();
        return;
      }
      h.current.pull(progress);
    };

    // ---------- Touch ----------
    type Mode = "idle" | "pending" | "drag" | "native";
    let mode: Mode = "idle";
    let startX = 0;
    let startY = 0;
    let lastY = 0;
    let lastT = 0;
    let velocity = 0;
    let startScroller: HTMLElement | null = null;

    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      if (e.touches.length !== 1 || !t) {
        mode = "idle";
        return;
      }
      mode = "pending";
      startX = t.clientX;
      startY = lastY = t.clientY;
      lastT = e.timeStamp;
      velocity = 0;
      const scroller = h.current.activeScroller();
      startScroller = scroller && scroller.contains(e.target as Node) ? scroller : null;
    };

    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (mode === "idle" || mode === "native" || !t) return;
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;

      if (mode === "pending") {
        if (Math.abs(dx) < DRAG_SLOP && Math.abs(dy) < DRAG_SLOP) return;
        if (Math.abs(dx) > Math.abs(dy)) {
          mode = "native"; // horizontal: carousels
          return;
        }
        // Finger up (dy < 0) means the content wants to scroll down.
        if (startScroller && canScroll(startScroller, dy < 0 ? 1 : -1)) {
          mode = "native";
          return;
        }
        mode = "drag";
        startY = t.clientY; // start the drag without a jump
        h.current.dragStart();
      }

      if (e.cancelable) e.preventDefault();
      const ddy = t.clientY - startY;
      const dt = Math.max(1, e.timeStamp - lastT);
      velocity = 0.8 * ((t.clientY - lastY) / dt) + 0.2 * velocity;
      lastY = t.clientY;
      lastT = e.timeStamp;
      h.current.dragMove(ddy);
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (mode !== "drag") {
        mode = "idle";
        return;
      }
      mode = "idle";
      const t = e.changedTouches[0];
      const dy = t ? t.clientY - startY : 0;
      // A finger that stopped before lifting has no momentum.
      const v = e.timeStamp - lastT > 90 ? 0 : velocity;
      h.current.dragEnd(dy, v);
    };

    // ---------- Keyboard ----------
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.defaultPrevented) return;
      const el = e.target as HTMLElement;
      const tag = el.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable) return;

      const go = (dir: Direction) => {
        e.preventDefault();
        if (h.current.isLocked()) return;
        const scroller = h.current.activeScroller();
        if ((e.key === "ArrowDown" || e.key === "ArrowUp") && canScroll(scroller, dir)) {
          scroller?.scrollBy({ top: dir * 140, behavior: "smooth" });
          return;
        }
        if (!h.current.step(dir)) h.current.onEdge(dir);
      };

      switch (e.key) {
        case "ArrowDown":
        case "PageDown":
          go(1);
          break;
        case "ArrowUp":
        case "PageUp":
          go(-1);
          break;
        case " ":
          if (tag === "BUTTON" || tag === "A") return;
          go(e.shiftKey ? -1 : 1);
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
    root.addEventListener("touchmove", onTouchMove, { passive: false });
    root.addEventListener("touchend", onTouchEnd, { passive: true });
    root.addEventListener("touchcancel", onTouchEnd, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.clearTimeout(endTimer);
      root.removeEventListener("touchstart", onTouchStart);
      root.removeEventListener("touchmove", onTouchMove);
      root.removeEventListener("touchend", onTouchEnd);
      root.removeEventListener("touchcancel", onTouchEnd);
      window.removeEventListener("keydown", onKey);
    };
  }, [target]);
}
