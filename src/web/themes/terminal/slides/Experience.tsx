import type { SlideProps } from "@/web/themes/types";
import type { TerminalView } from "@/bff/web/themes/terminal";
import { shortRange } from "@/bff/shared/format";
import { TermLink } from "@/web/shared/TermLink";
import { useEmployerSelection } from "@/web/headless/useEmployerSelection";
import Frame from "../ui/Frame";
import Pane from "../ui/Pane";

/** A fuzzy finder: employers on the left, the selected one previewed on the right. */
export default function Experience({ deck }: SlideProps<TerminalView>) {
  const { experience } = deck;
  const { active, item, select, openProject, toggleProject } = useEmployerSelection(experience.items);
  if (!item) return null;
  const n = experience.items.length;

  return (
    <Frame top>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.6fr)] lg:gap-6">
        <Pane title={experience.label.toLowerCase()} note={`${active + 1}/${n}`} className="self-start">
          <p className="mb-2 text-mute" aria-hidden="true">
            &gt; <span className="text-fg">▍</span>
          </p>
          <div role="tablist" aria-label={experience.label} aria-orientation="vertical" className="grid gap-0.5">
            {experience.items.map((e, i) => {
              const selected = i === active;
              return (
                <button
                  key={e.company}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-controls="experience-panel"
                  onClick={() => select(i)}
                  className={`relative grid grid-cols-[minmax(0,1fr)_auto] gap-3 rounded-[3px] px-2 py-0.5 text-left transition-colors ${
                    selected ? "bg-surface text-fg before:absolute before:-left-3 before:text-accent before:content-['❯']" : "text-mute hover:text-fg"
                  }`}
                >
                  <span className="truncate">
                    <b className={`font-medium ${selected ? "text-accent" : "text-fg"}`}>{e.company.toLowerCase()}</b> {e.role.toLowerCase()}
                  </span>
                  <span>{shortRange(e.start, e.end)}</span>
                </button>
              );
            })}
          </div>
        </Pane>

        <Pane title="preview" id="experience-panel" className="min-h-0">
          <div role="tabpanel" aria-label={item.company}>
            <p className="text-mute">
              period <span className="t-yellow">{item.period}</span>
              {item.location ? (
                <>
                  {" "}· where <span className="t-yellow">{item.location}</span>
                </>
              ) : null}
            </p>
            <h3 className="mt-1 text-[clamp(1.4rem,2.6vw,2.1rem)] leading-tight font-extrabold tracking-tight">{item.company}</h3>
            <ul className="mb-2 text-mute">
              {item.roles.map((r) => (
                <li key={r.title + r.start}>
                  <span className="text-fg">{r.title}</span> <span className="t-yellow">{shortRange(r.start, r.end)}</span>
                </li>
              ))}
            </ul>
            <p className="mb-2 max-w-[80ch]">{item.summary}</p>
            {item.highlights.map((h) => (
              <p key={h} className="t-bullet text-mute">
                {h}
              </p>
            ))}
            {item.projects.length ? (
              <div className="mt-3">
                <p className="text-mute">
                  <span className="t-pink">ls</span> {experience.projectsLabel.toLowerCase()}/
                </p>
                <ul>
                  {item.projects.map((p, i) => {
                    const open = i === openProject;
                    return (
                      <li key={p.id}>
                        <button
                          type="button"
                          aria-expanded={open}
                          onClick={() => toggleProject(i)}
                          className={`t-cyan text-left font-bold hover:underline ${open ? "" : "opacity-80"}`}
                        >
                          {open ? "▾" : "▸"} {p.name}
                          {p.period ? <span className="ml-2 font-normal text-mute">{p.period}</span> : null}
                        </button>
                        {open ? <p className="mb-1 ml-4 max-w-[80ch] text-mute">{p.summary ?? p.description[0]}</p> : null}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}
            <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Tech">
              {item.tech.map((t) => (
                <li key={t.label}>
                  <TermLink
                    term={t}
                    className="block rounded-[3px] border px-1.5 text-xs leading-5"
                    linkClassName="t-cyan border-[#2b3540] hover:border-accent hover:text-accent"
                    textClassName="border-line text-mute"
                  />
                </li>
              ))}
            </ul>
          </div>
        </Pane>
      </div>
    </Frame>
  );
}
