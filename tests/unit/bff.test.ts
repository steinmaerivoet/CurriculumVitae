import { describe, expect, it } from "vitest";
import { buildDeckModel } from "@/bff/web/deck";
import { allSkills } from "@/bff/web/model";
import { buildPdfModel } from "@/bff/pdf/document";
import { apiPath, buildApiResources } from "@/bff/api/resources";
import { buildTerminalView } from "@/bff/web/themes/terminal";
import { buildReferenceView } from "@/bff/web/themes/reference";
import { buildGitView, heatFor, shortHash } from "@/bff/web/themes/git";
import { range, shortRange } from "@/bff/shared/format";
import { cv, NOW } from "./fixture";

describe("shared formatting", () => {
  it("formats periods the same everywhere", () => {
    expect(range("2019", "2023", "Present")).toBe("2019 – 2023");
    expect(range("2026", null, "Present")).toBe("2026 – Present");
    expect(range("2015", "2015", "Present")).toBe("2015");
    expect(shortRange("2019", "2023")).toBe("2019–23");
    expect(shortRange("2026", null)).toBe("2026–now");
  });
});

describe("web deck BFF", () => {
  const deck = buildDeckModel(cv);

  it("labels every section and keeps the order of cv.yaml", () => {
    expect(deck.sections.map((s) => s.id)).toEqual(cv.sections);
    expect(deck.sections.every((s) => s.label.length > 0)).toBe(true);
  });

  it("gives every skill a unique key and resolves its icon", () => {
    const skills = allSkills(deck);
    expect(new Set(skills.map((s) => s.key)).size).toBe(skills.length);
    expect(skills.filter((s) => !s.icon).map((s) => s.name)).toEqual([]);
  });

  it("is plain data, so it can cross into the browser", () => {
    expect(JSON.parse(JSON.stringify(deck))).toEqual(deck);
  });
});

describe("PDF BFF", () => {
  const pdf = buildPdfModel(cv);

  it("has every employer with its own projects, and lists the others separately", () => {
    expect(pdf.experience?.items.map((e) => e.company)).toEqual(cv.experience.items.map((e) => e.company));
    const standalone = pdf.projects?.items.map((p) => p.id) ?? [];
    expect(standalone).toEqual(cv.projects.items.filter((p) => !p.employer).map((p) => p.id));
  });

  it("only explains the skill levels that are in use", () => {
    const used = new Set(cv.skills.groups.flatMap((g) => g.items.map((i) => i.level)));
    expect(pdf.skills[0]?.legend.every((l) => used.has(l.level))).toBe(true);
  });
});

describe("JSON API BFF", () => {
  const api = buildApiResources(cv);

  it("only names skills, employers and projects that exist", () => {
    const skills = new Set(api.skills.map((s) => s.name));
    const companies = new Set(api.experience.map((e) => e.company));
    const projects = new Set(api.projects.map((p) => p.id));
    for (const e of api.experience) e.skills.forEach((s) => expect(skills).toContain(s));
    for (const p of api.projects) {
      p.skills.forEach((s) => expect(skills).toContain(s));
      if (p.employer) expect(companies).toContain(p.employer);
    }
    for (const s of api.skills) {
      s.usedAt.forEach((c) => expect(companies).toContain(c));
      s.usedIn.forEach((id) => expect(projects).toContain(id));
    }
  });

  it("publishes under a versioned path", () => {
    expect(apiPath("skills")).toBe("/api/v1/skills.json");
  });
});

describe("theme presenters", () => {
  it("terminal: meters are shares, the uptime counts from the first job", () => {
    const view = buildTerminalView(cv, NOW);
    expect(view.meters.every((m) => m.fill > 0 && m.fill <= 1)).toBe(true);
    expect(view.fetch.find((f) => f.key === "uptime")?.value).toContain(String(view.since));
  });

  it("reference: every endpoint is a published resource or a mail", () => {
    const view = buildReferenceView(cv);
    for (const id of cv.sections) {
      const ep = view.endpoints[id];
      expect(ep.method === "MAIL" ? ep.path : ep.path.startsWith("/api/v1/")).toBeTruthy();
    }
  });

  it("git: stable hashes, one commit per employer, a stack diff against the one before", () => {
    expect(shortHash("Belfius2023")).toMatch(/^[0-9a-f]{7}$/);
    expect(shortHash("Belfius2023")).toBe(shortHash("Belfius2023"));
    const view = buildGitView(cv, NOW);
    expect(view.commits.map((c) => c.company)).toEqual(cv.experience.items.map((e) => e.company));
    expect(new Set(view.commits.map((c) => c.hash)).size).toBe(view.commits.length);
    const [belfius, ixor] = cv.experience.items;
    const diff = view.commits[0]!.diff;
    expect(diff.added.every((t) => !ixor!.tech.some((u) => u.label === t.label))).toBe(true);
    expect(diff.removed.every((t) => !belfius!.tech.some((u) => u.label === t.label))).toBe(true);
    expect(view.commits.at(-1)?.type).toBe("init");
  });

  it("git: heat grows from `since` up to the level", () => {
    expect(heatFor(2020, "expert", [2019, 2020, 2022, 2030])).toEqual([0, 1, 2, 4]);
    expect(heatFor(2020, "familiar", [2030])).toEqual([2]);
    expect(heatFor(undefined, "expert", [2030])).toEqual([0]);
  });
});
