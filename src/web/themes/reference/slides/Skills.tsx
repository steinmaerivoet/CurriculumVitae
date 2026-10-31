import type { SlideProps } from "@/web/themes/types";
import type { ReferenceView } from "@/bff/web/themes/reference";
import { useSkillSelection } from "@/web/headless/useSkillSelection";
import { RefLink } from "@/web/shared/TermLink";
import DocPage from "../ui/DocPage";
import Endpoint from "../ui/Endpoint";
import Response from "../ui/Response";
import JsonView from "../ui/JsonView";
import Pills from "../ui/Pills";
import { useJsonLinker } from "../ui/useJsonLinker";

/** The Skill object: filters as query pills, skills as fields, the selected one as JSON. */
export default function Skills({ deck, view }: SlideProps<ReferenceView>) {
  const { skills } = deck;
  const { entries, filters, filter, setFilter, selected, select, visible } = useSkillSelection(skills);
  const linker = useJsonLinker(deck);
  const ep = view.endpoints.skills;
  const json = view.resources.skills.find((s) => s.name === selected?.name);
  const shown = entries.filter(visible);

  return (
    <DocPage
      top
      crumb={`${view.nav[1]?.title ?? ""} / ${skills.label.toLowerCase()}`}
      response={
        <Response title={selected ? `skills["${selected.name}"]` : "skills"} href={ep.href}>
          <JsonView value={json ?? null} linker={linker} />
        </Response>
      }
    >
      <div data-reveal className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-3">
        <h2 className="text-[clamp(1.5rem,2.4vw,1.9rem)] leading-tight font-semibold tracking-tight">{skills.title}</h2>
        <Endpoint endpoint={ep} />
      </div>
      <Pills
        label={skills.label}
        items={filters.map((f) => f.label)}
        counts={filters.map((f) => f.count)}
        active={Math.max(0, filters.findIndex((f) => f.id === filter))}
        onSelect={(i) => setFilter(filters[i]!.id)}
      />
      <ul data-reveal className="mt-4 grid border-t border-line text-sm sm:grid-cols-2 sm:gap-x-6">
        {shown.map((s) => {
          const on = s.key === selected?.key;
          return (
            <li key={s.key} className="border-b border-line">
              <button
                type="button"
                aria-pressed={on}
                onClick={() => select(s.key)}
                className={`flex w-full items-center gap-2 px-1.5 py-1 text-left transition-colors short:py-[3px] ${on ? "bg-[#eaefff]" : "hover:bg-surface"}`}
              >
                <code className={`min-w-0 flex-1 truncate font-mono text-[13px] ${on ? "font-semibold text-accent" : ""}`}>{s.name}</code>
                {s.level ? (
                  <span className="r-level" data-level={s.level}>
                    {s.level}
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
      {selected ? (
        <div className="mt-4 min-h-[7.5rem]">
          <h3 className="text-lg font-semibold">
            {selected.name}
            <span className="ml-2 text-sm font-normal text-mute">
              {selected.group}
              {selected.since ? ` · ${skills.sinceLabel.toLowerCase()} ${selected.since}` : ""}
            </span>
          </h3>
          <p className="mt-1 mb-1 font-mono text-[11px] font-semibold tracking-[0.08em] text-mute uppercase">{skills.usedInLabel}</p>
          <ul className="flex flex-wrap gap-1.5">
            {selected.usedIn.map((u) => (
              <li key={u.title + u.sub}>
                <RefLink to={u.ref} className="rounded-md border border-line bg-surface px-2 py-0.5 text-[13px] transition-colors hover:border-accent hover:text-accent">
                  {u.title} <span className="text-mute">· {u.sub}</span>
                </RefLink>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </DocPage>
  );
}
