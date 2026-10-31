import { useRef, useState, type PointerEvent } from "react";
import { gsap } from "gsap";
import type { CV } from "@/lib/cv";
import { pad } from "@/lib/format";
import SlideFrame from "@/components/ui/SlideFrame";
import Eyebrow from "@/components/ui/Eyebrow";
import LinkChip from "@/components/ui/LinkChip";
import { follow, useFollow } from "@/components/deck/follow";

type Project = CV["projects"]["items"][number];

function Card({ project, n, lit }: { project: Project; n: number; lit: boolean }) {
  const ref = useRef<HTMLElement>(null);

  // Subtle 3D tilt and a light that follows the pointer (mouse only).
  const onMove = (e: PointerEvent<HTMLElement>) => {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty("--mx", `${x * 100}%`);
    el.style.setProperty("--my", `${y * 100}%`);
    gsap.to(el, { rotateY: (x - 0.5) * 8, rotateX: (0.5 - y) * 8, duration: 0.6, ease: "power3.out" });
  };
  const onLeave = () => gsap.to(ref.current, { rotateX: 0, rotateY: 0, duration: 0.9, ease: "elastic.out(1, 0.5)" });

  const meta = project.meta ? (
    project.employer ? (
      <button
        type="button"
        onClick={() => follow({ kind: "employer", company: project.employer!, project: project.id })}
        className="text-mute underline decoration-transparent underline-offset-4 transition-colors hover:text-paper hover:decoration-accent"
      >
        {project.meta}
      </button>
    ) : (
      <span className="text-mute">{project.meta}</span>
    )
  ) : null;

  return (
    <li data-project={project.id} className="w-[78vw] max-w-sm shrink-0 snap-center [perspective:1000px] sm:w-auto sm:max-w-none" data-reveal>
      <article
        ref={ref}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        className={`group relative flex h-full min-h-[19rem] flex-col overflow-hidden rounded-3xl border bg-ink-3/60 p-6 transition-[border-color,box-shadow] duration-700 [transform-style:preserve-3d] hover:border-paper/25 sm:min-h-[16rem] lg:min-h-0 lg:p-7 short:p-6 before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(600px_circle_at_var(--mx,50%)_var(--my,0%),rgb(212_255_90/0.09),transparent_40%)] before:opacity-0 before:transition-opacity before:duration-500 hover:before:opacity-100 ${
          lit ? "border-accent shadow-[0_0_0_1px_rgb(212_255_90/0.35),0_20px_60px_-20px_rgb(212_255_90/0.35)]" : "border-line"
        }`}
      >
        <div className="relative flex items-start justify-between gap-3">
          <span className="text-sm tabular-nums">
            <span className="text-accent">{pad(n)}</span>
            {meta ? <span className="text-mute"> · </span> : null}
            {meta}
          </span>
          {project.url ? (
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${project.name} (opens in a new tab)`}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line transition-all duration-500 hover:rotate-45 hover:border-accent hover:bg-accent hover:text-ink"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M1 13 13 1M13 1H4M13 1v9" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </a>
          ) : null}
        </div>
        <div className="relative mt-auto pt-8 lg:pt-6 short:pt-4">
          <h3 className="font-serif text-3xl leading-tight tracking-tight lg:text-[1.75rem]">{project.name}</h3>
          <p className="mt-2.5 text-sm leading-relaxed text-mute lg:line-clamp-3 short:line-clamp-2">
            {project.summary ?? project.description[0]}
          </p>
          {project.tagChips.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-1.5">
              {project.tagChips.map((c) => (
                <li key={c.label}>
                  <LinkChip chip={c} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </article>
    </li>
  );
}

export default function Projects({ cv }: { cv: CV }) {
  const { projects } = cv;
  const listRef = useRef<HTMLUListElement>(null);
  const [lit, setLit] = useState<string | null>(null);
  const timer = useRef(0);

  // Linked from a skill or the graph: bring the card into view and light it up.
  useFollow("project", (t) => {
    setLit(t.id);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setLit(null), 2400);
    const card = listRef.current?.querySelector<HTMLElement>(`[data-project="${t.id}"]`);
    const list = listRef.current;
    if (card && list && list.scrollWidth > list.clientWidth) {
      list.scrollTo({ left: card.offsetLeft - list.offsetLeft - 24, behavior: "smooth" });
    }
  });

  return (
    <SlideFrame>
      <Eyebrow id="projects" label={projects.label} />
      {/* Swipeable carousel on mobile, grid from tablet up. */}
      <ul ref={listRef} data-carousel className="-mr-11 -ml-6 flex snap-x snap-mandatory scroll-px-6 gap-4 overflow-x-auto pr-11 pb-2 pl-6 [scrollbar-width:none] [touch-action:pan-x] sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:[touch-action:auto] lg:grid-cols-3 lg:gap-6">
        {projects.featured.map((p, i) => (
          <Card key={p.id} project={p} n={i + 1} lit={lit === p.id} />
        ))}
      </ul>
    </SlideFrame>
  );
}
