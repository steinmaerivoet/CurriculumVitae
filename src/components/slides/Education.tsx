import type { CV } from "@/lib/cv";
import { range } from "@/lib/format";
import SlideFrame from "@/components/ui/SlideFrame";
import Eyebrow from "@/components/ui/Eyebrow";

function SubHeading({ children }: { children: string }) {
  return <h3 className="mb-3 text-[11px] font-medium tracking-[0.22em] text-mute uppercase sm:mb-4 sm:text-xs">{children}</h3>;
}

export default function Education({ cv }: { cv: CV }) {
  const { education } = cv;

  return (
    <SlideFrame>
      <Eyebrow id="education" label={education.label} />

      <div className="grid gap-10 lg:grid-cols-[1.35fr_1fr] lg:gap-20">
        <ol className="border-t border-line">
          {education.items.map((e) => (
            <li
              key={e.school + e.start}
              className="grid gap-1.5 border-b border-line py-4 sm:grid-cols-[7.5rem_1fr] sm:gap-8 sm:py-6"
              data-reveal
            >
              <span className="text-xs text-mute tabular-nums sm:pt-1.5 sm:text-sm">
                {range(e.start, e.end, "")}
              </span>
              <div>
                <h3 className="font-serif text-[1.375rem] leading-[1.1] tracking-tight sm:text-3xl">{e.degree}</h3>
                <p className="mt-1.5 text-sm text-paper/70 sm:text-base">
                  {e.school}
                  {e.note ? <span className="text-accent"> · {e.note}</span> : null}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <div className="grid content-start gap-8 sm:grid-cols-2 sm:gap-10 lg:grid-cols-1">
          {education.certifications.length > 0 && (
            <section data-reveal>
              <SubHeading>{education.certificationsLabel}</SubHeading>
              <ul className="space-y-3">
                {education.certifications.map((c) => {
                  const body = (
                    <>
                      <span className="block text-[15px] leading-snug text-paper sm:text-base">{c.name}</span>
                      <span className="mt-0.5 block text-xs text-mute sm:text-sm">
                        {c.issuer}
                        {c.year ? ` · ${c.year}` : ""}
                      </span>
                    </>
                  );
                  return (
                    <li key={c.name} className="border-l border-accent/60 pl-4">
                      {c.url ? (
                        <a href={c.url} target="_blank" rel="noopener noreferrer" className="block transition-colors hover:text-accent">
                          {body}
                        </a>
                      ) : (
                        body
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {education.languages.length > 0 && (
            <section data-reveal>
              <SubHeading>{education.languagesLabel}</SubHeading>
              <ul className="grid grid-cols-2 gap-x-6 gap-y-3">
                {education.languages.map((l) => (
                  <li key={l.name}>
                    <span className="block font-serif text-xl leading-tight tracking-tight sm:text-2xl">{l.name}</span>
                    <span className="text-xs text-mute sm:text-sm">{l.level}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </SlideFrame>
  );
}
