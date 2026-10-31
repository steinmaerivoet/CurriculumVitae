import type { SlideProps } from "@/web/themes/types";
import type { ReferenceView } from "@/bff/web/themes/reference";
import DocPage from "../ui/DocPage";
import Response from "../ui/Response";
import JsonView from "../ui/JsonView";

/** Education as a changelog: each degree is a release. */
export default function Education({ deck, view }: SlideProps<ReferenceView>) {
  const { education } = deck;
  const { certifications, languages } = view.resources.education;
  return (
    <DocPage
      crumb={`${view.nav[1]?.title ?? ""} / ${education.label.toLowerCase()}`}
      response={
        <Response title={education.certificationsLabel.toLowerCase()} href={view.endpoints.education.href}>
          <JsonView value={{ certifications, languages }} />
        </Response>
      }
    >
      <h2 data-reveal className="text-[clamp(1.5rem,2.4vw,1.9rem)] font-semibold tracking-tight">
        Changelog
      </h2>
      <ol className="mt-3">
        {education.items.map((e) => (
          <li key={e.degree} data-reveal className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-4 border-b border-line py-3">
            <span className="font-mono text-xs leading-snug font-semibold text-accent">
              v{e.end}
              <span className="block font-normal text-mute">
                {e.start} – {e.end}
              </span>
            </span>
            <div>
              <h3 className="text-[15px] font-semibold">
                {e.degree}
                {e.note && /laude/i.test(e.note) ? (
                  <span className="ml-1.5 rounded bg-[#fff3e0] px-1.5 py-0.5 align-[2px] font-mono text-[10px] text-[#b45309] uppercase">{e.note.split(" · ").pop()}</span>
                ) : null}
              </h3>
              <p className="text-[13.5px] text-mute">
                {e.school}
                {e.note ? ` · ${e.note.split(" · ")[0]}` : ""}
              </p>
            </div>
          </li>
        ))}
      </ol>
      <h3 data-reveal className="mt-5 mb-2 font-mono text-xs font-semibold tracking-[0.08em] text-mute uppercase">
        {education.languagesLabel}
      </h3>
      <ul data-reveal className="flex flex-wrap gap-1.5">
        {education.languages.map((l) => (
          <li key={l.name} className="rounded-full border border-line bg-surface px-2.5 py-1.5 font-mono text-xs leading-none text-mute">
            <span className="text-fg">{l.name}</span> · {l.level.toLowerCase()}
          </li>
        ))}
      </ul>
    </DocPage>
  );
}
