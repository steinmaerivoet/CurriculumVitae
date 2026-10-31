import type { CV } from "@/lib/cv";
import SlideFrame from "@/components/ui/SlideFrame";
import Eyebrow from "@/components/ui/Eyebrow";

function Marquee({ words }: { words: string[] }) {
  const row = words.join(" · ") + " · ";
  return (
    <div className="absolute inset-x-0 bottom-[8%] flex overflow-hidden opacity-[0.07] sm:bottom-[10%]">
      <div className="marquee-track flex shrink-0 whitespace-nowrap font-serif text-[clamp(5rem,16vw,14rem)] leading-none italic">
        <span className="pr-8">{row}</span>
        <span className="pr-8">{row}</span>
      </div>
    </div>
  );
}

export default function Skills({ cv }: { cv: CV }) {
  const { skills } = cv;
  const all = [...new Set(skills.groups.flatMap((g) => g.items))];

  return (
    <SlideFrame background={<Marquee words={all} />}>
      <Eyebrow id="skills" label={skills.label} />

      <div className="grid gap-x-12 gap-y-6 sm:grid-cols-2 sm:gap-y-12">
        {skills.groups.map((group, g) => (
          <section key={group.name} data-anim>
            <h3 className="mb-3 flex items-baseline gap-3 font-serif text-[1.375rem] tracking-tight sm:mb-4 sm:text-3xl">
              <span className="text-sm text-accent tabular-nums">{String(g + 1).padStart(2, "0")}</span>
              {group.name}
            </h3>
            <ul className="flex flex-wrap gap-1.5 sm:gap-2">
              {group.items.map((s) => (
                <li
                  key={s}
                  className="cursor-default rounded-full border border-line bg-paper/[0.02] px-3 py-1 text-[13px] text-paper/85 sm:px-3.5 sm:py-1.5 sm:text-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-accent hover:text-accent"
                >
                  {s}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </SlideFrame>
  );
}
