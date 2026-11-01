import type { SlideProps } from "@/web/themes/types";
import type { GitView } from "@/bff/web/themes/git";
import { shortRange } from "@/bff/shared/format";
import Frame from "../ui/Frame";
import Command from "../ui/Command";

/** Degrees and certificates as tags, languages as translation progress. */
export default function Education({ deck, view }: SlideProps<GitView>) {
  const { education } = deck;
  return (
    <Frame>
      <Command command={view.commands.education} />
      <h2 className="sr-only">{education.label}</h2>
      <div className="grid items-start gap-8 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] md:gap-12">
        <ul>
          {education.items.map((e) => (
            <li key={e.degree} data-reveal className="grid grid-cols-[4.25rem_minmax(0,1fr)_auto] items-baseline gap-3.5 border-b border-line py-3">
              <span className="g-gold rounded-full border border-[color-mix(in_oklab,var(--g-gold)_35%,transparent)] justify-self-start px-2.5 py-0.5 text-xs whitespace-nowrap">v{e.end}</span>
              <div>
                <h3 className="font-display text-base leading-snug font-semibold">{e.degree}</h3>
                <span className="text-[11.5px] text-mute">
                  {e.school}
                  {e.note ? ` · ${e.note}` : ""}
                </span>
              </div>
              <span className="text-xs text-mute">{shortRange(e.start, e.end)}</span>
            </li>
          ))}
          {education.certifications.map((c) => (
            <li key={c.name} data-reveal className="grid grid-cols-[4.25rem_minmax(0,1fr)_auto] items-baseline gap-3.5 border-b border-line py-3">
              <span className="g-teal rounded-full border border-[color-mix(in_oklab,var(--g-teal)_35%,transparent)] justify-self-start px-2.5 py-0.5 text-xs">cert</span>
              <div>
                <h3 className="font-display text-base leading-snug font-semibold">{c.name}</h3>
                <span className="text-[11.5px] text-mute">{c.issuer}</span>
              </div>
              <span className="text-xs whitespace-nowrap text-mute">
                {c.year}
                <span className="g-add ml-1.5 rounded-full border border-[color-mix(in_oklab,var(--g-add)_40%,transparent)] px-1.5 text-[10.5px]">✓</span>
              </span>
            </li>
          ))}
        </ul>
        <div data-reveal className="md:pt-3">
          <p className="mb-2 text-xs text-mute">$ ls i18n/</p>
          <h3 className="sr-only">{education.languagesLabel}</h3>
          <ul>
            {view.i18n.map((l) => (
              <li key={l.name} className="grid grid-cols-[minmax(0,6rem)_minmax(0,1fr)_17ch] items-center gap-3 py-1.5 text-xs">
                <span>{l.name}</span>
                <span className="h-1.5 overflow-hidden rounded-full bg-surface" aria-hidden="true">
                  <i className="block h-full rounded-full bg-gradient-to-r from-accent to-[var(--g-gold)]" style={{ width: `${l.share * 100}%` }} />
                </span>
                <span className="text-right text-mute">{l.level}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Frame>
  );
}
