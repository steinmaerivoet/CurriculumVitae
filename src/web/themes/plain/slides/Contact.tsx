import type { SlideProps } from "@/web/themes/types";
import SlideFrame from "../ui/SlideFrame";
import Eyebrow from "../ui/Eyebrow";
import SplitText from "../ui/SplitText";
import Magnetic from "../ui/Magnetic";

export default function Contact({ deck }: SlideProps) {
  const { contact, person, ui } = deck;
  const year = new Date().getFullYear();

  return (
    <SlideFrame
      background={
        <div className="absolute right-[-20%] bottom-[-40%] h-[90vmax] w-[90vmax] rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--c-accent)_10%,transparent),transparent_60%)]" />
      }
    >
      <Eyebrow id="contact" label={contact.label} />

      <h2 className="max-w-5xl font-display text-[clamp(3rem,min(9vw,14vh),8.5rem)] leading-[0.92] tracking-[-0.03em]">
        <SplitText text={contact.heading} />
      </h2>
      <p className="mt-6 max-w-xl text-base leading-relaxed text-mute sm:mt-8 sm:text-lg" data-reveal>
        {contact.text}
      </p>

      <div className="mt-10 flex flex-col gap-8 sm:mt-14 sm:flex-row sm:items-center sm:gap-12" data-reveal>
        <Magnetic>
          <a
            href={`mailto:${person.email}`}
            className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full bg-accent px-7 py-4 text-base font-medium text-on-accent sm:px-9 sm:py-5 sm:text-lg"
          >
            <span className="absolute inset-0 translate-y-full rounded-full bg-fg transition-transform duration-500 ease-out-expo group-hover:translate-y-0" />
            <span className="relative">{contact.cta}</span>
            <svg className="relative transition-transform duration-500 group-hover:translate-x-1" width="18" height="18" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M1 7h12M8 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </a>
        </Magnetic>
        <a href={`mailto:${person.email}`} className="text-fg/80 underline decoration-line underline-offset-8 transition-colors hover:text-accent hover:decoration-accent">
          {person.email}
        </a>
      </div>

      <div className="mt-14 flex flex-wrap short:mt-10 items-center justify-between gap-6 md:justify-start md:gap-x-16 border-t border-line pt-6 text-sm text-mute sm:mt-20" data-reveal>
        <ul className="flex flex-wrap gap-x-8 gap-y-2">
          {person.socials.map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-1.5 text-fg/80 transition-colors hover:text-accent">
                {s.label}
                <span className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true">↗</span>
              </a>
            </li>
          ))}
        </ul>
        <p>
          © {year} {person.firstName} {person.lastName}
          {ui.footer ? <span className="hidden md:inline"> · {ui.footer}</span> : null}
        </p>
      </div>
    </SlideFrame>
  );
}
