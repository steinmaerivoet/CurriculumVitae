import type { SlideProps } from "@/web/themes/types";
import type { GitView } from "@/bff/web/themes/git";
import type { Term } from "@/core/model";
import { slug } from "@/core/matching";
import { range } from "@/bff/shared/format";
import { TermLink } from "@/web/shared/TermLink";
import { useEmployerSelection } from "@/web/headless/useEmployerSelection";
import Frame from "../ui/Frame";
import Command from "../ui/Command";
import Lane from "../ui/Lane";

/** `git log --graph`: one commit per employer; `git show` of the selected one, with the stack as a diff. */
export default function Experience({ deck, view }: SlideProps<GitView>) {
  const { experience } = deck;
  const { active, item, select, openProject, toggleProject } = useEmployerSelection(experience.items);
  const commit = view.commits[active];
  if (!item || !commit) return null;
  const n = experience.items.length;
  const kept = item.tech.filter((t) => commit.diff.added.every((a) => a.label !== t.label));

  return (
    <Frame top>
      <Command command={view.commands.experience} arg={slug(experience.label)} />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.25fr)] lg:gap-10">
        <div role="tablist" aria-label={experience.label} aria-orientation="vertical" data-reveal className="min-w-0 lg:border-r lg:border-line lg:pr-4">
          {experience.items.map((e, i) => {
            const c = view.commits[i];
            if (!c) return null;
            const selected = i === active;
            return (
              <button
                key={e.company}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls="experience-panel"
                onClick={() => select(i)}
                className={`grid w-full grid-cols-[3rem_4.5rem_minmax(0,1fr)_auto] items-center gap-2 rounded-md pr-3 text-left transition-colors ${
                  selected ? "bg-bg-2 shadow-[inset_2px_0_var(--c-accent)]" : "hover:bg-bg-2/60"
                }`}
              >
                <Lane commit={c} first={i === 0} last={i === n - 1} />
                <span className="g-gold text-xs">{c.hash}</span>
                <span className="truncate">
                  {c.type}: {c.subject} <span className="text-mute">@ {c.scope}</span>
                </span>
                <span className="text-xs text-mute">{e.start}</span>
              </button>
            );
          })}
        </div>

        <div id="experience-panel" role="tabpanel" aria-label={item.company} className="min-w-0">
          <p className="mb-3 grid gap-0.5 text-xs text-mute">
            <span>
              commit <span className="g-gold">{commit.hash}</span>
              {commit.head ? ` (HEAD → ${view.branch}, tag: ${view.tag})` : ""}
            </span>
            <span>
              Date: {item.period}
              {item.location ? ` · ${item.location}` : ""}
            </span>
          </p>
          <h3 className="font-display text-[clamp(1.6rem,2.8vw,2.2rem)] leading-tight font-semibold tracking-tight">{item.company}</h3>
          <ul className="mt-1 mb-3 text-xs">
            {item.roles.map((r) => (
              <li key={r.title + r.start}>
                {r.title} <span className="text-mute">{range(r.start, r.end, experience.presentLabel)}</span>
              </li>
            ))}
          </ul>
          <p className="g-prose mb-3 max-w-[60ch] font-display text-[15px] leading-normal">{item.summary}</p>
          {item.highlights.map((h) => (
            <p key={h} className="g-prose mb-2 font-display text-sm before:mr-2 before:text-accent before:content-['→']">
              {h}
            </p>
          ))}

          <div className="overflow-hidden rounded-lg border border-line text-xs">
            <p className="flex justify-between bg-bg-2 px-3 py-1.5 text-mute">
              stack.yaml
              <span>
                <span className="g-add">+{commit.diff.added.length}</span> <span className="g-del">−{commit.diff.removed.length}</span>
              </span>
            </p>
            <ul className="flex flex-wrap gap-1 p-2.5">
              {commit.diff.removed.map((t) => (
                <Chip key={`-${t.label}`} term={t} sign="−" />
              ))}
              {commit.diff.added.map((t) => (
                <Chip key={`+${t.label}`} term={t} sign="+" />
              ))}
              {kept.map((t) => (
                <Chip key={t.label} term={t} />
              ))}
            </ul>
          </div>

          {item.projects.length ? (
            <ul className="mt-3 grid gap-1">
              {item.projects.map((p, i) => {
                const open = i === openProject;
                return (
                  <li key={p.id}>
                    <button type="button" aria-expanded={open} onClick={() => toggleProject(i)} className="g-violet text-left text-xs hover:underline">
                      {open ? "▾" : "▸"} Merge branch '{slug(p.name)}'
                    </button>
                    {open ? <p className="g-prose mt-0.5 ml-4 max-w-[62ch] font-display text-sm leading-snug">{p.name}: {p.summary ?? p.description[0]}</p> : null}
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      </div>
    </Frame>
  );
}

const SIGN_CLASS = { "+": "g-add bg-[color-mix(in_oklab,var(--g-add)_9%,transparent)]", "−": "g-del bg-[color-mix(in_oklab,var(--g-del)_8%,transparent)] line-through decoration-1" } as const;

function Chip({ term, sign }: { term: Term; sign?: "+" | "−" }) {
  return (
    <li>
      <TermLink
        term={term}
        className={`block rounded px-1.5 py-0.5 text-[11px] leading-4 ${sign ? SIGN_CLASS[sign] : "text-mute"}`}
        linkClassName="hover:text-fg hover:underline"
      >
        {sign ? <span aria-hidden="true">{sign}</span> : null}
        {term.label}
      </TermLink>
    </li>
  );
}
