import type { SlideProps } from "@/web/themes/types";
import type { ReferenceView } from "@/bff/web/themes/reference";
import DocPage from "../ui/DocPage";
import Endpoint from "../ui/Endpoint";
import Response from "../ui/Response";
import JsonView from "../ui/JsonView";

/** Contact as a request you can send: a mail to the person, with the links as the response. */
export default function Contact({ deck, view }: SlideProps<ReferenceView>) {
  const { contact, person } = deck;
  const ep = view.endpoints.contact;
  return (
    <DocPage
      crumb={`${view.nav[1]?.title ?? ""} / ${contact.label.toLowerCase()}`}
      response={
        <Response title="links" href={ep.href} status="202 Accepted">
          <JsonView value={{ email: person.email, location: person.location, links: view.resources.profile.links }} />
        </Response>
      }
    >
      <h2 data-reveal className="max-w-[18ch] text-[clamp(2rem,4.5vw,3.5rem)] leading-[1.02] font-bold tracking-[-0.03em] text-balance">
        {contact.heading}
      </h2>
      <div data-reveal className="my-5">
        <Endpoint endpoint={ep} />
      </div>
      <p data-reveal className="mb-5 max-w-[54ch] text-[15px] text-mute">
        {contact.text}
      </p>
      <div data-reveal className="grid max-w-xl gap-2.5">
        <div className="rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-mute">
          <span className="mb-1 block font-mono text-[11.5px] font-medium text-fg">to</span>
          {person.email}
        </div>
        <a
          href={`mailto:${person.email}`}
          className="justify-self-start rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-on-accent transition-opacity hover:opacity-90"
        >
          {contact.cta} →
        </a>
      </div>
    </DocPage>
  );
}
