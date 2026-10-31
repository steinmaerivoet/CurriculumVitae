import type { SlideProps } from "@/web/themes/types";
import type { GitView } from "@/bff/web/themes/git";
import Frame from "../ui/Frame";

/** HEAD: the name with its refs, and a branch graph drawing itself. */
export default function Hero({ deck, view }: SlideProps<GitView>) {
  const { person } = deck;
  const head = view.commits[0];
  return (
    <Frame className="!justify-end">
      <div className="grid items-end gap-8 md:grid-cols-[minmax(0,1fr)_auto]">
        <div>
          <p data-reveal className="mb-5 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-accent px-2.5 py-1 text-on-accent">HEAD → {view.branch}</span>
            <span className="g-gold rounded-full border border-[color-mix(in_oklab,var(--g-gold)_40%,transparent)] px-2.5 py-1">tag: {view.tag}</span>
            {head ? <span className="rounded-full border border-line px-2.5 py-1 text-mute">{head.hash}</span> : null}
          </p>
          <h1 data-reveal className="font-display text-[clamp(3.25rem,12vw,10.5rem)] leading-[0.84] font-extrabold tracking-[-0.05em]">
            {person.firstName}
            <span className="block text-accent">{person.lastName}</span>
          </h1>
          <div data-reveal className="mt-7 grid gap-2 font-display sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-8">
            <b className="text-lg font-semibold sm:text-xl">{person.headline}</b>
            <p className="g-prose max-w-[44ch] text-base leading-normal">{person.tagline}</p>
          </div>
        </div>
        <svg viewBox="0 0 200 300" className="hidden w-[clamp(140px,16vw,240px)] md:block" fill="none" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
          <path className="g-draw" pathLength={1} d="M40 10 V290" stroke="var(--c-accent)" />
          <path className="g-draw" pathLength={1} d="M40 60 C40 90 100 90 100 120 V180 C100 210 40 210 40 240" stroke="var(--g-teal)" />
          <path className="g-draw" pathLength={1} d="M100 140 C100 160 160 160 160 180 V200" stroke="var(--g-violet)" />
          <circle className="g-pulse" cx="40" cy="20" r="12" fill="color-mix(in oklab, var(--c-accent) 25%, transparent)" />
          <circle cx="40" cy="20" r="8" fill="var(--c-accent)" />
          <circle cx="40" cy="60" r="6" fill="var(--c-bg)" stroke="var(--c-accent)" />
          <circle cx="100" cy="120" r="6" fill="var(--g-teal)" />
          <circle cx="100" cy="160" r="6" fill="var(--c-bg)" stroke="var(--g-teal)" />
          <circle cx="160" cy="200" r="6" fill="var(--g-violet)" />
          <circle cx="40" cy="240" r="6" fill="var(--c-bg)" stroke="var(--c-accent)" />
          <circle cx="40" cy="280" r="6" fill="var(--c-bg)" stroke="var(--c-accent)" />
        </svg>
      </div>
    </Frame>
  );
}
