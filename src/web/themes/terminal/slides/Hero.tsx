import type { SlideProps } from "@/web/themes/types";
import type { TerminalView } from "@/bff/web/themes/terminal";
import { useDeck } from "@/web/deck/context";
import Frame from "../ui/Frame";
import Prompt from "../ui/Prompt";

export default function Hero({ deck, view }: SlideProps<TerminalView>) {
  const { person } = deck;
  const { goToId } = useDeck();
  const cwd = `~/${view.user}`;
  return (
    <Frame>
      <div className="max-w-5xl">
        <div data-reveal>
          <Prompt cwd={cwd}>whoami</Prompt>
        </div>
        <h1 data-reveal className="my-3 text-[clamp(2.75rem,10vw,7.5rem)] leading-[0.92] font-extrabold tracking-[-0.045em] [text-shadow:0_0_40px_color-mix(in_oklab,var(--c-accent)_18%,transparent)] sm:my-5">
          {person.firstName.toLowerCase()}
          <br />
          <span className="text-accent">{person.lastName.toLowerCase()}</span>
        </h1>
        <div data-reveal className="mb-3">
          <Prompt cwd={cwd}>cat role.txt</Prompt>
          <p className="text-mute">
            <span className="t-yellow">{person.headline}</span> · {person.location}
          </p>
        </div>
        <div data-reveal className="mb-3">
          <Prompt cwd={cwd}>cat tagline.txt</Prompt>
          <p className="max-w-[72ch] text-mute">{person.tagline}</p>
        </div>
        <div data-reveal className="mb-3">
          <Prompt cwd={cwd}>ls</Prompt>
          <ul className="flex flex-wrap gap-x-6 gap-y-1">
            {deck.sections.slice(1).map((s) => (
              <li key={s.id}>
                <button type="button" onClick={() => goToId(s.id)} className="t-cyan font-bold hover:underline">
                  {s.label.toLowerCase()}
                  {s.id === "contact" ? ".sh" : "/"}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div data-reveal>
          <Prompt cwd={cwd}>
            <span className="t-cursor" aria-hidden="true" />
          </Prompt>
        </div>
      </div>
    </Frame>
  );
}
