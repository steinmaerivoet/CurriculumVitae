import type { SlideProps } from "@/web/themes/types";
import type { TerminalView } from "@/bff/web/themes/terminal";
import { slug } from "@/core/matching";
import { hostname } from "@/bff/shared/format";
import { RefLink, TermLink } from "@/web/shared/TermLink";
import { useProjectSelection } from "@/web/headless/useProjectSelection";
import Frame from "../ui/Frame";
import Pane from "../ui/Pane";

/** `ls -la projects/` on the left, the selected project's README on the right. */
export default function Projects({ deck }: SlideProps<TerminalView>) {
  const { projects } = deck;
  const items = projects.featured;
  const { active, item, select, lit } = useProjectSelection(items);
  if (!item) return null;
  const dir = projects.label.toLowerCase();

  return (
    <Frame top>
      <h2 className="sr-only">{projects.label}</h2>
      <div className="grid items-start gap-5 lg:grid-cols-2 lg:gap-6">
        <Pane title={`ls -la ${dir}/`}>
          <p className="text-mute">total {items.length}</p>
          <ul role="tablist" aria-label={projects.label} aria-orientation="vertical">
            {items.map((p, i) => {
              const on = i === active;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={on}
                    onClick={() => select(i)}
                    className={`grid w-full grid-cols-[11ch_minmax(0,1fr)] gap-x-4 rounded-[3px] px-1 text-left sm:grid-cols-[11ch_5ch_minmax(0,1fr)] ${on ? "bg-surface" : "hover:bg-surface/60"} ${
                      lit === p.id ? "ring-1 ring-accent" : ""
                    }`}
                  >
                    <span className="text-mute">{p.url ? "lrwxr-xr-x" : "drwxr-xr-x"}</span>
                    <span className="t-yellow max-sm:hidden">{(p.period ?? p.meta ?? "").match(/\d{4}/)?.[0] ?? "—"}</span>
                    <span className={`truncate font-bold ${p.url ? "t-pink" : "t-cyan"}`}>
                      {slug(p.name)}
                      {p.url ? " -> ↗" : "/"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Pane>

        <Pane title={`cat ${slug(item.name)}/README.md`} className="min-h-[18rem]">
          <div role="tabpanel" aria-label={item.name}>
            {item.meta ? <p className="t-yellow">{item.meta}</p> : null}
            <h3 className="mt-1 mb-2 text-[clamp(1.4rem,2.6vw,2.1rem)] leading-tight font-extrabold tracking-tight">
              <span className="text-accent">#</span> {item.name}
            </h3>
            {item.description.map((d) => (
              <p key={d.slice(0, 24)} className="mb-2 max-w-[80ch]">
                {d}
              </p>
            ))}
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {item.tags.map((t) => (
                <li key={t.label}>
                  <TermLink
                    term={t}
                    className="block rounded-[3px] border px-1.5 text-xs leading-5"
                    linkClassName="t-cyan border-[#2b3540] hover:border-accent hover:text-accent"
                    textClassName="border-line text-mute"
                  >
                    #{slug(t.label)}
                  </TermLink>
                </li>
              ))}
            </ul>
            <p className="mt-4 flex flex-wrap gap-x-5 gap-y-1">
              {item.employer ? (
                <RefLink to={{ kind: "employer", company: item.employer, project: item.id }} title={item.employer} className="t-cyan hover:underline">
                  cd ../{slug(item.employer)}
                </RefLink>
              ) : null}
              {item.url ? (
                <a href={item.url} target="_blank" rel="noreferrer" className="t-pink hover:underline">
                  open {hostname(item.url)} ↗
                </a>
              ) : null}
            </p>
          </div>
        </Pane>
      </div>
    </Frame>
  );
}
