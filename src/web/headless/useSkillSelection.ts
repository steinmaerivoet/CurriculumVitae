import { useMemo, useState } from "react";
import { skillKinds, type SkillKind } from "@/core/model";
import { allSkills, type DeckModel, type SkillView } from "@/bff/web/model";
import { useFollow } from "@/web/deck/follow";

/** A filter is a whole kind ("kind:technology") or one group (its name). */
export type SkillFilter = { id: string; label: string; count: number; divider: boolean };

export const kindFilter = (kind: SkillKind) => `kind:${kind}`;
export const showsSkill = (filter: string, s: SkillView) => (filter.startsWith("kind:") ? s.kind === filter.slice(5) : s.group === filter);

/**
 * The filters for the skills slide. Kinds (technologies, ways of working,
 * tools) are never mixed; a kind with several groups gets an "all of this
 * kind" filter before its groups.
 */
export function skillFilters(skills: DeckModel["skills"]): SkillFilter[] {
  const out: SkillFilter[] = [];
  for (const kind of skillKinds) {
    const groups = skills.groups.filter((g) => g.kind === kind);
    if (!groups.length) continue;
    const divider = out.length > 0;
    if (groups.length > 1) {
      out.push({ id: kindFilter(kind), label: skills.kindLabels[kind], count: groups.reduce((n, g) => n + g.items.length, 0), divider });
    }
    groups.forEach((g, i) => out.push({ id: g.name, label: g.name, count: g.items.length, divider: divider && groups.length === 1 && i === 0 }));
  }
  return out;
}

/**
 * Filter and selection state of the skills slide, shared by every theme.
 * A link to a skill from elsewhere selects it and switches to a filter that
 * shows it (`preferKind`: its whole kind when there is such a filter).
 */
export function useSkillSelection(skills: DeckModel["skills"], opts: { onFollow?: (s: SkillView) => void; preferKind?: () => boolean } = {}) {
  const entries = useMemo(() => allSkills({ skills }), [skills]);
  const filters = useMemo(() => skillFilters(skills), [skills]);
  const [filter, setFilterState] = useState<string>(filters[0]?.id ?? "");
  const [selectedKey, setSelectedKey] = useState<string>(entries[0]?.key ?? "");

  /** Changes the filter; keeps a visible skill selected. Returns whether it changed. */
  const setFilter = (next: string): boolean => {
    if (next === filter) return false;
    setFilterState(next);
    const cur = entries.find((e) => e.key === selectedKey);
    if (cur && !showsSkill(next, cur)) {
      const first = entries.find((e) => showsSkill(next, e));
      if (first) setSelectedKey(first.key);
    }
    return true;
  };

  useFollow("skill", (ref) => {
    const entry = entries.find((e) => e.name === ref.name);
    if (!entry) return;
    if (!showsSkill(filter, entry)) {
      const kindTab = kindFilter(entry.kind);
      setFilterState(opts.preferKind?.() !== false && filters.some((f) => f.id === kindTab) ? kindTab : entry.group);
    }
    setSelectedKey(entry.key);
    opts.onFollow?.(entry);
  });

  const selected = entries.find((e) => e.key === selectedKey) ?? entries[0];
  return { entries, filters, filter, setFilter, setFilterState, selected, select: setSelectedKey, visible: (s: SkillView) => showsSkill(filter, s) };
}
