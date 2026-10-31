import * as simpleIcons from "simple-icons";
import { getIconData, iconToSVG } from "@iconify/utils";
import lucide from "@iconify-json/lucide/icons.json";
import devicon from "@iconify-json/devicon/icons.json";
import type { IconifyJSON } from "@iconify/types";

/** Inner SVG markup plus its viewBox, drawn in the current text colour. */
export type SkillIcon = { body: string; viewBox: string };

/** A resolved icon with the id of its <symbol> in the page's icon sprite. */
export type IconSymbol = SkillIcon & { id: string };

/** "devicon:azure" → "i-devicon-azure": a stable, HTML-safe id for the sprite. */
export const iconId = (spec: string): string => `i-${spec.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

/**
 * Every icon a set of specs needs, once each, for an SVG sprite. Pages render
 * the sprite as static HTML and components point at it with <use>, so the
 * markup is in the page once instead of in every icon and in the island props.
 */
export function iconSprite(specs: Iterable<string | undefined>): IconSymbol[] {
  const out = new Map<string, IconSymbol>();
  for (const spec of specs) {
    if (!spec || out.has(iconId(spec))) continue;
    const icon = iconFor(spec);
    if (icon) out.set(iconId(spec), { ...icon, id: iconId(spec) });
  }
  return [...out.values()];
}

const sets: Record<string, IconifyJSON> = { lucide: lucide as IconifyJSON, devicon: devicon as IconifyJSON };

/**
 * `icon` in cv.yaml is either a Simple Icons slug ("kubernetes"), or a
 * prefixed Iconify name: "lucide:boxes" for concepts, "devicon:azure" for
 * logos Simple Icons doesn't carry.
 */
export function iconFor(spec: string | undefined): SkillIcon | null {
  const icon = resolve(spec);
  return icon && { ...icon, body: trimPrecision(icon.body) };
}

/**
 * Coordinates to one decimal: invisible at icon size (a tenth of a unit on a
 * 24 or 128 unit grid), and the sprite gets about a quarter smaller.
 * "1.2345.678" (two numbers without a separator) becomes "1.2.678", still two.
 */
const trimPrecision = (body: string): string => body.replace(/(\d\.\d)\d+/g, "$1");

function resolve(spec: string | undefined): SkillIcon | null {
  if (!spec) return null;
  const [prefix, name] = spec.includes(":") ? spec.split(":", 2) : ["", spec];
  if (prefix) {
    const set = sets[prefix];
    const data = set && name ? getIconData(set, name) : null;
    if (!data) {
      console.warn(`[cv.yaml] Unknown icon "${spec}". Browse https://icon-sets.iconify.design/${prefix}/`);
      return null;
    }
    const svg = iconToSVG(data);
    let body = svg.body;
    if (prefix === "devicon") {
      // Brand colours and gradients out: every logo is drawn in one colour.
      body = body
        .replace(/<defs>[\s\S]*?<\/defs>/g, "")
        .replace(/\s(fill|stroke)="(?!none)[^"]*"/g, "")
        .replace(/\sstyle="[^"]*"/g, "");
    }
    // A slightly finer line sits better next to the filled brand logos.
    if (prefix === "lucide") body = body.replace(/stroke-width="2"/g, 'stroke-width="1.75"');
    return { body, viewBox: svg.attributes.viewBox };
  }
  const key = "si" + spec.charAt(0).toUpperCase() + spec.slice(1);
  const icon = (simpleIcons as unknown as Record<string, { path: string } | undefined>)[key];
  if (!icon) {
    console.warn(`[cv.yaml] Unknown icon "${spec}". See https://simpleicons.org for valid slugs.`);
    return null;
  }
  return { body: `<path d="${icon.path}"/>`, viewBox: "0 0 24 24" };
}

