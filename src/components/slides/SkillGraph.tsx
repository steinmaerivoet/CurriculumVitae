import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { gsap } from "gsap";
import { forceCollide, forceLink, forceManyBody, forceSimulation, forceX, forceY, type SimulationNodeDatum } from "d3-force";
import type { Graph, GraphNode } from "@/lib/links";
import { follow } from "@/components/deck/follow";

type Node = GraphNode & SimulationNodeDatum & { degree: number; r: number };
type Laid = { nodes: Node[]; edges: [Node, Node][]; box: [number, number, number, number] };

const R = { employer: 11, project: 6, skill: 4 } as const;
// d3 swaps link ends from ids to nodes once the simulation starts.
const isEmployer = (end: unknown) => (typeof end === "string" ? end : (end as Node).id).startsWith("e:");

/** A static force layout, shaped to the screen it's shown on. */
function layout(graph: Graph, w: number, h: number): Laid {
  const degree = new Map<string, number>();
  for (const [a, b] of graph.edges) {
    degree.set(a, (degree.get(a) ?? 0) + 1);
    degree.set(b, (degree.get(b) ?? 0) + 1);
  }
  const nodes: Node[] = graph.nodes.map((n, i) => {
    const d = degree.get(n.id) ?? 0;
    const angle = (i / graph.nodes.length) * Math.PI * 2;
    return {
      ...n,
      degree: d,
      r: n.kind === "skill" ? R.skill + Math.min(5, d * 0.7) : R[n.kind],
      x: Math.cos(angle) * 200,
      y: Math.sin(angle) * 200,
    };
  });
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const links = graph.edges.map(([a, b]) => ({ source: a, target: b }));
  const aspect = w / h;
  forceSimulation(nodes)
    .force("link", forceLink<Node, { source: string; target: string }>(links).id((n) => n.id).distance((l) => (isEmployer(l.source) || isEmployer(l.target) ? 120 : 70)).strength(0.4))
    .force("charge", forceManyBody<Node>().strength((n) => (n.kind === "employer" ? -1400 : -300)))
    .force("collide", forceCollide<Node>().radius((n) => n.r + 26).iterations(2))
    // The longer side of the screen gets the weaker pull, so the web fills it.
    .force("x", forceX(0).strength(0.07 / Math.max(1, aspect)))
    .force("y", forceY(0).strength(0.07 * Math.min(1, aspect)))
    .stop()
    .tick(420);

  let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
  for (const n of nodes) {
    x0 = Math.min(x0, n.x! - 70);
    x1 = Math.max(x1, n.x! + 70);
    y0 = Math.min(y0, n.y! - 20);
    y1 = Math.max(y1, n.y! + 26);
  }
  return {
    nodes,
    edges: graph.edges.map(([a, b]) => [byId.get(a)!, byId.get(b)!]),
    box: [x0, y0, x1 - x0, y1 - y0],
  };
}

/**
 * The skills slide's hidden extra: every skill, employer and project as one
 * network. Hover (or tap) a node to light up its connections; click it (or
 * tap it again) to go there.
 */
