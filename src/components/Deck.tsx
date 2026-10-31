import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { gsap } from "gsap";
import type { CV, SlideId } from "@/lib/cv";
import { transitionSlides, revealSlide } from "./deck/transitions";
import { useDeckInput } from "./deck/useDeckInput";
import { DeckContext } from "./deck/context";
import Chrome from "./deck/Chrome";
import Hero from "./slides/Hero";
import About from "./slides/About";
import Experience from "./slides/Experience";
import Skills from "./slides/Skills";
import Projects from "./slides/Projects";
import Education from "./slides/Education";
import Contact from "./slides/Contact";

const SLIDES: Record<SlideId, (props: { cv: CV }) => ReactNode> = {
  hero: Hero,
  about: About,
  experience: Experience,
  skills: Skills,
  projects: Projects,
  education: Education,
  contact: Contact,
};

function labelFor(cv: CV, id: SlideId): string {
  return id === "hero" ? cv.ui.introLabel : cv[id].label;
}

export default function Deck({ cv }: { cv: CV }) {
  const ids = cv.slides;
  const labels = useMemo(() => ids.map((id) => labelFor(cv, id)), [cv, ids]);

  const rootRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLElement | null)[]>([]);
  const current = useRef(0);
  const locked = useRef(false);
  const reduced = useRef(false);
  const [index, setIndex] = useState(0);
  const [ready, setReady] = useState(false);

  const scrollerOf = (i: number) =>
    slideRefs.current[i]?.querySelector<HTMLElement>(".slide-scroll") ?? null;

  const goTo = useCallback(
    (target: number): boolean => {
      const from = slideRefs.current[current.current];
      const to = slideRefs.current[target];
      if (locked.current || target === current.current || !from || !to) return false;

      const direction = target > current.current ? 1 : -1;
      locked.current = true;
      current.current = target;
      setIndex(target);
      history.replaceState(null, "", `#${ids[target]}`);

      const scroller = scrollerOf(target);
      if (scroller) scroller.scrollTop = 0;

      gsap.set(from, { visibility: "visible" });
      const isSmall = window.matchMedia("(max-width: 640px)").matches;
      transitionSlides({
        from,
        to,
        direction,
        reduced: reduced.current,
        duration: isSmall ? 0.85 : 1.05,
        onComplete: () => {
          locked.current = false;
        },
      });
      return true;
    },
    [ids],
  );

  const goToId = useCallback(
    (id: SlideId) => {
      const i = ids.indexOf(id);
      if (i !== -1) goTo(i);
    },
    [ids, goTo],
  );

  const bounce = useCallback((dir: 1 | -1) => {
    if (reduced.current) return;
    const inner = slideRefs.current[current.current]?.querySelector(".slide-inner");
    if (!inner) return;
    gsap
      .timeline()
      .to(inner, { y: -26 * dir, duration: 0.18, ease: "power2.out" })
      .to(inner, { y: 0, duration: 0.9, ease: "elastic.out(1, 0.45)" });
  }, []);

  useDeckInput(rootRef, {
    next: () => goTo(current.current + 1),
    prev: () => goTo(current.current - 1),
    first: () => goTo(0),
    last: () => goTo(ids.length - 1),
    isLocked: () => locked.current,
    activeScroller: () => scrollerOf(current.current),
    onEdge: bounce,
  });

  // Mount: pick the slide from the URL hash and play the intro.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    reduced.current = mq.matches;
    const onMq = () => (reduced.current = mq.matches);
    mq.addEventListener("change", onMq);

    const start = Math.max(0, ids.indexOf(location.hash.slice(1) as SlideId));
    current.current = start;
    setIndex(start);
    slideRefs.current.forEach((el, i) => gsap.set(el, { visibility: i === start ? "visible" : "hidden" }));

    const el = slideRefs.current[start];
    if (el) revealSlide(el, reduced.current).delay(0.15);
    setReady(true);

    const onHash = () => {
      const i = ids.indexOf(location.hash.slice(1) as SlideId);
      if (i !== -1) goTo(i);
    };
    window.addEventListener("hashchange", onHash);

    // Content taller than the viewport (tiny or landscape phones) may scroll inside its slide.
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const s = entry.target as HTMLElement;
        s.toggleAttribute("data-overflow", s.scrollHeight > s.clientHeight + 1);
      }
    });
    slideRefs.current.forEach((slide) => {
      const s = slide?.querySelector(".slide-scroll");
      const content = s?.firstElementChild;
      if (s) ro.observe(s);
      if (content) ro.observe(content);
    });
    // Observing the content re-checks its parent scroller.
    const recheck = () =>
      slideRefs.current.forEach((slide) => {
        const s = slide?.querySelector<HTMLElement>(".slide-scroll");
        if (s) s.toggleAttribute("data-overflow", s.scrollHeight > s.clientHeight + 1);
      });
    window.addEventListener("resize", recheck);
    document.fonts?.ready.then(recheck);

    return () => {
      mq.removeEventListener("change", onMq);
      window.removeEventListener("hashchange", onHash);
      window.removeEventListener("resize", recheck);
      ro.disconnect();
    };
  }, [ids, goTo]);

  const ctx = useMemo(() => ({ index, ids, goToId }), [index, ids, goToId]);

  return (
    <DeckContext.Provider value={ctx}>
      <div ref={rootRef} className="fixed inset-0 touch-none overflow-hidden bg-ink" data-ready={ready}>
        {ids.map((id, i) => {
          const Slide = SLIDES[id];
          const active = i === index;
          return (
            <section
              key={id}
              id={id}
              ref={(el) => {
                slideRefs.current[i] = el;
              }}
              className="slide"
              data-active={active}
              aria-roledescription="slide"
              aria-label={`${labels[i]} (${i + 1}/${ids.length})`}
              aria-hidden={!active}
              inert={!active}
            >
              <div className="slide-outer">
                <div className="slide-inner">
                  <div className="slide-scroll">
                    <Slide cv={cv} />
                  </div>
                </div>
              </div>
              <div className="slide-shade pointer-events-none absolute inset-0 bg-black opacity-0" />
            </section>
          );
        })}
        <Chrome cv={cv} labels={labels} index={index} goTo={goTo} ready={ready} />
        <div className="grain" aria-hidden="true" />
      </div>
    </DeckContext.Provider>
  );
}
