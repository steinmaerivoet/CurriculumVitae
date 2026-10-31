import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import type { CV } from "@/lib/cv";
import { range } from "@/lib/format";
import SlideFrame from "@/components/ui/SlideFrame";
import Eyebrow from "@/components/ui/Eyebrow";

export default function Experience({ cv }: { cv: CV }) {
  const { experience } = cv;
  const [active, setActive] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const first = useRef(true);
  const item = experience.items[active];

  // Animate the detail panel whenever another role is selected.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const panel = panelRef.current;
    if (!panel || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.fromTo(
      panel.querySelectorAll("[data-panel]"),
      { autoAlpha: 0, y: 18 },
      { autoAlpha: 1, y: 0, duration: 0.7, ease: "expo.out", stagger: 0.05 },
    );
  }, [active]);

  if (!item) return null;

  return (
    <SlideFrame>
      <Eyebrow id="experience" label={experience.label} />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)] lg:gap-16">
        {/* Role list: a horizontal strip on mobile, a vertical list on desktop. */}
        <div
          role="tablist"
          aria-label={experience.label}
          className="-mr-11 -ml-6 flex snap-x scroll-px-6 gap-2 overflow-x-auto pr-11 pl-6 [scrollbar-width:none] [touch-action:pan-x] sm:-mr-20 sm:-ml-10 sm:pr-20 sm:pl-10 lg:mx-0 lg:flex-col lg:gap-0 lg:overflow-visible lg:border-t lg:border-line lg:px-0"
          data-anim
        >
          {experience.items.map((it, i) => {
            const selected = i === active;
            return (
              <button
                key={it.company + it.start}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls="experience-panel"
                onClick={() => setActive(i)}
                className={`group relative shrink-0 snap-start rounded-full border px-4 py-2.5 text-left transition-colors duration-300 lg:rounded-none lg:border-0 lg:border-b lg:border-line lg:px-0 lg:py-3.5 xl:py-4 short:py-2.5 ${
                  selected ? "border-accent bg-accent text-ink lg:bg-transparent lg:text-paper" : "border-line text-paper/70 hover:text-paper"
                }`}
              >
                <span
                  className={`absolute top-0 left-0 hidden h-full w-px origin-top bg-accent transition-transform duration-700 ease-out-expo lg:block ${
                    selected ? "scale-y-100" : "scale-y-0"
                  }`}
                />
                <span className="block lg:transition-[padding] lg:duration-500 lg:group-aria-selected:pl-5">
                  <span className="flex items-baseline justify-between gap-6">
                    <span className="text-sm font-medium whitespace-nowrap lg:font-serif lg:text-[1.375rem] lg:font-normal lg:tracking-tight xl:text-2xl">
                      {it.company}
                      <span className={`lg:hidden ${selected ? "text-ink/60" : "text-mute"}`}> · {it.start}</span>
                    </span>
                    <span className={`hidden text-sm tabular-nums lg:inline ${selected ? "text-accent" : "text-mute"}`}>
                      {range(it.start, it.end, experience.presentLabel)}
                    </span>
                  </span>
                  <span className="mt-0.5 hidden text-sm text-mute lg:block">{it.role}</span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Details of the selected role */}
        <div ref={panelRef} id="experience-panel" role="tabpanel" className="min-w-0" data-anim>
          <p data-panel className="text-sm text-mute tabular-nums">
            {range(item.start, item.end, experience.presentLabel)}
            {item.location ? <span> · {item.location}</span> : null}
          </p>
          <h3 data-panel className="mt-3 font-serif text-[clamp(2rem,4.4vw,3.75rem)] short:text-[2.75rem] leading-[1.02] tracking-tight">
            {item.role}
            <span className="text-mute"> @ </span>
            <span className="italic text-accent">{item.company}</span>
          </h3>
          <p data-panel className="mt-4 max-w-2xl text-[15px] leading-relaxed text-paper/80 sm:mt-5 sm:text-lg">
            {item.summary}
          </p>
          {item.highlights.length > 0 && (
            <ul className="mt-5 space-y-2.5 sm:mt-6 sm:space-y-3">
              {item.highlights.map((h) => (
                <li key={h} data-panel className="flex gap-3 text-sm leading-relaxed text-mute sm:text-base">
                  <span className="mt-2.5 h-px w-4 shrink-0 bg-accent" aria-hidden="true" />
                  {h}
                </li>
              ))}
            </ul>
          )}
          {item.tech.length > 0 && (
            <ul data-panel className="mt-6 flex flex-wrap gap-2 sm:mt-7">
              {item.tech.map((t) => (
                <li key={t} className="rounded-full border border-line px-3 py-1 text-xs text-paper/80">
                  {t}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </SlideFrame>
  );
}
