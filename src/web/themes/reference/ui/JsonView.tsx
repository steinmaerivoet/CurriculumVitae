import type { ReactNode } from "react";
import type { Ref } from "@/core/model";
import { RefLink } from "@/web/shared/TermLink";

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

/** Resolves a string in the JSON to a link in the CV, from the key it sits under. */
export type JsonLinker = (key: string, value: string) => Ref | undefined;

const IND = "  ";

/**
 * Pretty-printed, syntax-coloured JSON. Strings that name a skill, employer or
 * project are links (via `linker`), so the response pane is part of the web
 * of cross-links too. Long arrays are cut after `maxItems`.
 */
export default function JsonView({ value, linker, maxItems = 6 }: { value: unknown; linker?: JsonLinker; maxItems?: number }) {
  return <code className="block font-mono whitespace-pre-wrap [overflow-wrap:anywhere]">{render(value as Json, 0, "", linker, maxItems)}</code>;
}

function render(v: Json, depth: number, key: string, linker: JsonLinker | undefined, maxItems: number): ReactNode {
  const pad = IND.repeat(depth + 1);
  const end = IND.repeat(depth);
  if (v === null || typeof v === "boolean") return <span className="r-bool">{String(v)}</span>;
  if (typeof v === "number") return <span className="r-number">{v}</span>;
  if (typeof v === "string") {
    const ref = linker?.(key, v);
    const text = `"${v}"`;
    return ref ? (
      <RefLink to={ref} title={v} className="r-string underline decoration-current/30 underline-offset-2 hover:decoration-current">
        {text}
      </RefLink>
    ) : (
      <span className="r-string">{text}</span>
    );
  }
  if (Array.isArray(v)) {
    if (!v.length) return <span className="r-punct">[]</span>;
    const shown = v.slice(0, maxItems);
    const flat = shown.every((x) => x === null || typeof x !== "object");
    const more = v.length - shown.length;
    if (flat && shown.join(", ").length < 60) {
      return (
        <>
          <span className="r-punct">[</span>
          {shown.map((x, i) => (
            <span key={i}>
              {i ? ", " : ""}
              {render(x, depth, key, linker, maxItems)}
            </span>
          ))}
          {more ? <span className="r-punct">, … {more} more</span> : null}
          <span className="r-punct">]</span>
        </>
      );
    }
    return (
      <>
        <span className="r-punct">[</span>
        {"\n"}
        {shown.map((x, i) => (
          <span key={i}>
            {pad}
            {render(x, depth + 1, key, linker, maxItems)}
            {i < shown.length - 1 || more ? "," : ""}
            {"\n"}
          </span>
        ))}
        {more ? <span className="r-punct">{`${pad}// … ${more} more\n`}</span> : null}
        {end}
        <span className="r-punct">]</span>
      </>
    );
  }
  const entries = Object.entries(v);
  return (
    <>
      <span className="r-punct">{"{"}</span>
      {"\n"}
      {entries.map(([k, x], i) => (
        <span key={k}>
          {pad}
          <span className="r-key">"{k}"</span>
          <span className="r-punct">: </span>
          {render(x, depth + 1, k, linker, maxItems)}
          {i < entries.length - 1 ? "," : ""}
          {"\n"}
        </span>
      ))}
      {end}
      <span className="r-punct">{"}"}</span>
    </>
  );
}
