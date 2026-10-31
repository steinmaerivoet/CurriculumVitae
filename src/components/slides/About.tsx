import type { CV } from "@/lib/cv";
import SlideFrame from "@/components/ui/SlideFrame";
import Eyebrow from "@/components/ui/Eyebrow";

export default function About({ cv }: { cv: CV }) {
  const { about } = cv;

  return (
    <SlideFrame
      background={
        <div className="absolute -top-1/4 -left-1/4 h-[80vmax] w-[80vmax] rounded-full bg-[radial-gradient(circle,rgb(124_140_255/0.08),transparent_60%)]" />
      }
    >
      <Eyebrow id="about" label={about.label} />

      <h2
        className="max-w-5xl font-serif text-[clamp(1.9rem,5.6vw,5rem)] leading-[1.02] tracking-[-0.02em]"
        data-reveal-words
        aria-label={about.statement}
      >
        {about.statement.split(" ").map((w, i) => (
          <span key={i} aria-hidden="true" className="word inline-block whitespace-pre">
            {w}{" "}
          </span>
        ))}
      </h2>

      <div className="mt-8 grid gap-8 sm:mt-14 sm:gap-10 lg:grid-cols-[1.3fr_1fr] lg:gap-20">
        <div className="space-y-4 text-[15px] leading-relaxed text-mute sm:text-lg">
          {about.paragraphs.map((p, i) => (
            <p key={i} data-reveal>
              {p}
            </p>
          ))}
        </div>

        {about.stats.length > 0 && (
          <dl className="grid grid-cols-3 gap-4 border-t border-line pt-6 sm:gap-8">
            {about.stats.map((s) => (
              <div key={s.label} className="flex flex-col-reverse" data-reveal>
                <dt className="mt-3 text-xs leading-snug text-mute sm:text-sm">{s.label}</dt>
                <dd className="font-serif text-[clamp(2.5rem,6vw,4.5rem)] leading-none tracking-tight">
                  <span data-count={s.value}>{s.value.toLocaleString("en")}</span>
                  {s.suffix ? <span className="text-accent">{s.suffix}</span> : null}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </SlideFrame>
  );
}
