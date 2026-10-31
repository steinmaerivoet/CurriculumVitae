import type { SlideProps } from "@/web/themes/types";
import type { TerminalView } from "@/bff/web/themes/terminal";
import Frame from "../ui/Frame";
import Prompt from "../ui/Prompt";
import Banner from "../ui/Banner";

const PALETTE = ["var(--c-bg-2)", "var(--t-red)", "var(--t-green)", "var(--t-yellow)", "var(--t-cyan)", "var(--t-pink)", "var(--c-accent)", "var(--c-fg)"];

export default function About({ deck, view }: SlideProps<TerminalView>) {
  const { person, about } = deck;
  const cwd = `~/${view.user}`;
  return (
    <Frame>
      <div data-reveal>
        <Prompt cwd={cwd}>neofetch</Prompt>
      </div>
      <div data-reveal className="my-4 grid items-start gap-x-10 gap-y-3 md:grid-cols-[auto_minmax(0,1fr)]">
        <Banner text={`${person.firstName[0] ?? ""}${person.lastName[0] ?? ""}`} className="text-[15px] max-md:hidden" />
        <div>
          <p className="font-bold">
            <span className="text-accent">{view.user}</span>@<span className="text-accent">{view.host}</span>
          </p>
          <p className="text-mute" aria-hidden="true">
            {"─".repeat(view.user.length + view.host.length + 1)}
          </p>
          <dl>
            {view.fetch.map((f) => (
              <div key={f.key} className="flex gap-2">
                <dt className="t-cyan shrink-0 font-bold">{f.key}:</dt>
                <dd className="min-w-0">{f.value}</dd>
              </div>
            ))}
            {about.stats.map((s) => (
              <div key={s.label} className="flex gap-2">
                <dt className="t-cyan shrink-0 font-bold">
                  {s.value}
                  {s.suffix}
                </dt>
                <dd className="min-w-0 text-mute">{s.label.toLowerCase()}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-3 flex" aria-hidden="true">
            {PALETTE.map((c) => (
              <i key={c} className="block h-3.5 w-6" style={{ background: c }} />
            ))}
          </div>
        </div>
      </div>
      <div data-reveal>
        <Prompt cwd={cwd}>cat {about.label.toLowerCase()}.md</Prompt>
      </div>
      <h2 data-reveal className="t-quote my-3 max-w-[38ch] text-[clamp(1.25rem,2.6vw,1.9rem)] leading-tight font-bold tracking-tight text-balance">
        {about.statement}
      </h2>
      {about.paragraphs.map((p) => (
        <p key={p.slice(0, 24)} data-reveal className="mb-2 max-w-[86ch] text-mute">
          {p}
        </p>
      ))}
    </Frame>
  );
}
