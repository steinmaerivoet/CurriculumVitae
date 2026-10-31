import { useRef } from "react";
import type { ChromeProps } from "@/web/themes/types";
import type { GitView } from "@/bff/web/themes/git";
import ThemeSwitcher from "@/web/shared/ThemeSwitcher";
import { useChromeIntro } from "@/web/headless/useChromeIntro";

/** The repo bar on top and the slides as commits on a branch rail at the right. */
export default function Chrome({ deck, view, index, goTo, ready }: ChromeProps<GitView>) {
  const rootRef = useRef<HTMLDivElement>(null);
  useChromeIntro(rootRef, ready);
  const contact = deck.sections.findIndex((s) => s.id === "contact");

  return (
    <div ref={rootRef} className="pointer-events-none fixed inset-0 z-40 text-xs">
      <header
        data-chrome
        className="absolute inset-x-0 top-0 flex items-center justify-between gap-4 bg-gradient-to-b from-bg from-40% to-transparent px-5 pt-[max(1.1rem,env(safe-area-inset-top))] pb-4 text-mute sm:px-10 lg:px-14"
      >
        <button type="button" onClick={() => goTo(0)} className="pointer-events-auto whitespace-nowrap">
          <b className="font-medium text-fg">{view.repo.split("/")[0]}</b>/{view.repo.split("/")[1]}
        </button>
        <div className="pointer-events-auto flex items-center gap-5">
          <span className="rounded-full border border-line px-3 py-1">
            <ThemeSwitcher current="git" label={deck.ui.themeLabel} selectClassName="text-fg" />
          </span>
          {contact > 0 ? (
            <button
              type="button"
              onClick={() => goTo(contact)}
              className={`whitespace-nowrap text-fg max-sm:hidden border-b border-accent transition-opacity ${index === contact ? "opacity-0" : ""}`}
            >
              {deck.ui.talkButton} →
            </button>
          ) : null}
        </div>
      </header>

      <nav aria-label="Slides" data-chrome className="pointer-events-auto absolute top-1/2 right-2 -translate-y-1/2 sm:right-5 lg:right-8">
        <ol className="relative flex flex-col">
          <span className="absolute inset-y-3.5 right-3.5 w-0.5 translate-x-1/2 bg-line" aria-hidden="true" />
          {deck.sections.map((s, i) => {
            const active = i === index;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={s.label}
                  aria-current={active ? "step" : undefined}
                  className="group relative flex h-7 items-center justify-end gap-3 2xl:h-9"
                >
                  <span className={`hidden text-[11px] whitespace-nowrap transition-colors 2xl:inline ${active ? "text-fg" : "text-mute group-hover:text-fg"}`} aria-hidden="true">
                    {s.label.toLowerCase()}
                  </span>
                  <span className="grid size-7 place-items-center">
                    <span
                      className={`block rounded-full border-2 transition-all duration-500 ${
                        active ? "size-3.5 border-accent bg-accent shadow-[0_0_14px_var(--c-accent)]" : i < index ? "size-2.5 border-accent bg-bg" : "size-2.5 border-mute bg-bg group-hover:border-fg"
                      }`}
                    />
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
