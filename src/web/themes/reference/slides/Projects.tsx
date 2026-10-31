import type { SlideProps } from "@/web/themes/types";
import type { ReferenceView } from "@/bff/web/themes/reference";
import { RefLink, TermLink } from "@/web/shared/TermLink";
import { useProjectSpotlight } from "@/web/headless/useSpotlight";
import DocPage from "../ui/DocPage";
import Endpoint from "../ui/Endpoint";

/** Projects as resource cards. */
export default function Projects({ deck, view }: SlideProps<ReferenceView>) {
  const { projects } = deck;
  const lit = useProjectSpotlight();
  const ep = view.endpoints.projects;
  return (
    <DocPage crumb={`${view.nav[1]?.title ?? ""} / ${projects.label.toLowerCase()}`}>
      <div data-reveal className="mb-5 flex flex-wrap items-center gap-x-5 gap-y-3">
        <h2 className="text-[clamp(1.5rem,2.4vw,1.9rem)] font-semibold tracking-tight">{projects.label}</h2>
        <Endpoint endpoint={ep} />
      </div>
      <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {projects.featured.map((p) => (
          <li
            key={p.id}
            id={`project-${p.id}`}
            data-reveal
            className={`grid content-start gap-1.5 rounded-xl border bg-surface px-4 py-3.5 transition-shadow duration-500 ${
              lit === p.id ? "border-accent shadow-[0_0_0_3px_rgb(47_91_255/0.12)]" : "border-line"
            }`}
          >
            <span className="truncate font-mono text-xs text-mute">
              <span className="r-method mr-1.5">GET</span>
              {ep.path}#{p.id}
            </span>
            <h3 className="text-base font-semibold">
              {p.url ? (
                <a href={p.url} target="_blank" rel="noreferrer" className="hover:text-accent">
                  {p.name} ↗
                </a>
              ) : (
                p.name
              )}
            </h3>
            {p.meta ? (
              p.employer ? (
                <RefLink to={{ kind: "employer", company: p.employer, project: p.id }} title={p.employer} className="justify-self-start text-left text-[12.5px] text-mute hover:text-accent">
                  {p.meta}
                </RefLink>
              ) : (
                <span className="text-[12.5px] text-mute">{p.meta}</span>
              )
            ) : null}
            <p className="text-[13.5px] leading-normal text-mute">{p.summary ?? p.description[0]}</p>
            <ul className="mt-1 flex flex-wrap gap-1">
              {p.tags.map((t) => (
                <li key={t.label}>
                  <TermLink
                    term={t}
                    className="block rounded px-1.5 py-1 font-mono text-[11px] leading-none"
                    linkClassName="bg-[#eaefff] text-accent hover:bg-accent hover:text-on-accent"
                    textClassName="bg-bg-2 text-mute"
                  />
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </DocPage>
  );
}