export default function SkillGraph({ graph, onClose, labels }: { graph: Graph; onClose: () => void; labels: { title: string; hint: string; close: string } }) {
  const dialog = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const [focus, setFocus] = useState<string | null>(null);
  const leaving = useRef(false); // closing to go somewhere else
  const pointer = useRef("mouse");
  const laid = useMemo(() => layout(graph, window.innerWidth, window.innerHeight), [graph]);

  const neighbours = useMemo(() => {
    const m = new Map<string, Set<string>>();
    for (const [a, b] of graph.edges) {
      if (!m.has(a)) m.set(a, new Set());
      if (!m.has(b)) m.set(b, new Set());
      m.get(a)!.add(b);
      m.get(b)!.add(a);
    }
    return m;
  }, [graph]);
  const near = (id: string) => !focus || id === focus || neighbours.get(focus)?.has(id);

  // Escape closes; focus moves into the dialog and back out afterwards.
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    dialog.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      // Back to the button, unless we're off to another slide: focusing the
      // button would pull the deck back to the skills slide.
      if (!leaving.current) prev?.focus?.({ preventScroll: true });
    };
  }, [onClose]);

  useLayoutEffect(() => {
    const root = svg.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.fromTo(root.querySelectorAll("[data-edge]"), { opacity: 0 }, { opacity: 1, duration: 1.2, ease: "power2.out", delay: 0.25 });
    gsap.fromTo(
      root.querySelectorAll("[data-node]"),
      { opacity: 0, scale: 0.4, transformOrigin: "center", transformBox: "fill-box" },
      { opacity: 1, scale: 1, duration: 0.6, ease: "back.out(2)", stagger: { each: 0.008, from: "random" } },
    );
  }, []);

  const go = (n: Node) => {
    leaving.current = true;
    onClose();
    follow(n.target);
  };

  const fill = { skill: "var(--color-accent)", employer: "var(--color-paper)", project: "var(--color-accent-2)" } as const;

  return createPortal(
    <div
      ref={dialog}
      role="dialog"
      aria-modal="true"
      aria-label={labels.title}
      tabIndex={-1}
      data-deck-ignore
      className="fixed inset-0 z-[60] flex flex-col bg-ink/95 text-paper outline-none backdrop-blur-xl"
      onClick={(e) => e.target === e.currentTarget && setFocus(null)}
    >
      <div className="flex items-start justify-between gap-4 px-6 pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-10 lg:px-16">
        <div>
          <p className="text-[11px] tracking-[0.24em] text-accent uppercase">{labels.title}</p>
          <p className="mt-1 text-xs text-mute">{labels.hint}</p>
          <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-mute" aria-hidden="true">
            {(["skill", "employer", "project"] as const).map((k) => (
              <span key={k} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: fill[k] }} />
                {k === "skill" ? "Skills" : k === "employer" ? "Experience" : "Projects"}
              </span>
            ))}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={labels.close}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line text-paper/80 transition-colors hover:border-accent hover:text-accent"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            <path d="M2 2l10 10M12 2 2 12" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
      </div>

      <svg ref={svg} viewBox={laid.box.join(" ")} className="min-h-0 w-full flex-1 touch-manipulation select-none" role="list">
        <g>
          {laid.edges.map(([a, b]) => {
            const lit = focus && (a.id === focus || b.id === focus);
            return (
              <line
                key={a.id + b.id}
                data-edge={`${a.id}|${b.id}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={lit ? "var(--color-accent)" : "var(--color-paper)"}
                strokeOpacity={lit ? 0.75 : focus ? 0.04 : 0.16}
                strokeWidth={lit ? 1.4 : 1}
                className="transition-[stroke-opacity] duration-300"
              />
            );
          })}
        </g>
        {laid.nodes.map((n) => {
          const on = near(n.id);
          return (
            <g
              key={n.id}
              data-node={n.id}
              role="listitem"
              aria-label={n.label}
              transform={`translate(${n.x} ${n.y})`}
              className="cursor-pointer transition-opacity duration-300"
              opacity={on ? 1 : 0.15}
              onPointerEnter={(e) => e.pointerType === "mouse" && setFocus(n.id)}
              onPointerLeave={(e) => e.pointerType === "mouse" && setFocus(null)}
              onPointerDown={(e) => (pointer.current = e.pointerType)}
              onClick={(e) => {
                e.stopPropagation();
                // Mouse: hovering already shows the connections, so a click goes there.
                // Touch: the first tap shows the connections, the second goes there.
                if (pointer.current === "mouse" || focus === n.id) go(n);
                else setFocus(n.id);
              }}
            >
              <title>{n.label}</title>
              <circle r={n.r + 14} fill="transparent" />
              {n.kind === "project" ? (
                <rect x={-n.r} y={-n.r} width={n.r * 2} height={n.r * 2} rx={2} transform="rotate(45)" fill={fill.project} />
              ) : (
                <circle
                  r={n.r}
                  fill={n.kind === "employer" ? "var(--color-ink)" : fill.skill}
                  stroke={n.kind === "employer" ? fill.employer : "none"}
                  strokeWidth={2}
                  style={n.id === focus ? { filter: "drop-shadow(0 0 6px var(--color-accent))" } : undefined}
                />
              )}
              <text
                y={n.r + (n.kind === "employer" ? 16 : 12)}
                textAnchor="middle"
                className={n.kind === "employer" ? "font-serif" : ""}
                fontSize={n.kind === "employer" ? 15 : n.kind === "project" ? 10 : 10}
                fill={n.kind === "employer" ? "var(--color-paper)" : "var(--color-mute)"}
                fillOpacity={n.id === focus ? 1 : 0.9}
              >
                {n.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>,
    document.body,
  );
}
