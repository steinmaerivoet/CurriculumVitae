import { useRef } from "react";
import type { ChromeProps } from "@/web/themes/types";
import type { TerminalView } from "@/bff/web/themes/terminal";
import ThemeSwitcher from "@/web/shared/ThemeSwitcher";
import { useNumberKeys } from "@/web/headless/useNumberKeys";
import { useChromeIntro } from "@/web/headless/useChromeIntro";

/**
 * tmux around the slides: the window list on top (one window per slide) and
 * a key bar at the bottom. Number keys jump to a window.
 */
export default function Chrome({ deck, view, index, goTo, ready }: ChromeProps<TerminalView>) {
  const rootRef = useRef<HTMLDivElement>(null);
  useChromeIntro(rootRef, ready, 0.2);
  const n = deck.sections.length;
  useNumberKeys(n, goTo);
  const current = deck.sections[index];

  return (
    <div ref={rootRef} className="pointer-events-none fixed inset-0 z-40 font-mono text-xs">
      <header
        data-chrome
        className="pointer-events-auto absolute inset-x-0 top-0 flex h-[calc(1.75rem+env(safe-area-inset-top))] items-end justify-between gap-3 bg-bg-2 px-3 pb-1 text-mute sm:px-4"
      >
        <nav aria-label="Slides" className="flex min-w-0 gap-1 overflow-hidden">
          {deck.sections.map((s, i) => {
            const active = i === index;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => goTo(i)}
                aria-current={active ? "step" : undefined}
                aria-label={s.label}
                className={`shrink-0 rounded-[3px] px-1.5 whitespace-nowrap transition-colors ${
                  active ? "bg-accent text-on-accent" : "hover:text-fg"
                } ${Math.abs(i - index) > 1 ? "max-sm:hidden" : ""}`}
              >
                {i}:{s.label.toLowerCase()}
                {active ? "*" : ""}
              </button>
            );
          })}
        </nav>
        <div className="flex shrink-0 items-center gap-3">
          <ThemeSwitcher current="terminal" label={deck.ui.themeLabel} selectClassName="text-fg hover:text-accent" />
          <span className="max-md:hidden">
            {view.user}@{view.host}
          </span>
        </div>
      </header>

      <footer
        data-chrome
        className="absolute inset-x-0 bottom-0 flex h-[calc(1.75rem+env(safe-area-inset-bottom))] items-start gap-4 bg-bg-2 px-3 pt-1 text-mute sm:px-4"
        aria-hidden="true"
      >
        {view.keys.map((k) => (
          <Key key={k.key} k={k.key}>
            {k.label}
          </Key>
        ))}
        <span className="ml-auto max-sm:hidden">
          [{current?.label.toLowerCase()}] {index + 1}/{n}
        </span>
      </footer>
    </div>
  );
}

function Key({ k, children }: { k: string; children: string }) {
  return (
    <span className="whitespace-nowrap">
      <b className="mr-1 rounded-[3px] bg-mute px-1 font-medium text-bg">{k}</b>
      {children}
    </span>
  );
}
