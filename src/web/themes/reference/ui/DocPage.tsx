import type { ReactNode } from "react";

/**
 * One documentation page: breadcrumb and prose on the left, an optional
 * response pane on the right. Leaves room for the top bar and, on wide
 * screens, the sidebar.
 */
export default function DocPage({ crumb, children, response, top = false }: { crumb: string; children: ReactNode; response?: ReactNode; top?: boolean }) {
  return (
    <div
      className={`grid min-h-full pt-[calc(3.25rem+env(safe-area-inset-top))] lg:h-full lg:pl-56 ${response ? "lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]" : ""}`}
    >
      <div
        className={`flex min-w-0 flex-col px-5 pt-8 pb-24 sm:px-10 lg:pb-10 xl:px-14 short:pt-6 ${top ? "justify-start lg:pt-[7vh]" : "justify-center"} ${response ? "" : "max-w-6xl"}`}
      >
        <p className="mb-3 font-mono text-xs text-mute" data-reveal>
          {crumb}
        </p>
        {children}
      </div>
      {response ? <div className="min-h-0 min-w-0 max-lg:mx-5 max-lg:mb-24 max-lg:rounded-xl max-lg:overflow-hidden lg:h-full">{response}</div> : null}
    </div>
  );
}
