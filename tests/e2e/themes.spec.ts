import { test, expect } from "@playwright/test";
import { SLIDES, expectAtRestOn, openDeck } from "./helpers";

/**
 * The same guarantees for every alternative theme as for Plain: slides fit,
 * selections never overflow, cross-links work, and switching themes keeps
 * the slide. Themes share these conventions (see docs/ARCHITECTURE.md):
 * employers and filters are tabs, the employer detail is #experience-panel
 * with the company in an h3, and a selected skill has its name in an h3.
 */
const THEMES = [
  { id: "terminal", path: "/terminal/" },
  { id: "reference", path: "/api-reference/" },
  { id: "git", path: "/commit-graph/" },
] as const;

for (const theme of THEMES) {
  test.describe(theme.id, () => {
    test("every slide fits the screen and nothing sticks out sideways", async ({ page, isMobile }, info) => {
      for (const [i, id] of SLIDES.entries()) {
        await openDeck(page, id, theme.path);
        await expectAtRestOn(page, i);
        await page.waitForTimeout(1200);
        expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
        const wide = await page.evaluate((sid) => {
          const vw = window.innerWidth;
          return [...document.getElementById(sid)!.querySelectorAll<HTMLElement>("h1,h2,h3,p,li,a,button")]
            .filter((el) => !el.closest("[data-carousel]"))
            .filter((el) => {
              const r = el.getBoundingClientRect();
              return r.width > 0 && (r.right > vw + 1 || r.left < -1);
            })
            .map((el) => el.textContent?.trim().slice(0, 40));
        }, id);
        expect(wide, id).toEqual([]);
        if (!isMobile) {
          const overflow = await page.evaluate((sid) => {
            const s = document.getElementById(sid)!.querySelector<HTMLElement>(".slide-scroll")!;
            return s.scrollHeight - s.clientHeight;
          }, id);
          expect(overflow, id).toBeLessThanOrEqual(1);
        }
        await page.screenshot({ path: `test-results/screens/${theme.id}-${info.project.name}-${String(i).padStart(2, "0")}-${id}.png` });
      }
    });

    test("every employer and project fits, and the list never moves", async ({ page, isMobile }) => {
      test.skip(isMobile, "phones may scroll inside a slide");
      await openDeck(page, "experience", theme.path);
      await expectAtRestOn(page, SLIDES.indexOf("experience"));
      await page.waitForTimeout(1200);
      const slide = page.locator("#experience");
      const listTop = () => slide.getByRole("tablist").evaluate((el) => el.getBoundingClientRect().top);
      const overflow = () => slide.locator(".slide-scroll").evaluate((s) => s.scrollHeight - s.clientHeight);
      const top = await listTop();
      const employers = slide.getByRole("tab");
      const n = await employers.count();
      expect(n).toBeGreaterThan(1);
      for (let i = 0; i < n; i++) {
        await employers.nth(i).click();
        const projects = slide.locator("#experience-panel button[aria-expanded]");
        const p = await projects.count();
        for (let j = 0; j < Math.max(1, p); j++) {
          if (p && (await projects.nth(j).getAttribute("aria-expanded")) !== "true") await projects.nth(j).click();
          await page.waitForTimeout(200);
          expect(await listTop()).toBeCloseTo(top, 0);
          expect(await overflow(), `employer ${i}, project ${j}`).toBeLessThanOrEqual(1);
        }
      }
    });

    test("a technology on experience links to its skill", async ({ page }) => {
      await openDeck(page, "experience", theme.path);
      await expectAtRestOn(page, SLIDES.indexOf("experience"));
      await page.locator("#experience").getByRole("tab", { name: /ixor/i }).click();
      await page.locator("#experience-panel").getByRole("button", { name: "Kafka", exact: true }).click();
      await expectAtRestOn(page, SLIDES.indexOf("skills"));
      await expect(page.locator("#skills").getByRole("heading", { name: "Kafka", level: 3 })).toBeVisible();
    });

    test("a skill links to the employer where it was used", async ({ page }) => {
      await openDeck(page, "skills", theme.path);
      await expectAtRestOn(page, SLIDES.indexOf("skills"));
      await page.locator("#skills").getByRole("tab", { name: /cloud.{1,3}platform/i }).click();
      await page.locator("#skills").getByRole("button", { name: /Kubernetes/ }).first().click();
      await expect(page.locator("#skills").getByRole("heading", { name: "Kubernetes", level: 3 })).toBeVisible();
      await page.locator("#skills").getByRole("button", { name: /Lead Engineer · Belfius/ }).first().click();
      await expectAtRestOn(page, SLIDES.indexOf("experience"));
      await expect(page.locator("#experience-panel h3")).toHaveText("Belfius");
    });

    test("the theme switcher goes to another theme on the same slide", async ({ page }) => {
      await openDeck(page, "projects", theme.path);
      await expectAtRestOn(page, SLIDES.indexOf("projects"));
      await page.getByLabel("Theme").selectOption("plain");
      await page.waitForURL(/\/#projects$/);
      await page.waitForSelector("[data-theme-deck='plain'][data-ready='true']");
      await expectAtRestOn(page, SLIDES.indexOf("projects"));
    });
  });
}

test("Plain offers every theme and switches to it", async ({ page }) => {
  await openDeck(page, "skills");
  const options = await page.getByLabel("Theme").locator("option").allTextContents();
  expect(options).toEqual(["Plain", "Terminal", "API reference", "Commit graph"]);
  await page.getByLabel("Theme").selectOption("terminal");
  await page.waitForURL(/\/terminal\/#skills$/);
  await page.waitForSelector("[data-theme-deck='terminal'][data-ready='true']");
  await expectAtRestOn(page, SLIDES.indexOf("skills"));
});

test("the API reference shows what the API returns", async ({ page, request }) => {
  await openDeck(page, "skills", "/api-reference/");
  const skills = (await (await request.get("/api/v1/skills.json")).json()) as { name: string; level: string }[];
  const java = skills.find((s) => s.name === "Java")!;
  await page.locator("#skills").getByRole("button", { name: /^Java/ }).first().click();
  const pane = page.locator("#skills aside");
  await expect(pane).toContainText(`"level": "${java.level}"`);
});
