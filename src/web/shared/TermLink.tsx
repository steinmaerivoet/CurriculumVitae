import type { ReactNode } from "react";
import type { Ref, Term } from "@/core/model";
import { follow } from "@/web/deck/follow";

/**
 * Links to another item in the CV (a skill, an employer, a project).
 * Every theme renders cross-links through these two components, so the
 * linking behaviour is the same everywhere; only the classes differ.
 */
export function RefLink({ to, className, children, title }: { to: Ref; className?: string; children: ReactNode; title?: string }) {
  return (
    <button type="button" onClick={() => follow(to)} className={className} title={title}>
      {children}
    </button>
  );
}

/** A label from cv.yaml (`tech`, `tags`): a link when it names a skill, plain text otherwise. */
export function TermLink({
  term,
  className = "",
  linkClassName = "",
  textClassName = "",
  children,
}: {
  term: Term;
  className?: string;
  linkClassName?: string;
  textClassName?: string;
  children?: ReactNode;
}) {
  const content = children ?? term.label;
  if (!term.skill) return <span className={`${className} ${textClassName}`}>{content}</span>;
  return (
    <RefLink to={{ kind: "skill", name: term.skill }} title={term.skill} className={`${className} ${linkClassName}`}>
      {content}
    </RefLink>
  );
}
