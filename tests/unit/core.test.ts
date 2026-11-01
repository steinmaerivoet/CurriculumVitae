import { describe, expect, it } from "vitest";
import { parse, stringify } from "yaml";
import { CvValidationError, loadCv } from "@/core/loader";
import { CvLinkError } from "@/core/linker";
import { cv, NOW, yamlText } from "./fixture";

/** data.yaml with one change applied. */
const variant = (change: (doc: any) => void) => {
  const doc = parse(yamlText);
  change(doc);
  return stringify(doc);
};

describe("content service", () => {
  it("loads data.yaml into the linked model", () => {
    expect(cv.person.firstName).toBe("Stein");
    expect(cv.experience.items.length).toBeGreaterThan(0);
    expect(cv.sections[0]).toBe("hero");
  });

  it("links labels to the most specific skill", () => {
    const belfius = cv.experience.items.find((e) => e.company === "Belfius")!;
    const skillOf = (label: string) => belfius.tech.find((t) => t.label === label)?.skill;
    expect(skillOf("Java 25")).toBe("Java");
    expect(skillOf("Azure DevOps")).toBe("Azure DevOps");
    expect(skillOf("Azure")).toBe("Azure");
    const ixor = cv.experience.items.find((e) => e.company === "Ixor")!;
    expect(ixor.tech.find((t) => t.label === "CloudFormation")?.skill).toBe("AWS");
    expect(ixor.tech.find((t) => t.label === "Bitbucket Pipelines")?.skill).toBe("Bitbucket");
  });

  it("derives where each skill was used, both ways", () => {
    const java = cv.skills.groups.flatMap((g) => g.items).find((s) => s.name === "Java")!;
    const companies = java.usedIn.flatMap((u) => (u.kind === "employer" ? [u.company] : []));
    expect(companies).toContain("Belfius");
    for (const company of companies) {
      expect(cv.experience.items.find((e) => e.company === company)!.tech.some((t) => t.skill === "Java")).toBe(true);
    }
  });

  it("puts projects under their employer and links featured ones to the projects slide", () => {
    const belfius = cv.experience.items.find((e) => e.company === "Belfius")!;
    expect(belfius.projects.map((p) => p.name)).toContain("Cloud-native integration platform");
    for (const p of cv.projects.items) {
      expect(p.ref.kind).toBe(p.featured || !p.employer ? "project" : "employer");
    }
  });

  it("counts stats from the content", () => {
    const technologies = cv.skills.groups.filter((g) => g.kind === "technology").reduce((n, g) => n + g.items.length, 0);
    expect(cv.about.stats.map((s) => s.value)).toContain(technologies);
  });

  it("works out years from `since` and the date", () => {
    const java = cv.skills.groups.flatMap((g) => g.items).find((s) => s.name === "Java")!;
    expect(java.years).toBe(NOW.getFullYear() - java.since!);
  });

  it("builds a graph where every node has an edge", () => {
    const linked = new Set(cv.graph.edges.flat());
    expect(cv.graph.nodes.filter((n) => !linked.has(n.id)).map((n) => n.id)).toEqual([]);
  });

  it("weighs each graph node by its connections", () => {
    for (const n of cv.graph.nodes) expect(n.degree).toBe(cv.graph.edges.filter((e) => e.includes(n.id)).length);
    const heaviest = (kind: string) => cv.graph.nodes.filter((n) => n.kind === kind).sort((a, b) => b.degree - a.degree)[0]!;
    expect(heaviest("skill").label).toBe("Java");
  });

  it("reports invalid content with its path", () => {
    const bad = variant((d) => delete d.person.email);
    expect(() => loadCv(bad, NOW)).toThrow(CvValidationError);
    expect(() => loadCv(bad, NOW)).toThrow(/person\.email/);
  });

  it("fails on a project that points to an unknown employer", () => {
    const bad = variant((d) => (d.projects.items[0].employer = "Nobody Inc"));
    expect(() => loadCv(bad, NOW)).toThrow(CvLinkError);
  });
});
