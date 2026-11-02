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
const SETTLE_DURATION = 0.55; // seconds to settle back on the same slide
const MAX_SPEED = 4; // screens per second a glide takes over from the moving page
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
  /** Direction of the glide to a new slide that is running, 0 when none is. */
  const glideDir = useRef<1 | -1 | 0>(0);
  /** The running glide: a curve from y0 (moving at v0 px/s) to rest at y1, over T seconds. */
  const glide = useRef<{ y0: number; v0: number; y1: number; T: number; s: number } | null>(null);
  /** The wheel magnet's pull, added on top of the slide or the glide. */
  const offset = useRef({ o: 0 });
  const offsetTween = useRef<gsap.core.Tween | null>(null);
  /** How fast the track moves, in px/s, sampled every frame. */
  const motion = useRef({ y: 0, t: 0, v: 0 });
  const dragBase = useRef(0);
  const reduced = useRef(false);
  const [index, setIndex] = useState(0);
  const [ready, setReady] = useState(false);

  const scrollerOf = (i: number) => slideRefs.current[i]?.querySelector<HTMLElement>(".slide-scroll") ?? null;
  const yFor = (i: number) => -i * height.current;

  /**
   * Where the glide is at progress s (0 to 1). A quintic Hermite curve: it
   * starts at the speed the page already had and comes to rest without a
   * jolt, so turning a glide around or carrying it on never jerks the page.
   */
  const glideY = (g: { y0: number; v0: number; y1: number; T: number; s: number }) => {
    const s = g.s;
    const s3 = s * s * s;
    const s4 = s3 * s;
    const s5 = s4 * s;
    const toEnd = 10 * s3 - 15 * s4 + 6 * s5;
    const speed = s - 6 * s3 + 8 * s4 - 3 * s5;
    return g.y0 + (g.y1 - g.y0) * toEnd + g.T * g.v0 * speed;
  };

  /** Places the track: the slide (or the glide towards it) plus the magnet's pull. */
  const render = () => {
    const base = glide.current ? glideY(glide.current) : yFor(current.current);
    gsap.set(trackRef.current, { y: base + offset.current.o });
  };

  const setOffset = (o: number, duration: number, ease: string) => {
    offsetTween.current?.kill();
    offsetTween.current = gsap.to(offset.current, { o, duration, ease, onUpdate: render });
  };

  const stopOffset = () => {
    offsetTween.current?.kill();
    offsetTween.current = null;
    offset.current.o = 0;
  };

  /** Moves the track to slide `target`, from wherever it is and at the speed it already has. */
  const glideTo = useCallback(
    (target: number, opts: { instant?: boolean; /** px/s, when known better than measured */ velocity?: number } = {}) => {
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
      stopOffset();
      if (opts.instant || reduced.current) {
        glide.current = null;
        tween.current = null;
        glideDir.current = 0;
        gsap.set(track, { y: yFor(clamped) });
        return;
      }
      const h = height.current || 1;
      const y0 = Number(gsap.getProperty(track, "y"));
      const y1 = yFor(clamped);
      const distance = Math.abs(y1 - y0);
      // Take over the speed the page already has (a pull, a drag, a glide).
      const v0 = Math.max(-MAX_SPEED * h, Math.min(MAX_SPEED * h, opts.velocity ?? motion.current.v));
      // Shorter when part of the distance is already covered.
      let T = changed ? Math.max(0.45, Math.min(GLIDE_DURATION, GLIDE_DURATION * (distance / h + 0.15))) : SETTLE_DURATION;
      // Already heading there fast: arrive sooner rather than brake first
      // (and never overshoot, which needs T * v0 <= 2.5 * distance).
      if (v0 * (y1 - y0) > 0) T = Math.max(0.3, Math.min(T, (2.2 * distance) / Math.abs(v0)));
      glideDir.current = changed ? (y1 < y0 ? 1 : -1) : 0;
      const g = { y0, v0, y1, T, s: 0 };
      glide.current = g;
      tween.current = gsap.to(g, {
        s: 1,
        duration: T,
        ease: "none",
        onUpdate: render,
        onComplete: () => {
          tween.current = null;
          glide.current = null;
          glideDir.current = 0;
          render();
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
    stopOffset();
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
    gliding: () => glideDir.current,
    activeScroller: () => scrollerOf(current.current),
    onEdge: bounce,
    pull: (progress) => {
      const target = current.current + Math.sign(progress);
      const edge = target < 0 || target >= ids.length;
      // At rest the page is pulled away from its slide; during a glide, the
      // pull speeds it on or holds it back.
      // (Eased in while gliding, so the page's speed never flips in one frame.)
      const o = -progress * height.current * (edge ? EDGE_PULL : MAX_PULL);
      if (glide.current) setOffset(o, 0.35, "power2.inOut");
      else setOffset(o, 0.3, "power3.out");
    },
    commit: (dir) => {
      const target = current.current + dir;
      if (target < 0 || target >= ids.length) return false;
      glideTo(target);
      return true;
    },
    release: () => {
      // Spring back without locking input, so a new gesture can start right away.
      if (reduced.current) {
        stopOffset();
        render();
      } else if (glide.current) setOffset(0, 0.45, "power2.inOut");
      else setOffset(0, 0.7, "elastic.out(1, 0.75)");
    },
    dragStart: () => {
      tween.current?.kill();
      tween.current = null;
      glide.current = null;
      glideDir.current = 0;
      stopOffset();
      gsap.killTweensOf(trackRef.current);
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
      glideTo(target, { velocity: velocity * 1000 });
    },
  });

  // Start-up: measure, jump to the slide in the URL hash, wire listeners.
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
      if (!tween.current) render();
    };
    measure();
    const rootObserver = new ResizeObserver(measure);
    rootObserver.observe(root);

    slideRefs.current.forEach((s) => s && prepareReveal(s));

    // Sample the track's speed every frame, so a new glide can take it over.
    const sample = () => {
      const now = performance.now();
      const y = Number(gsap.getProperty(trackRef.current, "y"));
      const m = motion.current;
      const dt = (now - m.t) / 1000;
      if (dt > 0 && dt < 0.1) m.v = 0.5 * m.v + (0.5 * (y - m.y)) / dt;
      else m.v = 0;
      m.y = y;
      m.t = now;
    };
    gsap.ticker.add(sample);

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
      gsap.ticker.remove(sample);
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
