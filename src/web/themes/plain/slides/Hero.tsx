import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import type { SlideProps } from "@/web/themes/types";
import SplitText from "../ui/SplitText";
import SlideFrame from "../ui/SlideFrame";

function Aurora() {
  const ref = useRef<HTMLDivElement>(null);

  // The glow follows the pointer with a soft lag on desktop; drifts on its own on touch.
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const blobs = el.querySelectorAll<HTMLElement>("[data-blob]");

    const drift = gsap.to(blobs, {
      xPercent: (i) => (i ? -18 : 22),
      yPercent: (i) => (i ? 16 : -14),
      duration: 9,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
      stagger: 1.5,
    });

    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return () => drift.kill();

    const xTo = gsap.quickTo(el, "x", { duration: 2.2, ease: "power3.out" });
    const yTo = gsap.quickTo(el, "y", { duration: 2.2, ease: "power3.out" });
    const move = (e: PointerEvent) => {
      xTo((e.clientX / window.innerWidth - 0.5) * 120);
      yTo((e.clientY / window.innerHeight - 0.5) * 90);
    };
    window.addEventListener("pointermove", move);
    return () => {
      drift.kill();
      window.removeEventListener("pointermove", move);
    };
  }, []);

  return (
    <>
      <div ref={ref} className="absolute inset-0">
        <div
          data-blob
          className="absolute top-[-20%] right-[-10%] h-[70vmax] w-[70vmax] rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--c-accent)_16%,transparent),transparent_60%)]"
        />
        <div
          data-blob
          className="absolute bottom-[-30%] left-[-15%] h-[60vmax] w-[60vmax] rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--c-accent)_16%,transparent),transparent_60%)]"
        />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-line)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-line)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)] bg-[size:72px_72px] opacity-40" />
    </>
  );
}

export default function Hero({ deck }: SlideProps) {
  const { person } = deck;

  return (
    <SlideFrame background={<Aurora />} className="justify-end sm:justify-center">
      <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-3 sm:mb-10" data-reveal>
        <p className="eyebrow">{person.location}</p>
        {person.available && person.availabilityText ? (
          <p className="flex items-center gap-2 rounded-full border border-line bg-fg/[0.03] px-3 py-1 text-xs text-fg/80 backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            {person.availabilityText}
          </p>
        ) : null}
      </div>

      <h1 className="font-display leading-[0.86] tracking-[-0.035em] text-[clamp(4.25rem,17vw,15rem)]">
        <SplitText text={person.firstName} className="block" />
        <SplitText text={person.lastName} className="block pl-[0.5em] italic text-accent sm:pl-[1.2em]" />
      </h1>

      <div className="mt-6 grid gap-4 sm:mt-12 sm:gap-6 md:grid-cols-[auto_1fr] md:items-end md:gap-16">
        <p className="text-lg font-medium tracking-tight sm:text-2xl" data-reveal>
          {person.headline}
        </p>
        <p className="max-w-md text-base leading-relaxed text-mute sm:text-lg" data-reveal>
          {person.tagline}
        </p>
      </div>
    </SlideFrame>
  );
}
