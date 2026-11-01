import type { SlideProps } from "@/web/themes/types";
import type { GitView } from "@/bff/web/themes/git";
import { bareUrl } from "@/bff/shared/format";
import Frame from "../ui/Frame";
import Command from "../ui/Command";

/** A pull request waiting to be opened: your idea into their main. */
export default function Contact({ deck, view }: SlideProps<GitView>) {
  const { contact, person } = deck;
  return (
    <Frame>
      <Command command={view.commands.contact} arg={`--base ${view.repo}`} />
      <div data-reveal className="max-w-4xl overflow-hidden rounded-xl border border-line">
        <p className="flex flex-wrap items-center gap-2.5 bg-bg-2 px-4 py-3 text-xs text-mute">
          <span className="rounded-md border border-line px-2 py-1 text-fg">base: {view.repo}</span>←
          <span className="rounded-md border border-line px-2 py-1 text-fg">compare: you/idea</span>
          <span className="g-add">✓ Able to merge.</span>
        </p>
        <h2 className="px-5 pt-5 pb-2 font-display text-[clamp(2rem,5vw,3.75rem)] leading-none font-extrabold tracking-[-0.04em] text-balance">{contact.heading}</h2>
        <p className="g-prose max-w-[58ch] px-5 pb-5 font-display text-base">{contact.text}</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line px-5 py-3.5 text-xs">
          <a href={`mailto:${person.email}`} className="rounded-md bg-accent px-3.5 py-2 font-medium text-on-accent transition-opacity hover:opacity-90">
            {contact.cta} →
          </a>
          <a href={`mailto:${person.email}`} className="text-mute hover:text-fg">
            {person.email}
          </a>
          {person.socials.map((s) => (
            <a key={s.url} href={s.url} target="_blank" rel="noreferrer" className="text-mute hover:text-fg">
              {bareUrl(s.url)}
            </a>
          ))}
        </div>
      </div>
    </Frame>
  );
}
