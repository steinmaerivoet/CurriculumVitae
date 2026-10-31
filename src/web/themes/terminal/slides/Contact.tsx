import type { SlideProps } from "@/web/themes/types";
import type { TerminalView } from "@/bff/web/themes/terminal";
import { bareUrl } from "@/bff/shared/format";
import Frame from "../ui/Frame";
import Prompt from "../ui/Prompt";

/** An interactive prompt (like `npm create`): every way to reach out is an option. */
export default function Contact({ deck, view }: SlideProps<TerminalView>) {
  const { contact, person } = deck;
  const options = [
    { key: "email", label: person.email, href: `mailto:${person.email}` },
    ...person.socials.map((s) => ({ key: s.label.toLowerCase(), label: bareUrl(s.url), href: s.url })),
  ];
  const pad = Math.max(...options.map((o) => o.key.length)) + 2;

  return (
    <Frame>
      <div data-reveal>
        <Prompt cwd={`~/${view.user}`}>./{contact.label.toLowerCase()}.sh</Prompt>
      </div>
      <h2 data-reveal className="my-4 max-w-[22ch] text-[clamp(2rem,6vw,4.5rem)] leading-[0.95] font-extrabold tracking-[-0.04em] text-balance">
        {contact.heading}
      </h2>
      <div className="max-w-3xl">
        <p data-reveal className="t-rail pt-1" data-mark="┌">
          {contact.label.toLowerCase()}.sh
        </p>
        <p data-reveal className="t-rail py-1 text-mute" data-mark="◇" style={{ ["--t-mark" as string]: "var(--t-green)" }}>
          {contact.text}
        </p>
        <ul data-reveal className="t-rail py-1" data-mark="◆" style={{ ["--t-mark" as string]: "var(--t-cyan)" }}>
          {options.map((o, i) => (
            <li key={o.key}>
              <a href={o.href} target={o.href.startsWith("mailto:") ? undefined : "_blank"} rel="noreferrer" className="group inline-flex gap-2 whitespace-pre">
                <span className={i === 0 ? "t-green" : "text-mute"}>{i === 0 ? "●" : "○"}</span>
                <span className="text-mute group-hover:text-fg">{o.key.padEnd(pad)}</span>
                <span className="t-yellow break-all whitespace-normal group-hover:underline">{o.label}</span>
              </a>
            </li>
          ))}
        </ul>
        <p data-reveal className="t-rail pt-2 pb-1" data-mark="└">
          <a href={`mailto:${person.email}`} className="inline-block rounded-[3px] bg-accent px-3 py-1 font-bold text-on-accent transition-opacity hover:opacity-90">
            {contact.cta} ↵
          </a>
        </p>
      </div>
    </Frame>
  );
}
