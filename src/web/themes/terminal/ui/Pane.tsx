import type { ReactNode } from "react";

/** A bordered TUI pane with its title on the border, and an optional note on the right. */
export default function Pane({ title, note, children, className = "", id }: { title: string; note?: string; children: ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={`t-pane min-w-0 px-4 pt-5 pb-4 ${className}`} data-reveal>
      <h2 className="t-pane-title">{title}</h2>
      {note ? <span className="t-pane-title right" aria-hidden="true">{note}</span> : null}
      {children}
    </section>
  );
}
