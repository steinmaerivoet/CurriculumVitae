import { useRef, type PointerEvent } from "react";
import { gsap } from "gsap";
import type { CV } from "@/lib/cv";
import { pad } from "@/lib/format";
import SlideFrame from "@/components/ui/SlideFrame";
import Eyebrow from "@/components/ui/Eyebrow";

type Project = CV["projects"]["items"][number];

function Card({ project, n }: { project: Project; n: number }) {
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

  const Inner = (
    <>
      <div className="flex items-start justify-between">
        <span className="text-sm text-accent tabular-nums">
          {pad(n)}
          {project.meta ? <span className="text-mute"> · {project.meta}</span> : null}
        </span>
        {project.url ? (
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line transition-all duration-500 group-hover:rotate-45 group-hover:border-accent group-hover:bg-accent group-hover:text-ink">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M1 13 13 1M13 1H4M13 1v9" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </span>
        ) : null}
      </div>
      <div className="mt-auto pt-8 lg:pt-6 short:pt-4">
        <h3 className="font-serif text-3xl leading-tight tracking-tight lg:text-[1.75rem]">{project.name}</h3>
        <p className="mt-2.5 text-sm leading-relaxed text-mute lg:line-clamp-3 short:line-clamp-2">{project.description}</p>
        {project.tags.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {project.tags.map((t) => (
              <li key={t} className="rounded-full bg-paper/[0.05] px-2.5 py-1 text-xs text-paper/75">
                {t}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );

  const className =
    "group relative flex h-full min-h-[19rem] sm:min-h-[16rem] lg:min-h-0 flex-col overflow-hidden rounded-3xl border border-line bg-ink-3/60 p-6 lg:p-7 short:p-6 transition-colors duration-500 [transform-style:preserve-3d] hover:border-paper/25 " +
    "before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(600px_circle_at_var(--mx,50%)_var(--my,0%),rgb(212_255_90/0.09),transparent_40%)] before:opacity-0 before:transition-opacity before:duration-500 hover:before:opacity-100";

  return (
    <li className="w-[78vw] max-w-sm shrink-0 snap-center [perspective:1000px] sm:w-auto sm:max-w-none" data-anim>
      {project.url ? (
        <a
          ref={(el) => {
            ref.current = el;
          }}
          href={project.url}
          target="_blank"
          rel="noopener noreferrer"
          className={className}
          onPointerMove={onMove}
          onPointerLeave={onLeave}
        >
          {Inner}
        </a>
      ) : (
        <article ref={ref} className={className} onPointerMove={onMove} onPointerLeave={onLeave}>
          {Inner}
        </article>
      )}
    </li>
  );
}

export default function Projects({ cv }: { cv: CV }) {
  const { projects } = cv;

  return (
    <SlideFrame>
      <Eyebrow id="projects" label={projects.label} />
      {/* Swipeable carousel on mobile, grid from tablet up. */}
      <ul className="-mr-11 -ml-6 flex snap-x snap-mandatory scroll-px-6 gap-4 overflow-x-auto pr-11 pb-2 pl-6 [scrollbar-width:none] [touch-action:pan-x] sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:[touch-action:auto] lg:grid-cols-3 lg:gap-6">
        {projects.items.map((p, i) => (
          <Card key={p.name} project={p} n={i + 1} />
        ))}
      </ul>
    </SlideFrame>
  );
}
