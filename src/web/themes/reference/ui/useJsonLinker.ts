import { useMemo } from "react";
import type { DeckModel } from "@/bff/web/model";
import type { JsonLinker } from "./JsonView";

/**
 * Which JSON fields are links: the API's field names (src/bff/api/resources.ts)
 * mapped to the kind of item they name.
 */
export function useJsonLinker(deck: DeckModel): JsonLinker {
  return useMemo(() => {
    const skills = new Set(deck.skills.groups.flatMap((g) => g.items.map((s) => s.name)));
    const companies = new Set(deck.experience.items.map((e) => e.company));
    const projects = new Map(deck.projects.items.map((p) => [p.id, p.ref]));
    return (key, value) => {
      if ((key === "skills" || key === "name") && skills.has(value)) return { kind: "skill", name: value };
      if ((key === "employer" || key === "usedAt" || key === "company") && companies.has(value)) return { kind: "employer", company: value };
      if ((key === "projects" || key === "usedIn" || key === "id") && projects.has(value)) return projects.get(value);
      return undefined;
    };
  }, [deck]);
}
