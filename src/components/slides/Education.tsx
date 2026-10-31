import type { CV } from "@/lib/cv";
import { range } from "@/lib/format";
import SlideFrame from "@/components/ui/SlideFrame";
import Eyebrow from "@/components/ui/Eyebrow";

export default function Education({ cv }: { cv: CV }) {
  const { education } = cv;

  return (
    <SlideFrame>
      <Eyebrow id="education" label={education.label} />

      <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-20">
        <ol className="border-t border-line">
          {education.items.map((e) => (
            <li key={e.school + e.start} className="grid gap-2 border-b border-line py-6 sm:grid-cols-[9rem_1fr] sm:gap-8" data-anim>
              <span className="text-sm text-mute tabular-nums sm:pt-2">{range(e.start, e.end, "")}</span>
              <div>
                <h3 className="font-serif text-2xl leading-tight tracking-tight sm:text-4xl">{e.degree}</h3>
                <p className="mt-1 text-paper/70">{e.school}</p>
              </div>
            </li>
          ))}
        </ol>

        {education.languages.length > 0 && (
          <div data-anim>
            <h3 className="mb-5 text-xs font-medium tracking-[0.22em] text-mute uppercase">{education.languagesLabel}</h3>
            <ul className="space-y-4">
              {education.languages.map((l) => (
                <li key={l.name} className="flex items-baseline justify-between gap-4 border-b border-line pb-4">
                  <span className="font-serif text-2xl tracking-tight sm:text-3xl">{l.name}</span>
                  <span className="text-sm text-mute">{l.level}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </SlideFrame>
  );
}
