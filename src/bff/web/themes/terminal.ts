import type { Cv } from "@/core";
import type { SkillLevel } from "@/core/model";
import { bareUrl } from "../../shared/format";
import { careerStart, languageShares, type LanguageShare } from "./shared";

/**
 * Terminal theme presenter: the extra view model the terminal theme needs on
 * top of the DeckModel. Content comes from the CV; the shell vocabulary
 * (commands, key hints) is the theme's own and lives here, not in cv.yaml.
 */

export type TerminalView = {
  user: string;
  host: string;
  /** neofetch lines about the person. */
  fetch: { key: string; value: string }[];
  /** htop meters: one per skill group, filled by the group's average level. */
  meters: { group: string; count: number; fill: number }[];
  /** First year on the job, for "uptime". */
  since: number;
  /** A level as a number of bars out of 3, for the htop table. */
  levelBars: Record<SkillLevel, number>;
  locales: LanguageShare[];
  /** The key bar at the bottom. */
  keys: { key: string; label: string }[];
};

const BARS: Record<SkillLevel, number> = { expert: 3, advanced: 2, familiar: 1 };
const lower = (s: string) => s.toLowerCase();

export function buildTerminalView(cv: Cv, now = new Date()): TerminalView {
  const { person, skills, education } = cv;
  const since = careerStart(cv);
  const expert = skills.groups
    .filter((g) => g.kind === "technology")
    .flatMap((g) => g.items)
    .filter((s) => s.level === "expert")
    .map((s) => s.name);
  const langs = education.languages;

  return {
    user: lower(person.firstName),
    host: bareUrl(cv.meta.url).split(".")[0] ?? lower(person.lastName),
    fetch: [
      { key: "role", value: person.headline },
      { key: "location", value: person.location },
      { key: "uptime", value: `${now.getFullYear() - since} ${skills.yearsLabel}, since ${since}` },
      { key: "stack", value: expert.join(", ") },
      { key: "locales", value: langs.map((l) => lower(l.name)).join(", ") },
      { key: "contact", value: person.email },
    ],
    meters: skills.groups.map((g) => ({
      group: g.name,
      count: g.items.length,
      fill: g.items.reduce((n, s) => n + (s.level ? BARS[s.level] : 1), 0) / (g.items.length * 3 || 1),
    })),
    since,
    levelBars: BARS,
    locales: languageShares(cv),
    keys: [
      { key: "↑↓", label: lower(cv.ui.scrollHint) },
      { key: `1-${cv.sections.length}`, label: "jump" },
    ],
  };
}
