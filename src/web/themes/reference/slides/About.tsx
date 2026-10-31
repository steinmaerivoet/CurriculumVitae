import type { SlideProps } from "@/web/themes/types";
import type { ReferenceView } from "@/bff/web/themes/reference";
import DocPage from "../ui/DocPage";
import Response from "../ui/Response";
import JsonView from "../ui/JsonView";

export default function About({ deck, view }: SlideProps<ReferenceView>) {
  const { about } = deck;
  const { about: body, stats } = view.resources.profile;
  return (
    <DocPage
      crumb={`${view.nav[0]?.title ?? ""} / ${about.label}`}
      response={
        <Response href={view.endpoints.about.href}>
          <JsonView value={{ about: body, stats }} />
        </Response>
      }
    >
      <h2 data-reveal className="text-[clamp(1.6rem,2.6vw,2rem)] font-semibold tracking-tight">
        {about.label}
      </h2>
      <p data-reveal className="mt-5 mb-5 max-w-[34ch] border-l-[3px] border-accent pl-4 text-[clamp(1.25rem,2.2vw,1.7rem)] leading-snug tracking-[-0.015em] text-balance">
        {about.statement}
      </p>
      {about.paragraphs.map((p) => (
        <p key={p.slice(0, 24)} data-reveal className="mb-3 max-w-[60ch] text-[15px] text-mute">
          {p}
        </p>
      ))}
      <h3 data-reveal className="mt-4 mb-2 font-mono text-xs font-semibold tracking-[0.08em] text-mute uppercase">
        stats
      </h3>
      <ul data-reveal className="grid max-w-2xl gap-2.5 sm:grid-cols-3">
        {about.stats.map((s) => (
          <li key={s.label} className="rounded-lg border border-line bg-surface px-3.5 py-3 text-[13px] text-mute">
            <b className="block font-mono text-2xl font-semibold tracking-tight text-fg">
              <span data-count={s.value}>{s.value}</span>
              {s.suffix}
            </b>
            {s.label}
          </li>
        ))}
      </ul>
    </DocPage>
  );
}
