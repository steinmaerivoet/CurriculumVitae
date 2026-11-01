import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import type { SectionId } from "@/core/model";
import type { Theme, SlideProps } from "@/web/themes/types";
import { prepareReveal, revealOnce } from "./reveal";
import { useDeckInput } from "./useDeckInput";
import { DeckContext } from "./context";
import { useFollowSlides } from "./follow";

// Motion
const GLIDE_DURATION = 0.95; // seconds for one slide
const GLIDE_EASE = "power3.inOut";
const SWIPE_DISTANCE = 0.16; // fraction of the screen a drag must cover...
const SWIPE_VELOCITY = 0.35; // ...or px/ms it must be flicked with
const RUBBER_BAND = 0.3; // resistance when dragging past the first/last slide
const MAX_PULL = 0.35; // wheel magnet: how far (fraction of the screen) the page can be pulled
const EDGE_PULL = 0.06; // ...and past the first/last slide

/**
 * The slideshow engine: all slides sit on one vertical track that glides from
 * one slide to the next. The track only ever comes to rest exactly on a slide.
 *
 * It knows nothing about how slides look: the theme supplies the slide
 * components and the chrome, the deck model supplies the content.
 */
export default function Deck<V>({ deck, view, theme }: SlideProps<V> & { theme: Theme<V> }) {
  const ids = useMemo(() => deck.sections.map((s) => s.id), [deck.sections]);
  const labels = useMemo(() => deck.sections.map((s) => s.label), [deck.sections]);

  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLElement | null)[]>([]);
  const current = useRef(0);
  const height = useRef(0);
  const tween = useRef<gsap.core.Tween | null>(null);
  const dragBase = useRef(0);
  const reduced = useRef(false);
  const [index, setIndex] = useState(0);
  const [ready, setReady] = useState(false);

  const scrollerOf = (i: number) => slideRefs.current[i]?.querySelector<HTMLElement>(".slide-scroll") ?? null;
  const yFor = (i: number) => -i * height.current;

  /** Moves the track to slide `target`. With `from`, continues from a dragged position. */
  const glideTo = useCallback(
    (target: number, opts: { instant?: boolean; velocity?: number } = {}) => {
      const track = trackRef.current;
      if (!track) return;
      const clamped = Math.max(0, Math.min(ids.length - 1, target));
      const changed = clamped !== current.current;
      current.current = clamped;

      if (changed) {
        setIndex(clamped);
        history.replaceState(null, "", `#${ids[clamped]}`);
        const scroller = scrollerOf(clamped);
        if (scroller) scroller.scrollTop = 0;
        const slide = slideRefs.current[clamped];
        if (slide) revealOnce(slide, reduced.current);
      }

      tween.current?.kill();
      gsap.killTweensOf(track);
      if (opts.instant || reduced.current) {
        gsap.set(track, { y: yFor(clamped) });
        tween.current = null;
        return;
      }
      // Shorter when finishing a drag: part of the distance is already covered.
      const remaining = Math.abs(Number(gsap.getProperty(track, "y")) - yFor(clamped)) / (height.current || 1);
      const duration = changed
        ? Math.max(0.45, GLIDE_DURATION * Math.min(1, remaining + 0.15))
        : 0.55;
      tween.current = gsap.to(track, {
        y: yFor(clamped),
        duration,
        ease: changed ? (opts.velocity ? "power3.out" : GLIDE_EASE) : "power3.out",
        onComplete: () => {
          tween.current = null;
        },
      });
    },
    [ids],
  );

  const goTo = useCallback(
    (target: number): boolean => {
      if (target < 0 || target >= ids.length || target === current.current) return false;
      glideTo(target);
      return true;
    },
    [ids, glideTo],
  );

  const goToId = useCallback(
    (id: SectionId) => {
      const i = ids.indexOf(id);
      if (i !== -1) goTo(i);
    },
    [ids, goTo],
  );

  // A small nudge at the first/last slide, so the page never feels stuck.
  const bounce = useCallback((dir: 1 | -1) => {
    const track = trackRef.current;
    if (!track || reduced.current || tween.current) return;
    const y = yFor(current.current);
    tween.current = gsap.to(track, {
      keyframes: [
        { y: y - 28 * dir, duration: 0.16, ease: "power2.out" },
        { y, duration: 0.7, ease: "elastic.out(1, 0.5)" },
      ],
      onComplete: () => {
        tween.current = null;
      },
    });
  }, []);

  useDeckInput(rootRef, {
    step: (dir) => goTo(current.current + dir),
    first: () => goTo(0),
    last: () => goTo(ids.length - 1),
    // Locked while the track is gliding to a new slide.
    isLocked: () => tween.current !== null,
    activeScroller: () => scrollerOf(current.current),
    onEdge: bounce,
    pull: (progress) => {
      const target = current.current + Math.sign(progress);
      const edge = target < 0 || target >= ids.length;
      const y = yFor(current.current) - progress * height.current * (edge ? EDGE_PULL : MAX_PULL);
      gsap.to(trackRef.current, { y, duration: 0.3, ease: "power3.out", overwrite: true });
    },
    commit: (dir) => {
      const target = current.current + dir;
      if (target < 0 || target >= ids.length) return false;
      // The page is already moving: continue smoothly instead of easing in again.
      glideTo(target, { velocity: 1 });
      return true;
    },
    release: () => {
      // Spring back without locking input, so a new gesture can start right away.
      if (reduced.current) {
        gsap.set(trackRef.current, { y: yFor(current.current) });
        return;
      }
      gsap.to(trackRef.current, { y: yFor(current.current), duration: 0.7, ease: "elastic.out(1, 0.75)", overwrite: true });
    },
    dragStart: () => {
      tween.current?.kill();
      tween.current = null;
      dragBase.current = Number(gsap.getProperty(trackRef.current, "y"));
    },
    dragMove: (dy) => {
      const min = yFor(ids.length - 1);
      let y = dragBase.current + dy;
      if (y > 0) y *= RUBBER_BAND;
      else if (y < min) y = min + (y - min) * RUBBER_BAND;
      gsap.set(trackRef.current, { y });
    },
    dragEnd: (dy, velocity) => {
      const y = Number(gsap.getProperty(trackRef.current, "y"));
      // Where the drag left us, as a fractional slide position.
      const pos = -y / (height.current || 1);
      const base = current.current;
      const far = Math.abs(dy) > height.current * SWIPE_DISTANCE;
      const fast = Math.abs(velocity) > SWIPE_VELOCITY && Math.abs(dy) > 20;
      let target = Math.round(pos);
      if (far || fast) target = dy < 0 ? Math.floor(pos) + 1 : Math.ceil(pos) - 1;
      // One swipe moves at most one slide from where the gesture began.
      target = Math.max(base - 1, Math.min(base + 1, target));
      glideTo(target, { velocity });
    },
  });

  // Start-up: measure, jump to the slide in the URL hash, wire listeners.
  // The current slide on <html>, for chrome outside the deck (the download buttons open up on the intro and contact slides).
  useEffect(() => {
    if (ready) document.documentElement.dataset.slide = ids[index];
  }, [ready, index, ids]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    reduced.current = mq.matches;
    const onMq = () => (reduced.current = mq.matches);
    mq.addEventListener("change", onMq);

    const measure = () => {
      height.current = root.clientHeight;
      root.style.setProperty("--deck-h", `${height.current}px`);
      if (!tween.current) gsap.set(trackRef.current, { y: yFor(current.current) });
    };
    measure();
    const rootObserver = new ResizeObserver(measure);
    rootObserver.observe(root);

    slideRefs.current.forEach((s) => s && prepareReveal(s));

    const start = Math.max(0, ids.indexOf(location.hash.slice(1) as SectionId));
    current.current = start;
    setIndex(start);
    gsap.set(trackRef.current, { y: yFor(start) });
    const first = slideRefs.current[start];
    // Next frame, so the hidden state is painted before the reveal transition runs.
    requestAnimationFrame(() => first && revealOnce(first, reduced.current));
    document.documentElement.classList.add("deck-ready");
    setReady(true);

    const onHash = () => {
      const i = ids.indexOf(location.hash.slice(1) as SectionId);
      if (i !== -1 && i !== current.current) glideTo(i);
    };
    window.addEventListener("hashchange", onHash);

    // Keyboard focus moving to another slide (Tab) brings that slide into view.
    const onFocus = (e: FocusEvent) => {
      const slide = (e.target as HTMLElement).closest?.(".slide");
      const i = slideRefs.current.indexOf(slide as HTMLElement);
      if (i !== -1 && i !== current.current) {
        root.scrollTop = 0;
        glideTo(i);
      }
    };
    root.addEventListener("focusin", onFocus);
    // The browser may scroll the clipped root to reveal focused content; undo it.
    const onScroll = () => {
      if (root.scrollTop) root.scrollTop = 0;
    };
    root.addEventListener("scroll", onScroll);
    // A #hash on load makes the browser jump the clipped root to that section
    // before we're listening; the track does the positioning, so undo it.
    root.scrollTop = 0;
    requestAnimationFrame(() => (root.scrollTop = 0));

    // Content taller than the viewport (small phones) may scroll inside its slide.
    const checkOverflow = () =>
      slideRefs.current.forEach((slide) => {
        const s = slide?.querySelector<HTMLElement>(".slide-scroll");
        if (s) s.toggleAttribute("data-overflow", s.scrollHeight > s.clientHeight + 1);
      });
    const contentObserver = new ResizeObserver(checkOverflow);
    slideRefs.current.forEach((slide) => {
      const s = slide?.querySelector(".slide-scroll");
      if (s) contentObserver.observe(s);
      if (s?.firstElementChild) contentObserver.observe(s.firstElementChild);
    });
    document.fonts?.ready.then(checkOverflow);

    return () => {
      mq.removeEventListener("change", onMq);
      rootObserver.disconnect();
      contentObserver.disconnect();
      window.removeEventListener("hashchange", onHash);
      root.removeEventListener("focusin", onFocus);
      root.removeEventListener("scroll", onScroll);
    };
  }, [ids, glideTo]);

  // Links between slides (a skill's "Used in", technology chips, the graph).
  useFollowSlides(goToId);

  const ctx = useMemo(() => ({ index, ids, goToId }), [index, ids, goToId]);

  const { Chrome, Backdrop } = theme;
  return (
    <DeckContext.Provider value={ctx}>
      <div ref={rootRef} className={`fixed inset-0 touch-none overflow-hidden ${theme.rootClassName ?? ""}`} data-ready={ready} data-theme-deck={theme.id}>
        <div ref={trackRef} className="deck-track">
          {ids.map((id, i) => {
            const Slide = theme.slides[id];
            const active = i === index;
            return (
              <section
                key={id}
                id={id}
                ref={(el) => {
                  slideRefs.current[i] = el;
                }}
                className={`slide ${theme.slideClassName?.(i) ?? ""}`}
                data-active={active}
                aria-roledescription="slide"
                aria-label={`${labels[i]} (${i + 1}/${ids.length})`}
              >
                <div className="slide-scroll">
                  <Slide deck={deck} view={view} />
                </div>
              </section>
            );
          })}
        </div>
        <Chrome deck={deck} view={view} index={index} goTo={goTo} ready={ready} />
        {Backdrop ? <Backdrop /> : null}
      </div>
    </DeckContext.Provider>
  );
}
