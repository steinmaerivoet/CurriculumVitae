import type { SlideProps } from "@/web/themes/types";
import type { ReferenceView } from "@/bff/web/themes/reference";
import DocPage from "../ui/DocPage";
import Endpoint from "../ui/Endpoint";
import Params from "../ui/Params";
import Response from "../ui/Response";
import JsonView from "../ui/JsonView";
import { useJsonLinker } from "../ui/useJsonLinker";

export default function Hero({ deck, view }: SlideProps<ReferenceView>) {
  const { person } = deck;
  const { name, headline, location, website, available, links } = view.resources.profile;
  const profile = { name, headline, location, website, available, links };
  const ep = view.endpoints.hero;
  const linker = useJsonLinker(deck);
  return (
    <DocPage
      crumb={`${view.nav[0]?.title ?? ""} / ${deck.ui.introLabel}`}
      response={
        <Response href={ep.href}>
          <JsonView value={profile} linker={linker} />
        </Response>
      }
    >
      <h1 data-reveal className="text-[clamp(2.75rem,7vw,5.5rem)] leading-[0.98] font-bold tracking-[-0.035em]">
        {person.firstName}
        <br />
        {person.lastName}
      </h1>
      <div data-reveal className="my-5">
        <Endpoint endpoint={ep} />
      </div>
      <p data-reveal className="mb-5 max-w-[54ch] text-[15px] text-mute">
        {person.tagline}
      </p>
      <Params
        className="max-w-xl"
        rows={[
          { name: "headline", type: "string", children: person.headline },
          { name: "location", type: "string", children: person.location },
          { name: "email", type: "string", children: <a href={`mailto:${person.email}`} className="hover:text-accent">{person.email}</a> },
          { name: "available", type: "boolean", children: <span className="font-mono">{String(person.available)}</span> },
        ]}
      />
    </DocPage>
  );
}
