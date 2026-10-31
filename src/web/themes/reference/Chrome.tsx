import { useRef } from "react";
import type { ChromeProps } from "@/web/themes/types";
import type { ReferenceView } from "@/bff/web/themes/reference";
import ThemeSwitcher from "@/web/shared/ThemeSwitcher";
import { useChromeIntro } from "@/web/headless/useChromeIntro";

/** Docs chrome: the product bar on top and, on wide screens, the endpoint sidebar. */
export default function Chrome({ deck, view, index, goTo, ready }: ChromeProps<ReferenceView>) {
  const rootRef = useRef<HTMLDivElement>(null);
  useChromeIntro(rootRef, ready, 0.2);
  const indexOf = (id: string) => deck.sections.findIndex((s) => s.id === id);

  return (
    <div ref={rootRef} className="pointer-events-none fixed inset-0 z-40 text-[13px]">
      <header
        data-chrome
        className="pointer-events-auto absolute inset-x-0 top-0 flex h-[calc(3.25rem+env(safe-area-inset-top))] items-end gap-5 border-b border-line bg-surface/95 px-5 pb-3 text-mute backdrop-blur sm:px-6"
      >
        <button type="button" onClick={() => goTo(0)} className="inline-flex items-center gap-2 font-semibold text-fg">
          <span className="size-3.5 rounded-[4px] bg-[conic-gradient(from_200deg,var(--c-accent),#8aa4ff,var(--c-accent))]" aria-hidden="true" />
          {view.product}
        </button>
        <span className="rounded-[5px] border border-line px-1.5 py-1 font-mono text-[11px] leading-none">{view.version}</span>
        <a href={deck.files.api} target="_blank" rel="noreferrer" className="max-sm:hidden hover:text-fg">
          cv.json ↗
        </a>
        <span className="ml-auto rounded-md border border-line px-2 py-1">
          <ThemeSwitcher current="reference" label={deck.ui.themeLabel} selectClassName="text-fg" />
        </span>
      </header>

      <nav
        data-chrome
        aria-label="Slides"
        className="pointer-events-auto absolute top-[calc(3.25rem+env(safe-area-inset-top))] bottom-0 left-0 hidden w-56 flex-col gap-1 overflow-y-auto border-r border-line bg-bg px-5 py-6 lg:flex"
      >
        {view.nav.map((group) => (
          <div key={group.title} className="mb-3">
            <p className="mb-1.5 font-mono text-[11px] font-semibold tracking-[0.1em] text-fg uppercase">{group.title}</p>
            <ul className="grid gap-0.5">
              {group.ids.map((id) => {
                const i = indexOf(id);
                const section = deck.sections[i];
                const ep = view.endpoints[id];
                if (!section) return null;
                const active = i === index;
                return (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => goTo(i)}
                      aria-current={active ? "step" : undefined}
                      className={`flex w-full items-center rounded-md px-2 py-1 text-left transition-colors ${active ? "bg-surface font-medium text-accent shadow-sm" : "text-mute hover:text-fg"}`}
                    >
                      {group.endpoints ? (
                        <span className="r-method mr-2" data-method={ep.method}>
                          {ep.method}
                        </span>
                      ) : null}
                      {section.label.toLowerCase()}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        <p className="mt-auto font-mono text-[11px] text-mute">{deck.ui.footer}</p>
      </nav>
    </div>
  );
}
