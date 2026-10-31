import type { SlideProps } from "@/web/themes/types";
import type { GitView } from "@/bff/web/themes/git";
import { slug } from "@/core/matching";
import { useSkillSelection } from "@/web/headless/useSkillSelection";
import { RefLink } from "@/web/shared/TermLink";
import Frame from "../ui/Frame";
import Command from "../ui/Command";

/** A contribution heatmap: one row per skill, one column per year. */
export default function Skills({ deck, view }: SlideProps<GitView>) {
  const { skills } = deck;
  const { entries, filters, filter, setFilter, selected, select, visible } = useSkillSelection(skills);
  const shown = entries.filter(visible);
  const cols = `minmax(7rem,11rem) repeat(${view.years.length}, minmax(0, 1fr))`;
  const label = (y: number, i: number) => (i === 0 || i === view.years.length - 1 || y % 5 === 0 ? `’${String(y).slice(2)}` : "");

  return (
    <Frame top>
      <Command command={view.commands.skills} arg={slug(skills.label)} />
      <h2 className="sr-only">{skills.title}</h2>
      <div role="tablist" aria-label={skills.label} data-reveal className="mb-4 flex flex-wrap gap-1.5">
        {filters.map((f) => {
          const on = f.id === filter;
          return (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setFilter(f.id)}
              className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors ${on ? "border-fg bg-fg text-bg" : "border-line text-mute hover:text-fg"}`}
            >
              {slug(f.label)} <span className="opacity-60">{f.count}</span>
            </button>
          );
        })}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-10">
        <div data-reveal className="min-w-0 overflow-x-auto [scrollbar-width:none]" data-carousel>
          <div className="min-w-[30rem]">
            <div className="grid gap-[3px] text-[10px] text-mute" style={{ gridTemplateColumns: cols }} aria-hidden="true">
              <span />
              {view.years.map((y, i) => (
                <span key={y} className="text-center">
                  {label(y, i)}
                </span>
              ))}
            </div>
            <ul className="grid gap-[3px]">
              {shown.map((s) => {
                const on = s.key === selected?.key;
                return (
                  <li key={s.key}>
                    <button
                      type="button"
                      aria-pressed={on}
                      onClick={() => select(s.key)}
                      className="grid h-[17px] w-full items-stretch gap-[3px] text-left text-[11px] short:h-[15px]"
                      style={{ gridTemplateColumns: cols }}
                    >
                      <span className={`truncate pr-2 leading-[17px] short:leading-[15px] ${on ? "text-accent" : "hover:text-fg"}`}>{s.name}</span>
                      {(view.heat[s.name] ?? []).map((h, i) => (
                        <i key={view.years[i]} className={`g-cell ${on ? "ring-1 ring-fg/40" : ""}`} data-heat={h} style={{ ["--col" as string]: i }} />
                      ))}
                    </button>
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 flex items-center justify-end gap-1 text-[11px] text-mute" aria-hidden="true">
              {skills.levelLabels.familiar.toLowerCase()}
              {[0, 1, 2, 3, 4].map((h) => (
                <span key={h} className="inline-block size-3">
                  <i className="g-cell" data-heat={h} />
                </span>
              ))}
              {skills.levelLabels.expert.toLowerCase()}
            </p>
          </div>
        </div>

        {selected ? (
          <div className="min-w-0">
            <p className="mb-2 text-xs text-mute">$ git log --follow {slug(selected.name)}</p>
            <h3 className="font-display text-[clamp(1.6rem,2.6vw,2.1rem)] leading-tight font-semibold tracking-tight">{selected.name}</h3>
            <p className="mb-3 text-xs text-mute">
              {selected.group}
              {selected.level ? <span className="g-gold"> · {skills.levelLabels[selected.level]}</span> : null}
              {selected.since ? ` · ${skills.sinceLabel.toLowerCase()} ${selected.since}` : ""}
              {selected.years ? ` · ${selected.years} ${skills.yearsLabel}` : ""}
            </p>
            <ul className="grid gap-1.5 border-l-2 border-line pl-4">
              {selected.usedIn.map((u) => (
                <li key={u.title + u.sub} className="relative before:absolute before:top-1.5 before:-left-[1.3rem] before:size-2 before:rounded-full before:border-2 before:border-accent before:bg-bg">
                  <RefLink to={u.ref} className="group text-left">
                    <span className="font-display text-[15px] group-hover:text-accent">{u.title}</span>
                    <span className="text-xs text-mute"> · {u.sub}</span>
                  </RefLink>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </Frame>
  );
}
