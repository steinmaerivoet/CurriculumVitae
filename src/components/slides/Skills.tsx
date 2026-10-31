import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { Flip } from "gsap/Flip";
import type { CV, Skill, SkillLevel } from "@/lib/cv";
import SlideFrame from "@/components/ui/SlideFrame";
import Eyebrow from "@/components/ui/Eyebrow";

gsap.registerPlugin(Flip);

const LEVEL_VALUE: Record<SkillLevel, number> = { familiar: 1, advanced: 2, expert: 3 };
const ALL = "__all__";
const canHover = () => window.matchMedia("(hover: hover) and (min-width: 1024px)").matches;

type Entry = Skill & { group: string; key: string };

function Logo({ skill, className = "" }: { skill: Skill; className?: string }) {
  if (skill.icon) {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
        <path d={skill.icon.path} />
      </svg>
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
          <ul className="space-y-2">
            {entry.usedIn.slice(0, 5).map((u) => (
              <li key={u.title + u.sub + u.period} className="flex items-baseline justify-between gap-4 text-sm">
                <span className="min-w-0">
                  <span className="text-paper">{u.title}</span>
                  {u.sub ? <span className="text-mute"> · {u.sub}</span> : null}
                </span>
                {u.period ? <span className="shrink-0 text-xs text-mute tabular-nums">{u.period}</span> : null}
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
    () => skills.groups.flatMap((g) => g.items.map((s) => ({ ...s, group: g.name, key: `${g.name}/${s.name}` }))),
    [skills],
  );
  const [filter, setFilter] = useState<string>(ALL);
  const [selected, setSelected] = useState<string>(entries[0]?.key ?? "");
  const [sheetOpen, setSheetOpen] = useState(false);
  const gridRef = useRef<HTMLUListElement>(null);
  const flipState = useRef<Flip.FlipState | null>(null);

  // Phones start on the first group, so the board fits on one screen.
  useEffect(() => {
    if (!window.matchMedia("(min-width: 1024px)").matches && skills.groups[0]) setFilter(skills.groups[0].name);
  }, [skills.groups]);

  const changeFilter = (next: string) => {
    if (next === filter) return;
    if (gridRef.current && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      flipState.current = Flip.getState(gridRef.current.querySelectorAll("[data-tile]"));
    }
    setFilter(next);
  };

  // Tiles glide to their new places when the filter changes.
  useLayoutEffect(() => {
    const state = flipState.current;
    if (!state || !gridRef.current) return;
    flipState.current = null;
    Flip.from(state, {
      targets: gridRef.current.querySelectorAll("[data-tile]"),
      duration: 0.55,
      ease: "power3.inOut",
      absolute: true,
      stagger: 0.008,
      onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.45, delay: 0.1 }),
      onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.85, duration: 0.3 }),
    });
  }, [filter]);

  const visible = (e: Entry) => filter === ALL || e.group === filter;
  const current = entries.find((e) => e.key === selected) ?? entries[0];
  const counts = useMemo(() => Object.fromEntries(skills.groups.map((g) => [g.name, g.items.length])), [skills.groups]);

  const select = (key: string, openSheet: boolean) => {
    setSelected(key);
    if (openSheet) setSheetOpen(true);
  };

  const filters = [{ id: ALL, label: skills.allLabel, count: entries.length }, ...skills.groups.map((g) => ({ id: g.name, label: g.name, count: counts[g.name] ?? 0 }))];

  return (
    <SlideFrame
      background={
        <div className="absolute top-1/3 -left-1/4 h-[70vmax] w-[70vmax] rounded-full bg-[radial-gradient(circle,rgb(124_140_255/0.07),transparent_60%)]" />
      }
    >
      <Eyebrow id="skills" label={skills.label} />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-12 xl:gap-16">
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
                <button
                  key={f.id}
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
              );
            })}
          </div>

          {/* Board */}
          <ul ref={gridRef} className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4" data-reveal>
            {entries.map((e) => {
              const on = current?.key === e.key;
              return (
                <li key={e.key} data-tile data-flip-id={e.key} style={visible(e) ? undefined : { display: "none" }}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => select(e.key, true)}
                    onPointerEnter={(ev) => ev.pointerType === "mouse" && canHover() && select(e.key, false)}
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
    </SlideFrame>
  );
}
