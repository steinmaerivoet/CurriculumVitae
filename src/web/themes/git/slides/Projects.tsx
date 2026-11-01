import type { SlideProps } from "@/web/themes/types";
import type { GitView } from "@/bff/web/themes/git";
import { RefLink, TermLink } from "@/web/shared/TermLink";
import { hostname } from "@/bff/shared/format";
import { useProjectSelection } from "@/web/headless/useProjectSelection";
import Frame from "../ui/Frame";
import Command from "../ui/Command";

const LABELS = ["var(--c-accent)", "var(--g-teal)", "var(--g-violet)", "var(--g-gold)", "var(--g-add)", "#8fb3ff"];

/** Featured projects as merged pull requests; the open one shows its description. */
export default function Projects({ deck, view }: SlideProps<GitView>) {
  const { projects } = deck;
  const items = projects.featured;
  const { active, select, lit } = useProjectSelection(items);

  return (
    <Frame top>
      <Command command={view.commands.projects} />
      <h2 className="sr-only">{projects.label}</h2>
      <div data-reveal className="overflow-hidden rounded-xl border border-line">
        <p className="flex gap-5 bg-bg-2 px-4 py-2.5 text-xs text-mute">
          <b className="font-normal text-fg">⑂ {items.length} merged</b>
          <span>0 open</span>
        </p>
        <ul>
          {items.map((p, i) => {
            const open = i === active;
            return (
              <li
                key={p.id}
                className={`grid grid-cols-[1.25rem_minmax(0,1fr)_auto] gap-3 border-t border-line px-4 py-2.5 transition-colors ${open ? "bg-bg-2" : ""} ${lit === p.id ? "shadow-[inset_2px_0_var(--c-accent)]" : ""}`}
              >
                <svg viewBox="0 0 16 16" className="mt-1 size-4" fill="none" stroke="var(--g-violet)" strokeWidth="1.6" aria-hidden="true">
                  <circle cx="4" cy="3" r="1.8" />
                  <circle cx="4" cy="13" r="1.8" />
                  <circle cx="12" cy="9" r="1.8" />
                  <path d="M4 5v6M4 5c0 3 2 4 6 4" />
                </svg>
                <div className="min-w-0">
                  <h3 className="inline">
                    <button type="button" aria-expanded={open} onClick={() => select(i)} className="text-left font-display text-base font-semibold tracking-tight hover:text-accent">
                      {p.name}
                    </button>
                  </h3>
                  <ul className="mt-1 flex flex-wrap gap-1 sm:mt-0 sm:ml-2 sm:inline-flex sm:align-[2px]">
                    {p.tags.map((t, j) => {
                      return (
                        <li key={t.label} style={{ color: LABELS[(i + j) % LABELS.length] }}>
                          <TermLink
                            term={t}
                            className="block rounded-full border border-[color-mix(in_oklab,currentColor_40%,transparent)] px-2 text-[10.5px] leading-4"
                            linkClassName="hover:bg-[color-mix(in_oklab,currentColor_14%,transparent)]"
                          />
                        </li>
                      );
                    })}
                  </ul>
                  <p className="mt-0.5 text-[11.5px] text-mute">
                    #{view.prNumbers[p.id]} merged ·{" "}
                    {p.employer ? (
                      <RefLink to={{ kind: "employer", company: p.employer, project: p.id }} title={p.employer} className="hover:text-fg hover:underline">
                        {p.meta}
                      </RefLink>
                    ) : (
                      p.meta
                    )}
                  </p>
                  {open ? <p className="g-prose mt-1.5 max-w-[68ch] font-display text-[15px] leading-normal">{p.summary ?? p.description.join(" ")}</p> : null}
                </div>
                {p.url ? (
                  <a href={p.url} target="_blank" rel="noreferrer" className="text-[11.5px] whitespace-nowrap text-mute hover:text-fg max-sm:hidden">
                    ↗ {hostname(p.url)}
                  </a>
                ) : (
                  <span />
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </Frame>
  );
}
