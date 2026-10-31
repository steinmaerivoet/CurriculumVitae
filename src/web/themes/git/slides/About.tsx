import type { SlideProps } from "@/web/themes/types";
import type { GitView } from "@/bff/web/themes/git";
import Frame from "../ui/Frame";
import Command from "../ui/Command";

/** The README at HEAD, with `git shortlog -s` as the key numbers. */
export default function About({ deck, view }: SlideProps<GitView>) {
  const { about } = deck;
  // The last sentence of the statement gets the accent.
  const cut = about.statement.lastIndexOf(". ", about.statement.length - 2);
  const lead = cut > 0 ? about.statement.slice(0, cut + 2) : "";
  const punch = cut > 0 ? about.statement.slice(cut + 2) : about.statement;
  return (
    <Frame>
      <Command command={view.commands.about} />
      <h2 data-reveal className="mb-8 max-w-[22ch] font-display text-[clamp(2rem,5vw,4.25rem)] leading-none font-semibold tracking-[-0.035em] text-balance">
        {lead}
        <em className="text-accent not-italic">{punch}</em>
      </h2>
      <div className="grid items-start gap-6 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] md:gap-12">
        <div>
          {about.paragraphs.map((p) => (
            <p key={p.slice(0, 24)} data-reveal className="g-prose mb-4 max-w-[56ch] font-display text-base leading-relaxed">
              {p}
            </p>
          ))}
        </div>
        <div data-reveal>
          <p className="mb-2 text-xs text-mute">$ git shortlog -s</p>
          <dl className="border-t border-line">
            {about.stats.map((s) => (
              <div key={s.label} className="grid grid-cols-[5ch_minmax(0,1fr)] items-baseline gap-4 border-b border-line py-2.5">
                <dt className="g-gold text-right font-display text-3xl font-extrabold tracking-tight">
                  <span data-count={s.value}>{s.value}</span>
                  {s.suffix}
                </dt>
                <dd className="text-xs text-mute">{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </Frame>
  );
}
