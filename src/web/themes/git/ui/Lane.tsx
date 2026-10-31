import type { GitCommit } from "@/bff/web/themes/git";

const MAIN = 14;
const SIDE = 36;
const H = 40;

/**
 * One row of the branch graph. The main line runs through every row; a
 * commit on a side branch forks off above it and merges back below.
 */
export default function Lane({ commit, first, last }: { commit: GitCommit; first: boolean; last: boolean }) {
  const x = commit.lane ? SIDE : MAIN;
  const mid = H / 2;
  return (
    <svg viewBox={`0 0 48 ${H}`} className="h-10 w-12 shrink-0 overflow-visible" aria-hidden="true" fill="none" strokeWidth="2.5" strokeLinecap="round">
      <path d={`M${MAIN} ${first ? mid : 0} V${last ? mid : H}`} stroke="var(--c-accent)" />
      {commit.lane ? (
        <>
          <path d={`M${MAIN} 0 C${MAIN} ${mid * 0.6} ${SIDE} ${mid * 0.4} ${SIDE} ${mid}`} stroke="var(--g-teal)" />
          <path d={`M${SIDE} ${mid} C${SIDE} ${mid * 1.6} ${MAIN} ${mid * 1.4} ${MAIN} ${H}`} stroke="var(--g-teal)" />
        </>
      ) : null}
      {commit.head ? <circle cx={x} cy={mid} r="11" fill="color-mix(in oklab, var(--c-accent) 25%, transparent)" className="g-pulse" /> : null}
      <circle
        cx={x}
        cy={mid}
        r={commit.head ? 7 : 5.5}
        fill={commit.head ? "var(--c-accent)" : commit.lane ? "var(--g-teal)" : "var(--c-bg)"}
        stroke={commit.lane ? "var(--g-teal)" : "var(--c-accent)"}
      />
    </svg>
  );
}
