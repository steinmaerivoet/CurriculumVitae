import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import type { ChromeProps } from "@/web/themes/types";
import { pad } from "@/bff/shared/format";
import ThemeSwitcher from "@/web/shared/ThemeSwitcher";
import ModeToggle from "./ui/ModeToggle";
import { useChromeIntro } from "@/web/headless/useChromeIntro";

/** Fixed UI around the slides: brand, call to action, dot navigation, counter and progress. */
export default function Chrome({ deck, index, goTo, ready }: ChromeProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const labels = deck.sections.map((s) => s.label);
  const total = labels.length;
  const contactIndex = deck.sections.findIndex((s) => s.id === "contact");
  const fullName = `${deck.person.firstName} ${deck.person.lastName}`;

  useChromeIntro(rootRef, ready);

  // Progress line follows the glide.
  useEffect(() => {
    gsap.to(progressRef.current, {
      scaleY: total > 1 ? index / (total - 1) : 1,
      duration: 0.95,
      ease: "power3.inOut",
    });
  }, [index, total]);

  return (
    <div ref={rootRef} className="pointer-events-none fixed inset-0 z-40">
      {/* Soft fades so scrolled content never collides with the fixed UI on small screens. */}
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-bg from-35% to-transparent md:hidden" aria-hidden="true" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-bg from-35% to-transparent md:hidden" aria-hidden="true" />
      {/* Top bar */}
      <header className="absolute inset-x-0 top-0 flex items-center justify-between px-6 pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-10 lg:px-16">
        <button
          type="button"
          data-chrome
          onClick={() => goTo(0)}
          className="pointer-events-auto text-sm font-medium tracking-tight text-fg/90 transition-colors hover:text-accent"
        >
          {fullName}
          <span className="text-accent">.</span>
        </button>
        <div className="flex items-center gap-2 sm:gap-3">
          <div data-chrome className="pointer-events-auto flex items-center gap-1 rounded-full border border-line bg-bg/60 py-1 pr-1.5 pl-3 text-xs text-fg/80 backdrop-blur-md sm:text-sm">
            <ThemeSwitcher current="plain" label={deck.ui.themeLabel} selectClassName="py-1 text-fg/90 hover:text-accent" />
            <span className="mx-1 h-4 w-px bg-line" aria-hidden="true" />
            <ModeToggle />
          </div>
          {contactIndex > 0 && (
            <button
              type="button"
              data-chrome
              onClick={() => goTo(contactIndex)}
              className={`pointer-events-auto hidden rounded-full border border-line px-4 py-2 text-xs font-medium tracking-wide text-fg/90 backdrop-blur-md transition-all duration-500 hover:border-accent hover:bg-accent hover:text-on-accent sm:block sm:text-sm ${
                index === contactIndex ? "pointer-events-none !opacity-0" : ""
              }`}
            >
              {deck.ui.talkButton}
            </button>
          )}
        </div>
      </header>

      {/*
        Slide navigation. Dots on phones and tablets; on wide screens it opens
        up into a live table of contents that follows the deck.
      */}
      <nav
        aria-label="Slides"
        data-chrome
        className="pointer-events-auto absolute top-1/2 right-1 -translate-y-1/2 rounded-full py-1 max-sm:bg-bg/60 max-sm:backdrop-blur-md sm:right-5 lg:right-8 xl:right-10"
      >
        <p className="mb-3 hidden pr-1 text-right text-[10px] font-medium tracking-[0.28em] text-mute/70 uppercase xl:block" aria-hidden="true">
          {deck.ui.contentsLabel}
        </p>
        <div className="relative">
          <div className="absolute inset-y-3.5 right-3.5 w-px translate-x-1/2 bg-line xl:inset-y-5" aria-hidden="true">
            <div ref={progressRef} className="absolute inset-0 origin-top scale-y-0 bg-accent" />
          </div>
          <ol className="relative flex flex-col">
            {labels.map((label, i) => {
              const active = i === index;
              const passed = i < index;
              return (
                <li key={label + i}>
                  <button
                    type="button"
                    onClick={() => goTo(i)}
                    aria-label={label}
                    aria-current={active ? "step" : undefined}
                    className="group relative flex h-7 w-full items-center justify-end xl:h-10 xl:gap-4"
                  >
                    <span
                      className={`hidden items-baseline gap-3 transition-all duration-500 ease-out-expo xl:flex ${
                        active ? "-translate-x-1" : "group-hover:-translate-x-1"
                      }`}
                      aria-hidden="true"
                    >
                      <span
                        className={`text-[11px] font-medium tracking-[0.12em] tabular-nums transition-colors duration-500 ${
                          active ? "text-accent" : "text-mute/60"
                        }`}
                      >
                        {/* Same numbering as the slide eyebrows: the intro is 00. */}
                        {pad(i + 1)}
                      </span>
                      <span
                        className={`text-sm whitespace-nowrap transition-colors duration-500 ${
                          active
                            ? "font-medium text-fg"
                            : passed
                              ? "text-fg/55 group-hover:text-fg"
                              : "text-mute group-hover:text-fg"
                        }`}
                      >
                        {label}
                      </span>
                    </span>
                    <span className="relative flex h-7 w-7 shrink-0 items-center justify-center">
                      <span
                        className={`block rounded-full transition-all duration-500 ease-out-expo ${
                          active
                            ? "h-2.5 w-2.5 bg-accent shadow-[0_0_16px_var(--color-accent)]"
                            : passed
                              ? "h-1.5 w-1.5 bg-accent/70 ring-1 ring-accent/70"
                              : "h-1.5 w-1.5 bg-bg ring-1 ring-mute/70 group-hover:ring-fg"
                        }`}
                      />
                    </span>
                    <span className="pointer-events-none absolute right-9 hidden translate-x-2 rounded-md bg-surface/90 px-2.5 py-1 text-xs whitespace-nowrap text-fg opacity-0 backdrop-blur transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 md:block xl:hidden">
                      {label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </nav>

      {/* Counter + current section */}
      <div
        data-chrome
        className="absolute bottom-0 left-0 flex items-end gap-4 px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-xs tracking-[0.18em] text-mute uppercase sm:px-10 lg:px-16"
        aria-hidden="true"
      >
        <span className="flex overflow-hidden font-medium tabular-nums">
          <span className="inline-block text-fg">
            {pad(index + 1)}
          </span>
          <span className="mx-1.5 opacity-50">/</span>
          <span>{pad(total)}</span>
        </span>
        <span className="hidden overflow-hidden xs:inline-flex xl:hidden">
          <span className="inline-block">
            {labels[index]}
          </span>
        </span>
      </div>

      {/* Scroll hint, only on the first slide */}
      <button
        type="button"
        data-chrome
        onClick={() => goTo(1)}
        aria-label={deck.ui.scrollHint}
        className={`pointer-events-auto absolute right-14 bottom-0 flex items-center gap-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-[11px] tracking-[0.22em] text-mute uppercase transition-opacity duration-500 sm:right-20 lg:right-24 [@media(min-width:768px)_and_(min-height:600px)]:right-[18.5rem] lg:[@media(min-height:600px)]:right-[19.75rem] ${
          index === 0 ? "" : "pointer-events-none !opacity-0"
        }`}
      >
        {deck.ui.scrollHint}
        <span className="relative h-9 w-5 rounded-full border border-fg/25">
          <span className="absolute top-1.5 left-1/2 h-1.5 w-0.5 -translate-x-1/2 animate-bounce rounded-full bg-accent" />
        </span>
      </button>
    </div>
  );
}
