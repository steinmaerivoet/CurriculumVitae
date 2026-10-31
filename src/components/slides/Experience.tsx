import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import type { CV } from "@/lib/cv";
import { range } from "@/lib/format";
import SlideFrame from "@/components/ui/SlideFrame";
import Eyebrow from "@/components/ui/Eyebrow";
import LinkChip from "@/components/ui/LinkChip";
import { useFollow } from "@/components/deck/follow";

export default function Experience({ cv }: { cv: CV }) {
  const { experience } = cv;
  const [active, setActive] = useState(0);
  const [openProject, setOpenProject] = useState(0);
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

  // Linked from a skill, a project card or the graph.
  useFollow("employer", (t) => {
    const i = experience.items.findIndex((e) => e.company === t.company);
    if (i === -1) return;
    setActive(i);
    const p = t.project ? experience.items[i]!.projects.findIndex((p) => p.id === t.project) : 0;
    setOpenProject(Math.max(0, p));
  });

  if (!item) return null;

  return (
    // Anchored to the top: a longer story only grows downwards, the list never moves.
    <SlideFrame className="!justify-start">
      <Eyebrow id="experience" label={experience.label} />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)] lg:gap-16">
        {/* Role list: a horizontal strip on mobile, a vertical list on desktop. */}
        <div
          role="tablist"
          data-carousel
          aria-label={experience.label}
          className="-mr-11 -ml-6 flex snap-x scroll-px-6 gap-2 overflow-x-auto pr-11 pl-6 [scrollbar-width:none] [touch-action:pan-x] sm:-mr-20 sm:-ml-10 sm:pr-20 sm:pl-10 lg:mx-0 lg:flex-col lg:gap-0 lg:overflow-visible lg:border-t lg:border-line lg:px-0"
          data-reveal
        >
          {experience.items.map((it, i) => {
            const selected = i === active;
            return (
              <button
                key={it.company}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls="experience-panel"
                onClick={() => {
                  setActive(i);
                  setOpenProject(0);
                }}
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
                  <span className="mt-0.5 hidden truncate text-sm text-mute lg:block">{it.roles.map((r) => r.title).join(" · ")}</span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Details of the selected employer */}
        <div ref={panelRef} id="experience-panel" role="tabpanel" className="min-w-0" data-reveal>
          <p data-panel className="text-sm text-mute tabular-nums">
            {range(item.start, item.end, experience.presentLabel)}
            {item.location ? <span> · {item.location}</span> : null}
          </p>
          <h3 data-panel className="mt-2 font-serif text-[clamp(2rem,4.4vw,3.5rem)] leading-[1.02] tracking-tight italic text-accent short:text-[2.5rem]">
            {item.company}
          </h3>

          {/* Roles at this employer, newest first */}
          <ol data-panel className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
            {item.roles.map((r, i) => (
              <li key={r.title + r.start} className="flex items-center gap-2">
                <span className={`h-1.5 w-1.5 rounded-full ${i === 0 ? "bg-accent" : "bg-mute/60"}`} aria-hidden="true" />
                <span className={i === 0 ? "text-paper" : "text-paper/70"}>{r.title}</span>
                <span className="text-mute tabular-nums">{range(r.start, r.end, experience.presentLabel)}</span>
              </li>
            ))}
          </ol>

          <p data-panel className="mt-4 max-w-2xl text-[15px] leading-relaxed text-paper/80 sm:text-base short:mt-3">
            {item.summary}
          </p>

          {/* Projects: one open at a time, so long stories never push the slide out of the screen */}
          {item.projects.length > 0 && (
            <div data-panel className="mt-5 max-w-2xl short:mt-4">
              <p className="mb-1 text-[11px] tracking-[0.2em] text-mute uppercase">{experience.projectsLabel}</p>
              <ul className="border-t border-line">
                {item.projects.map((p, i) => {
                  const open = i === openProject;
                  return (
                    <li key={p.id} className="border-b border-line">
                      <button
                        type="button"
                        aria-expanded={open}
                        onClick={() => setOpenProject(open ? -1 : i)}
                        className="group flex w-full items-baseline gap-3 py-2.5 text-left short:py-2"
                      >
                        <span className={`text-[15px] font-medium transition-colors ${open ? "text-paper" : "text-paper/75 group-hover:text-paper"}`}>
                          {p.name}
                        </span>
                        {p.period ? <span className="text-xs text-mute tabular-nums">{p.period}</span> : null}
                        <span
                          className={`ml-auto self-center text-mute transition-transform duration-300 ${open ? "rotate-45 text-accent" : ""}`}
                          aria-hidden="true"
                        >
                          <svg width="12" height="12" viewBox="0 0 12 12">
                            <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" />
                          </svg>
                        </span>
                      </button>
                      <div
                        className={`grid transition-[grid-template-rows,opacity] duration-500 ease-out-expo ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                      >
                        <div className="overflow-hidden">
                          <div className="space-y-2 pb-3 text-sm leading-relaxed text-mute">
                            {p.description.map((d) => (
                              <p key={d.slice(0, 32)}>{d}</p>
                            ))}
                            {p.url ? (
                              <a
                                href={p.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                tabIndex={open ? 0 : -1}
                                className="inline-flex items-center gap-1.5 text-paper/80 underline decoration-line underline-offset-4 hover:text-accent"
                              >
                                {new URL(p.url).hostname.replace(/^www\./, "")}
                                <svg width="10" height="10" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                                  <path d="M1 13 13 1M13 1H4M13 1v9" stroke="currentColor" strokeWidth="1.5" />
                                </svg>
                              </a>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {item.highlights.length > 0 && (
            <ul className="mt-4 space-y-2">
              {item.highlights.map((h) => (
                <li key={h} data-panel className="flex gap-3 text-sm leading-relaxed text-mute">
                  <span className="mt-2.5 h-px w-4 shrink-0 bg-accent" aria-hidden="true" />
                  {h}
                </li>
              ))}
            </ul>
          )}
          {item.techChips.length > 0 && (
            <ul data-panel className="mt-5 flex flex-wrap gap-1.5 short:mt-3 short:gap-1">
              {item.techChips.map((c) => (
                <li key={c.label}>
                  <LinkChip chip={c} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </SlideFrame>
  );
}
