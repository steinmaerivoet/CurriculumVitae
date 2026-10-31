import { Fragment, lazy, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { skillKinds, type CV, type Skill, type SkillKind, type SkillLevel } from "@/lib/cv";
import SlideFrame from "@/components/ui/SlideFrame";
import Eyebrow from "@/components/ui/Eyebrow";
import { follow, useFollow } from "@/components/deck/follow";

// The network view is an extra: loaded only when someone opens it.
const SkillGraph = lazy(() => import("./SkillGraph"));

const LEVEL_VALUE: Record<SkillLevel, number> = { familiar: 1, advanced: 2, expert: 3 };
const canHover = () => window.matchMedia("(hover: hover) and (min-width: 1024px)").matches;

type Entry = Skill & { group: string; kind: SkillKind; key: string };
type Filter = { id: string; label: string; count: number; divider: boolean };

/** A filter is either a whole kind ("kind:technology") or one group. */
const shows = (filter: string, e: Entry) => (filter.startsWith("kind:") ? e.kind === filter.slice(5) : e.group === filter);

function Logo({ skill, className = "" }: { skill: Skill; className?: string }) {
  if (skill.icon) {
    return (
      <svg
        viewBox={skill.icon.viewBox}
        className={className}
        aria-hidden="true"
        fill="currentColor"
        // Markup comes from the icon sets at build time, never from user input.
        dangerouslySetInnerHTML={{ __html: skill.icon.body }}
      />
    );
  }
  // No brand logo: a monogram in the same footprint.
  const letters = skill.name
    .split(/[\s/&-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  return (
    <span className={`grid place-items-center font-serif leading-none ${className}`} aria-hidden="true">
      <span className="text-[0.95em]">{letters}</span>
    </span>
  );
}

function Meter({ level, className = "" }: { level: SkillLevel | undefined; className?: string }) {
  const value = level ? LEVEL_VALUE[level] : 0;
  return (
    <span className={`flex gap-0.5 ${className}`} aria-hidden="true">
      {[1, 2, 3].map((n) => (
        <span key={n} className={`h-full flex-1 rounded-full ${n <= value ? "bg-accent" : "bg-paper/15"}`} />
      ))}
    </span>
  );
}

function Detail({ entry, cv, onClose }: { entry: Entry; cv: CV; onClose?: () => void }) {
  const { skills } = cv;
  const ref = useRef<HTMLDivElement>(null);

  // A short, deliberate transition when another skill is selected.
  useEffect(() => {
    if (!ref.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.fromTo(
      ref.current.querySelectorAll("[data-detail]"),
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.45, ease: "power3.out", stagger: 0.04, overwrite: true },
    );
  }, [entry.key]);

  return (
    <div ref={ref} className="relative overflow-hidden rounded-3xl border border-line bg-ink-3/80 p-5 backdrop-blur-xl sm:p-7">
      <div
        className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgb(212_255_90/0.14),transparent_65%)]"
        aria-hidden="true"
      />
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 grid h-9 w-9 place-items-center rounded-full text-mute hover:text-paper"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            <path d="M2 2l10 10M12 2 2 12" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
      ) : null}

      <div className="flex items-center gap-4" data-detail>
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-line bg-ink text-accent sm:h-16 sm:w-16">
          <Logo skill={entry} className="h-7 w-7 text-[1.6rem] sm:h-8 sm:w-8" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] tracking-[0.2em] text-mute uppercase">{entry.group}</p>
          <h3 className="font-serif text-3xl leading-tight tracking-tight sm:text-4xl">{entry.name}</h3>
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-4 border-y border-line py-4" data-detail>
        <div>
          <dt className="text-xs text-mute">Level</dt>
          <dd className="mt-1.5">
            <span className="block text-sm font-medium">{entry.level ? skills.levelLabels[entry.level] : "–"}</span>
            <Meter level={entry.level} className="mt-2 h-1.5 w-24" />
          </dd>
        </div>
        <div>
          <dt className="text-xs text-mute">{skills.sinceLabel}</dt>
          <dd className="mt-1.5 text-sm font-medium tabular-nums">
            {entry.since ?? "–"}
            {entry.years ? (
              <span className="text-mute">
                {" "}
                · {entry.years} {skills.yearsLabel}
              </span>
            ) : null}
          </dd>
        </div>
      </dl>

      {entry.usedIn.length > 0 && (
        <div className="mt-5" data-detail>
          <p className="mb-2 text-xs text-mute">{skills.usedInLabel}</p>
          <ul className="space-y-1.5">
            {entry.usedIn.slice(0, 6).map((u) => (
              <li key={u.title + u.sub + u.period}>
                <button
                  type="button"
                  onClick={() => follow(u.target)}
                  className="group/u flex w-full items-baseline justify-between gap-4 text-left text-sm"
                >
                  <span className="min-w-0">
                    <span className="text-paper underline decoration-transparent underline-offset-4 transition-colors group-hover/u:decoration-accent">
                      {u.title}
                    </span>
                    {u.sub ? <span className="text-mute"> · {u.sub}</span> : null}
                  </span>
                  <span className="shrink-0 text-xs text-mute tabular-nums">
                    {u.period}
                    <span className="ml-1.5 inline-block text-accent opacity-0 transition-opacity group-hover/u:opacity-100" aria-hidden="true">
                      →
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function Skills({ cv }: { cv: CV }) {
  const { skills } = cv;
  const entries = useMemo<Entry[]>(
    () => skills.groups.flatMap((g) => g.items.map((s) => ({ ...s, group: g.name, kind: g.kind, key: `${g.name}/${s.name}` }))),
    [skills],
  );
  // Technologies, ways of working and tools are never mixed on the board.
  // A kind with several groups gets an "all of this kind" tab before them.
  const filters = useMemo<Filter[]>(() => {
    const out: Filter[] = [];
    for (const kind of skillKinds) {
      const groups = skills.groups.filter((g) => g.kind === kind);
      if (!groups.length) continue;
      const divider = out.length > 0;
      if (groups.length > 1) {
        out.push({ id: `kind:${kind}`, label: skills.kindLabels[kind], count: groups.reduce((n, g) => n + g.items.length, 0), divider });
      }
      groups.forEach((g, i) => out.push({ id: g.name, label: g.name, count: g.items.length, divider: divider && groups.length === 1 && i === 0 }));
    }
    return out;
  }, [skills]);
  const [filter, setFilter] = useState<string>(filters[0]?.id ?? "");
  const [selected, setSelected] = useState<string>(entries[0]?.key ?? "");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [graphOpen, setGraphOpen] = useState(false);
  const gridRef = useRef<HTMLUListElement>(null);
  const settling = useRef(false); // tiles are animating in: ignore hover
  const filtered = useRef(false);

  // Phones start on the first group, so the board fits on one screen.
  useEffect(() => {
    if (!window.matchMedia("(min-width: 1024px)").matches && skills.groups[0]) setFilter(skills.groups[0].name);
  }, [skills.groups]);

  // The board keeps the height of its largest group, so changing the filter
  // never moves the title, the filters or the legend.
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const fit = () => {
      const wide = window.matchMedia("(min-width: 1024px)").matches;
      const largest = Math.max(...filters.filter((f) => wide || !f.id.startsWith("kind:")).map((f) => f.count));
      const cols = getComputedStyle(grid).gridTemplateColumns.split(" ").filter(Boolean).length || 1;
      const tile = grid.querySelector<HTMLElement>("[data-tile]:not([hidden])");
      const gap = parseFloat(getComputedStyle(grid).rowGap) || 0;
      if (!tile) return;
      const rows = Math.ceil(largest / cols);
      grid.style.minHeight = `${rows * tile.offsetHeight + (rows - 1) * gap}px`;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(grid);
    return () => ro.disconnect();
  }, [filters]);

  const changeFilter = (next: string) => {
    if (next === filter) return;
    filtered.current = true;
    setFilter(next);
    // Keep a visible skill selected.
    const cur = entries.find((e) => e.key === selected);
    if (cur && !shows(next, cur)) {
      const first = entries.find((e) => shows(next, e));
      if (first) setSelected(first.key);
    }
  };

  // New tiles deal in, set up before the browser paints so nothing flashes
  // in its final place first.
  useLayoutEffect(() => {
    const grid = gridRef.current;
    if (!filtered.current || !grid) return;
    filtered.current = false;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    settling.current = true;
    const tiles = grid.querySelectorAll("[data-tile]:not([hidden])");
    gsap.killTweensOf(tiles);
    gsap.fromTo(
      tiles,
      { opacity: 0, y: 10 },
      {
        opacity: 1,
        y: 0,
        duration: 0.4,
        ease: "power3.out",
        stagger: 0.02,
        clearProps: "opacity,transform",
        onComplete: () => {
          settling.current = false;
        },
      },
    );
  }, [filter]);

  // Linked from experience, a project card or the graph.
  useFollow("skill", (t) => {
    const entry = entries.find((e) => e.name === t.name);
    if (!entry) return;
    const wide = window.matchMedia("(min-width: 1024px)").matches;
    const kindTab = `kind:${entry.kind}`;
    const next = shows(filter, entry) ? filter : wide && filters.some((f) => f.id === kindTab) ? kindTab : entry.group;
    if (next !== filter) {
      filtered.current = true;
      setFilter(next);
    }
    setSelected(entry.key);
    if (!wide) setSheetOpen(true);
  });

  const visible = (e: Entry) => shows(filter, e);
  const current = entries.find((e) => e.key === selected) ?? entries[0];

  const select = (key: string, openSheet: boolean) => {
    setSelected(key);
    if (openSheet) setSheetOpen(true);
  };


  return (
    <SlideFrame
      background={
        <div className="absolute top-1/3 -left-1/4 h-[70vmax] w-[70vmax] rounded-full bg-[radial-gradient(circle,rgb(124_140_255/0.07),transparent_60%)]" />
      }
    >
      <Eyebrow id="skills" label={skills.label} />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-12 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] xl:gap-10">
        <div className="min-w-0">
          {skills.title ? (
            <h2 className="mb-5 font-serif text-[clamp(2rem,4.2vw,3.5rem)] leading-[1.02] tracking-tight short:mb-4 short:text-[2.5rem]" data-reveal>
              {skills.title}
            </h2>
          ) : null}

          {/* Filters */}
          <div
            role="tablist"
            aria-label={skills.label}
            data-carousel
            className="-mr-11 -ml-6 mb-5 flex gap-2 overflow-x-auto pr-11 pl-6 [scrollbar-width:none] [touch-action:pan-x] sm:-mr-20 sm:-ml-10 sm:pr-20 sm:pl-10 lg:mx-0 lg:flex-wrap lg:px-0"
            data-reveal
          >
            {filters.map((f) => {
              const on = f.id === filter;
              return (
                <Fragment key={f.id}>
                {f.divider ? <span className="mx-1 h-5 w-px shrink-0 self-center bg-line" aria-hidden="true" /> : null}
                <button
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => changeFilter(f.id)}
                  className={`flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm transition-colors duration-300 ${
                    on ? "border-accent bg-accent text-ink" : "border-line text-paper/75 hover:border-paper/30 hover:text-paper"
                  }`}
                >
                  {f.label}
                  <span className={`text-xs tabular-nums ${on ? "text-ink/60" : "text-mute"}`}>{f.count}</span>
                </button>
                </Fragment>
              );
            })}
          </div>

          {/* Board */}
          <ul ref={gridRef} className="grid content-start grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4" data-reveal>
            {entries.map((e) => {
              const on = current?.key === e.key;
              return (
                <li key={e.key} data-tile hidden={!visible(e)}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => select(e.key, true)}
                    // Move, not enter: a tile sliding under a resting cursor doesn't select itself.
                    onPointerMove={(ev) => ev.pointerType === "mouse" && !settling.current && !on && canHover() && select(e.key, false)}
                    onFocus={() => select(e.key, false)}
                    className={`group flex h-12 w-full items-center gap-3 rounded-xl border px-3 text-left transition-all duration-300 short:h-11 ${
                      on
                        ? "border-accent/70 bg-accent/[0.07] shadow-[0_0_0_1px_rgb(212_255_90/0.25),0_8px_30px_-12px_rgb(212_255_90/0.4)]"
                        : "border-line bg-paper/[0.02] hover:border-paper/25 hover:bg-paper/[0.04]"
                    }`}
                  >
                    <Logo
                      skill={e}
                      className={`h-[18px] w-[18px] shrink-0 text-[0.9rem] transition-colors duration-300 ${on ? "text-accent" : "text-paper/70 group-hover:text-paper"}`}
                    />
                    <span className="min-w-0 flex-1 truncate text-[13px] leading-tight text-paper/90">{e.name}</span>
                    <Meter level={e.level} className="h-1 w-6 shrink-0" />
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Legend */}
          <p className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-mute" data-reveal>
            {(["expert", "advanced", "familiar"] as const).map((l) => (
              <span key={l} className="flex items-center gap-2">
                <Meter level={l} className="h-1 w-6" />
                {skills.levelLabels[l]}
              </span>
            ))}
            <span className="hidden lg:inline">· {skills.hint}</span>
            <button
              type="button"
              onClick={() => setGraphOpen(true)}
              className="ml-auto flex items-center gap-1.5 rounded-full px-2 py-1 text-mute/80 transition-colors hover:text-accent"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
                <circle cx="5" cy="6" r="2.2" />
                <circle cx="19" cy="5" r="2.2" />
                <circle cx="12" cy="18" r="2.2" />
                <circle cx="17" cy="14" r="1.6" />
                <path d="M7 7l3.8 9M17 6.8 12.9 16M7.2 6l9.6-.8M17 15.5l-3.4 1.6" />
              </svg>
              {skills.graphButton}
            </button>
          </p>
        </div>

        {/* Detail: side panel on desktop */}
        <div className="hidden lg:block" data-reveal>
          {current ? <Detail entry={current} cv={cv} /> : null}
        </div>
      </div>

      {/* Detail: floating card on phones and tablets */}
      {/* Zero-height anchor: the card floats over the board instead of pushing it around. */}
      {current && sheetOpen ? (
        <div className="sticky bottom-[4.75rem] z-10 h-0 lg:hidden">
          <div className="absolute inset-x-0 bottom-0 shadow-[0_-20px_60px_-10px_rgb(0_0_0/0.7)]">
            <Detail entry={current} cv={cv} onClose={() => setSheetOpen(false)} />
          </div>
        </div>
      ) : null}
      {graphOpen ? (
        <Suspense fallback={null}>
          <SkillGraph
            graph={cv.graph}
            onClose={() => setGraphOpen(false)}
            labels={{ title: skills.graphTitle, hint: skills.graphHint, close: "Close" }}
          />
        </Suspense>
      ) : null}
    </SlideFrame>
  );
}
