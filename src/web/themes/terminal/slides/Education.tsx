import type { SlideProps } from "@/web/themes/types";
import type { TerminalView } from "@/bff/web/themes/terminal";
import { slug } from "@/core/matching";
import { shortRange } from "@/bff/shared/format";
import Frame from "../ui/Frame";
import Pane from "../ui/Pane";

const BAR = 20;

/** `tree` of schools, degrees and certificates, and the languages as `locale` bars. */
export default function Education({ deck, view }: SlideProps<TerminalView>) {
  const { education } = deck;
  const schools = [...new Set(education.items.map((e) => e.school))];
  const branch = (last: boolean) => (last ? "└── " : "├── ");

  return (
    <Frame>
      <h2 className="sr-only">{education.label}</h2>
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:gap-6">
        <Pane title="tree --dirsfirst">
          <div className="overflow-x-auto [scrollbar-width:none]">
            <ul className="whitespace-pre">
              <li className="t-cyan font-bold">{slug(education.label)}/</li>
              {schools.map((school, si) => {
                const lastSchool = si === schools.length - 1;
                const degrees = education.items.filter((e) => e.school === school);
                return (
                  <li key={school}>
                    <span className="text-mute">{branch(lastSchool)}</span>
                    <span className="t-cyan font-bold">{slug(school)}/</span>
                    <ul>
                      {degrees.map((d, di) => (
                        <li key={d.degree}>
                          <span className="text-mute">
                            {lastSchool ? "    " : "│   "}
                            {branch(di === degrees.length - 1)}
                          </span>
                          <span title={d.degree}>{d.degree.split(",")[0]}</span> <span className="t-yellow">{shortRange(d.start, d.end)}</span>
                          {d.note ? <span className="t-green"> {d.note}</span> : null}
                        </li>
                      ))}
                    </ul>
                  </li>
                );
              })}
              <li className="t-cyan mt-1 font-bold">{slug(education.certificationsLabel)}/</li>
              {education.certifications.map((c, i) => (
                <li key={c.name}>
                  <span className="text-mute">{branch(i === education.certifications.length - 1)}</span>
                  {c.name} <span className="text-mute">{c.issuer}</span>
                  {c.year ? <span className="t-yellow"> {c.year}</span> : null} <span className="t-green">✓</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-mute">
              {schools.length + 2} directories, {education.items.length + education.certifications.length} files
            </p>
          </div>
        </Pane>

        <Pane title="locale -a">
          <h3 className="sr-only">{education.languagesLabel}</h3>
          <ul className="grid grid-cols-[8ch_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 sm:grid-cols-[9ch_minmax(0,1fr)_auto]">
            {view.locales.map((l) => {
              const n = Math.round(l.share * BAR);
              return (
                <li key={l.name} className="contents">
                  <span className="t-cyan">{l.name.toLowerCase()}</span>
                  <span className="overflow-hidden tracking-[-1px] whitespace-nowrap text-accent" aria-hidden="true">
                    {"█".repeat(n)}
                    <span className="text-line">{"░".repeat(BAR - n)}</span>
                  </span>
                  <span className="text-mute">{l.level.toLowerCase()}</span>
                </li>
              );
            })}
          </ul>
        </Pane>
      </div>
    </Frame>
  );
}
