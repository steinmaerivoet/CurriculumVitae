import { describe, expect, it } from "vitest";
import { z } from "zod";
import { parse } from "yaml";
import { cvSchema } from "@/core/schema";
import { yamlText } from "./fixture";

/**
 * src/content/data.schema.json is generated from the zod schema, so editors
 * can autocomplete and check data.yaml while you type. The zod schema stays
 * the one source of truth: this test fails when the JSON file is out of date.
 *
 * Regenerate it with: npm run schema
 */
const jsonSchema = () => ({
  ...z.toJSONSchema(cvSchema, { io: "input", target: "draft-7", unrepresentable: "any" }),
  title: "CV content",
  description: "Everything the site, the PDF and the JSON API show. Validated on every build by src/core/schema.ts.",
});

describe("JSON Schema for data.yaml", () => {
  it("is generated from the zod schema and up to date", async () => {
    await expect(`${JSON.stringify(jsonSchema(), null, 2)}\n`).toMatchFileSnapshot("../../src/content/data.schema.json");
  });

  it("tells editors where to find it", () => {
    expect(yamlText.split("\n")[0]).toBe("# yaml-language-server: $schema=./data.schema.json");
  });

  it("rejects unknown keys, so a typo never goes unnoticed", () => {
    const data = parse(yamlText) as { person: Record<string, unknown> };
    data.person["emial"] = "x@example.com";
    const result = cvSchema.safeParse(data);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["person"]);
  });

  it("still accepts a bare string as a skill", () => {
    const data = parse(yamlText) as { skills: { groups: { items: unknown[] }[] } };
    data.skills.groups[0]!.items.push("Groovy");
    const parsed = cvSchema.parse(data);
    expect(parsed.skills.groups[0]!.items.at(-1)).toEqual({ name: "Groovy", match: [] });
  });
});
