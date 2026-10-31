import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import type { CV } from "@/lib/cv";
import { pad } from "@/lib/format";

type Props = {
  cv: CV;
  labels: string[];
  index: number;
  goTo: (i: number) => boolean;
  ready: boolean;
};

/** Fixed UI around the slides: brand, call to action, dot navigation, counter and progress. */
export default function Chrome({ cv, labels, index, goTo, ready }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const total = labels.length;
  const contactIndex = cv.slides.indexOf("contact");
  const fullName = `${cv.person.firstName} ${cv.person.lastName}`;

  // Fade the chrome in once the deck is ready.
  useEffect(() => {
    if (!ready || !rootRef.current) return;
    gsap.fromTo(
      rootRef.current.querySelectorAll("[data-chrome]"),
      { autoAlpha: 0, y: (i) => (i % 2 ? 10 : -10) },
      { autoAlpha: 1, y: 0, duration: 1, ease: "expo.out", stagger: 0.08, delay: 0.6 },
    );
  }, [ready]);

  // Progress bar and rolling counter.
  useEffect(() => {
    gsap.to(progressRef.current, {
      scaleY: total > 1 ? index / (total - 1) : 1,
      duration: 1,
      ease: "power4.inOut",
    });
    const roll = [counterRef.current, labelRef.current];
    gsap.fromTo(roll, { yPercent: 100, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.7, ease: "expo.out", delay: 0.35, stagger: 0.05 });
  }, [index, total]);

  return (
    <div ref={rootRef} className="pointer-events-none fixed inset-0 z-40">
      {/* Soft fades so scrolled content never collides with the fixed UI on small screens. */}
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-ink from-35% to-transparent md:hidden" aria-hidden="true" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ink from-35% to-transparent md:hidden" aria-hidden="true" />
      {/* Top bar */}
      <header className="absolute inset-x-0 top-0 flex items-center justify-between px-6 pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-10 lg:px-16">
        <button
          type="button"
          data-chrome
          onClick={() => goTo(0)}
          className="pointer-events-auto text-sm font-medium tracking-tight text-paper/90 transition-colors hover:text-accent"
        >
          {fullName}
          <span className="text-accent">.</span>
        </button>
        {contactIndex > 0 && (
          <button
            type="button"
            data-chrome
            onClick={() => goTo(contactIndex)}
            className={`pointer-events-auto rounded-full border border-line px-4 py-2 text-xs font-medium tracking-wide text-paper/90 backdrop-blur-md transition-all duration-500 hover:border-accent hover:bg-accent hover:text-ink sm:text-sm ${
              index === contactIndex ? "pointer-events-none !opacity-0" : ""
            }`}
          >
            {cv.ui.talkButton}
          </button>
        )}
      </header>

      {/* Dot navigation */}
      <nav
        aria-label="Slides"
        data-chrome
        className="pointer-events-auto absolute top-1/2 right-1 -translate-y-1/2 rounded-full py-1 max-sm:bg-ink/60 max-sm:backdrop-blur-md sm:right-5 lg:right-8"
      >
        <div className="absolute inset-y-[1.125rem] left-1/2 w-px -translate-x-1/2 bg-line" aria-hidden="true">
          <div ref={progressRef} className="absolute inset-0 origin-top scale-y-0 bg-accent" />
        </div>
        <ol className="relative flex flex-col">
          {labels.map((label, i) => {
            const active = i === index;
            return (
              <li key={label + i}>
                <button
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={label}
                  aria-current={active ? "step" : undefined}
                  className="group relative flex h-7 w-7 items-center justify-center"
                >
                  <span
                    className={`block rounded-full transition-all duration-500 ease-out-expo ${
                      active ? "h-2.5 w-2.5 bg-accent shadow-[0_0_16px_var(--color-accent)]" : "h-1.5 w-1.5 bg-ink ring-1 ring-mute/70 group-hover:ring-paper"
                    }`}
                  />
                  <span className="pointer-events-none absolute right-9 hidden translate-x-2 rounded-md bg-ink-3/90 px-2.5 py-1 text-xs whitespace-nowrap text-paper opacity-0 backdrop-blur transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 md:block">
                    {label}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Counter + current section */}
      <div
        data-chrome
        className="absolute bottom-0 left-0 flex items-end gap-4 px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-xs tracking-[0.18em] text-mute uppercase sm:px-10 lg:px-16"
        aria-hidden="true"
      >
        <span className="flex overflow-hidden font-medium tabular-nums">
          <span ref={counterRef} className="inline-block text-paper">
            {pad(index + 1)}
          </span>
          <span className="mx-1.5 opacity-50">/</span>
          <span>{pad(total)}</span>
        </span>
        <span className="hidden overflow-hidden xs:inline-flex">
          <span ref={labelRef} className="inline-block">
            {labels[index]}
          </span>
        </span>
      </div>

      {/* Scroll hint, only on the first slide */}
      <button
        type="button"
        data-chrome
        onClick={() => goTo(1)}
        aria-label={cv.ui.scrollHint}
        className={`pointer-events-auto absolute right-14 bottom-0 flex items-center gap-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-[11px] tracking-[0.22em] text-mute uppercase transition-opacity duration-500 sm:right-20 lg:right-24 ${
          index === 0 ? "" : "pointer-events-none !opacity-0"
        }`}
      >
        {cv.ui.scrollHint}
        <span className="relative h-9 w-5 rounded-full border border-paper/25">
          <span className="absolute top-1.5 left-1/2 h-1.5 w-0.5 -translate-x-1/2 animate-bounce rounded-full bg-accent" />
        </span>
      </button>
    </div>
  );
}
