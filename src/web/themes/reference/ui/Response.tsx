import type { ReactNode } from "react";

/**
 * The dark response pane next to a doc page. It shows the start of the real
 * response; "Open" loads the whole file.
 */
export default function Response({ title = "Response", status = "200 OK", href, children }: { title?: string; status?: string; href?: string | undefined; children: ReactNode }) {
  return (
    <aside className="r-code relative flex min-h-0 min-w-0 flex-col overflow-hidden font-mono text-[12.5px] leading-[1.7] max-lg:max-h-[26rem] lg:h-full short:text-xs">
      <div className="flex items-center gap-4 border-b border-[var(--r-code-line)] px-5 py-2.5 text-xs text-[#6f7899]">
        <span className="text-white">{title}</span>
        {href ? (
          <a href={href} target="_blank" rel="noreferrer" className="hover:text-white">
            Open ↗
          </a>
        ) : null}
        <span className="r-ok ml-auto before:content-['●_']" style={{ color: "#4ade9b" }}>
          {status}
        </span>
      </div>
      <div className="r-stream min-h-0 flex-1 overflow-hidden px-5 py-4">{children}</div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[var(--r-code)] to-transparent" aria-hidden="true" />
    </aside>
  );
}
