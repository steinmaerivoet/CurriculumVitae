import { useRef } from "react";
import type { SlideProps } from "@/web/themes/types";
import type { TerminalView } from "@/bff/web/themes/terminal";
import { skillLevels } from "@/core/model";
import type { SkillView } from "@/bff/web/model";
import { useSkillSelection } from "@/web/headless/useSkillSelection";
import { RefLink } from "@/web/shared/TermLink";
import Frame from "../ui/Frame";
import Pane from "../ui/Pane";

const LEVEL_CLASS = { expert: "t-green", advanced: "t-yellow", familiar: "t-cyan" } as const;
const METER = 24;

/** htop: a meter per skill group, the skills as a process table, and the selected one in detail. */
export default function Skills({ deck, view }: SlideProps<TerminalView>) {
  const { skills } = deck;
  const detailRef = useRef<HTMLDivElement>(null);
  const reveal = () => {
    if (window.innerWidth < 1024) requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
  };
  const { entries, filters, filter, setFilter, selected, select, visible } = useSkillSelection(skills, { onFollow: reveal });
  const thisYear = new Date().getFullYear();

  // Sorted like htop: by level, then by how long it has been running.
  const rank = (l: SkillView["level"]) => (l ? skillLevels.indexOf(l) : skillLevels.length);
  const rows = entries.filter(visible).sort((a, b) => rank(a.level) - rank(b.level) || (a.since ?? thisYear) - (b.since ?? thisYear));

  return (
    <Frame top>
      <h2 className="sr-only">{skills.title}</h2>
      <div data-reveal className="mb-3 grid gap-x-8 gap-y-0.5 sm:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
        {view.meters.map((m) => {
          const filled = Math.round(m.fill * METER);
          return (
            <div key={m.group} className="grid grid-cols-[10ch_minmax(0,1fr)] gap-2 whitespace-nowrap">
              <span className="t-cyan truncate">{m.group.split(" ")[0]}</span>
              <span className="overflow-hidden whitespace-pre text-mute">
                [<span className="t-green">{"|".repeat(Math.min(filled, 12))}</span>
                <span className="t-yellow">{"|".repeat(Math.max(0, Math.min(filled, 20) - 12))}</span>
                <span className="t-red">{"|".repeat(Math.max(0, filled - 20))}</span>
                {" ".repeat(METER - filled)}
                <span className="text-fg">{String(m.count).padStart(2)}</span>]
              </span>
            </div>
          );
        })}
      </div>

      <div role="tablist" aria-label={skills.label} data-reveal className="mb-3 flex flex-wrap gap-x-4 gap-y-1">
        {filters.map((f, i) => {
          const on = f.id === filter;
          return (
            <button key={f.id} type="button" role="tab" aria-selected={on} onClick={() => setFilter(f.id)} className={`whitespace-nowrap ${on ? "text-fg" : "text-mute hover:text-fg"}`}>
              <b className={`mr-1 rounded-[3px] px-1 font-medium text-bg ${on ? "bg-accent" : "bg-[var(--t-cyan)]"}`}>F{i + 1}</b>
              {f.label} <span className="text-mute">{f.count}</span>
            </button>
          );
        })}
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-6">
        <div data-reveal className="min-w-0 text-[13px] short:text-xs">
          <div className="grid grid-cols-[6ch_6ch_9ch_minmax(0,1fr)] gap-x-3 bg-[var(--t-green)] px-2 font-bold text-bg" aria-hidden="true">
            <span>{skills.sinceLabel.toUpperCase()}</span>
            <span>{skills.yearsLabel.toUpperCase()}</span>
            <span>LEVEL</span>
            <span>{skills.label.toUpperCase()}</span>
          </div>
          <ul>
            {rows.map((s) => {
              const on = s.key === selected?.key;
              return (
                <li key={s.key}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => {
                      select(s.key);
                      reveal();
                    }}
                    className={`grid w-full grid-cols-[6ch_6ch_9ch_minmax(0,1fr)] gap-x-3 px-2 text-left ${on ? "bg-[var(--t-cyan)] text-bg" : "hover:bg-surface"}`}
                  >
                    <span className={on ? "" : "text-mute"}>{s.since ?? "—"}</span>
                    <span className={on ? "" : "text-mute"}>{s.years ?? "—"}</span>
                    <span className={on ? "" : s.level ? LEVEL_CLASS[s.level] : "text-mute"}>{s.level ? skills.levelLabels[s.level].toLowerCase() : "—"}</span>
                    <span className="truncate">{s.name}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {selected ? (
          <div ref={detailRef} className="min-w-0 scroll-mb-12">
            <Pane title={`${skills.usedInLabel.toLowerCase()} · ${selected.usedIn.length}`}>
              <h3 className="text-xl font-extrabold tracking-tight">{selected.name}</h3>
              <p className="mb-3 text-mute">
                {selected.group}
                {selected.level ? (
                  <>
                    {" "}· <span className={LEVEL_CLASS[selected.level]}>{skills.levelLabels[selected.level]}</span>
                  </>
                ) : null}
                {selected.since ? ` · ${skills.sinceLabel.toLowerCase()} ${selected.since}` : ""}
              </p>
              <ul className="grid gap-1">
                {selected.usedIn.map((u) => (
                  <li key={u.title + u.sub}>
                    <RefLink to={u.ref} className="group grid w-full grid-cols-[1.2rem_minmax(0,1fr)] text-left">
                      <span className="text-accent" aria-hidden="true">
                        ❯
                      </span>
                      <span className="min-w-0">
                        <span className="group-hover:text-accent">{u.title}</span>
                        <span className="text-mute"> · {u.sub}</span>
                        {u.period ? <span className="t-yellow ml-2 text-xs">{u.period}</span> : null}
                      </span>
                    </RefLink>
                  </li>
                ))}
              </ul>
              {selected.usedIn.length === 0 ? <p className="text-mute">{skills.hint}</p> : null}
            </Pane>
          </div>
        ) : null}
      </div>
    </Frame>
  );
}
