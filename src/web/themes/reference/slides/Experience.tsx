import type { SlideProps } from "@/web/themes/types";
import type { ReferenceView } from "@/bff/web/themes/reference";
import { slug } from "@/core/matching";
import { range } from "@/bff/shared/format";
import { TermLink } from "@/web/shared/TermLink";
import { useEmployerSelection } from "@/web/headless/useEmployerSelection";
import DocPage from "../ui/DocPage";
import Endpoint from "../ui/Endpoint";
import Params from "../ui/Params";
import Response from "../ui/Response";
import JsonView from "../ui/JsonView";
import { useJsonLinker } from "../ui/useJsonLinker";
import Pills from "../ui/Pills";

/** Each employer is a version of the experience resource; its JSON is on the right. */
export default function Experience({ deck, view }: SlideProps<ReferenceView>) {
  const { experience } = deck;
  const { active, item, select, openProject, toggleProject } = useEmployerSelection(experience.items);
  const linker = useJsonLinker(deck);
  const ep = view.endpoints.experience;
  if (!item) return null;

  return (
    <DocPage
      top
      crumb={`${view.nav[1]?.title ?? ""} / ${experience.label.toLowerCase()}`}
      response={
        <Response title={`experience[${active}]`} href={ep.href}>
          <JsonView value={view.resources.experience[active]} linker={linker} maxItems={8} />
        </Response>
      }
    >
      <div data-reveal className="mb-4 flex flex-wrap items-center gap-3">
        <Endpoint endpoint={ep} suffix={`  [${active}]`} />
      </div>
      <Pills label={experience.label} items={experience.items.map((e) => `${slug(e.company)}@${e.start}`)} active={active} onSelect={select} />

      <div id="experience-panel" role="tabpanel" aria-label={item.company} className="mt-4">
        <h3 className="text-[clamp(1.5rem,2.4vw,1.9rem)] leading-tight font-semibold tracking-tight">{item.company}</h3>
        <p className="mt-1 mb-3 max-w-[62ch] text-[14.5px] text-mute">{item.summary}</p>
        <Params
          rows={[
            {
              name: "roles",
              type: "Role[]",
              children: item.roles.map((r) => (
                <span key={r.title + r.start} className="block">
                  <span className="text-fg">{r.title}</span> · {range(r.start, r.end, experience.presentLabel)}
                </span>
              )),
            },
            ...(item.location ? [{ name: "location", type: "string", children: item.location }] : []),
            ...(item.highlights.length ? [{ name: "highlights", type: "string[]", children: item.highlights.join(" · ") }] : []),
            ...(item.projects.length
              ? [
                  {
                    name: "projects",
                    type: "Project[]",
                    children: (
                      <ul>
                        {item.projects.map((p, i) => {
                          const open = i === openProject;
                          return (
                            <li key={p.id}>
                              <button type="button" aria-expanded={open} onClick={() => toggleProject(i)} className={`text-left hover:text-accent ${open ? "font-medium text-fg" : ""}`}>
                                <span className="mr-1.5 inline-block w-3 text-mute" aria-hidden="true">
                                  {open ? "▾" : "▸"}
                                </span>
                                {p.name}
                              </button>
                              {open ? <p className="mb-1 ml-4.5 text-[13px] leading-snug">{p.summary ?? p.description[0]}</p> : null}
                            </li>
                          );
                        })}
                      </ul>
                    ),
                  },
                ]
              : []),
          ]}
        />
        <ul className="mt-3 flex flex-wrap gap-1">
          {item.tech.map((t) => (
            <li key={t.label}>
              <TermLink
                term={t}
                className="block rounded px-1.5 py-1 font-mono text-[11.5px] leading-none"
                linkClassName="bg-[#eaefff] text-accent hover:bg-accent hover:text-on-accent"
                textClassName="bg-bg-2 text-mute"
              />
            </li>
          ))}
        </ul>
      </div>
    </DocPage>
  );
}
