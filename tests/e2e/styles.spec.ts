import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test, expect, type Page } from "@playwright/test";
import { openDeck } from "./helpers";
import { themes } from "../../src/web/themes/registry";

/**
 * Styles load once, with the page, and nothing that happens later may change
 * them. A lazily loaded chunk (the skills network, for one) used to carry its
 * own copy of the shared stylesheet; injected after the theme's, it reset the
 * theme's fonts and colours, so the intro's last name, now in a wider
 * fallback font, broke over two lines.
 */

test("no script chunk loads a stylesheet of its own", async ({}, info) => {
  test.skip(info.project.name !== "desktop", "checks the build output once");
  const dir = join(process.cwd(), "dist", "_astro");
  const files = readdirSync(dir);
  const sheets = files.filter((f) => f.endsWith(".css"));
  const offenders = files
    .filter((f) => f.endsWith(".js"))
    .flatMap((js) => {
      const code = readFileSync(join(dir, js), "utf8");
      return sheets.filter((css) => code.includes(css)).map((css) => `${js} → ${css}`);
    });
  // Import a theme's CSS from its page in src/pages, not from a component.
  expect(offenders).toEqual([]);
});

/** The page's stylesheets, its theme tokens and the intro heading's size. */
async function snapshot(page: Page) {
  return page.evaluate(() => {
    const css = getComputedStyle(document.documentElement);
    const h1 = document.querySelector("#hero h1")!.getBoundingClientRect();
    return {
      sheets: [...document.querySelectorAll('link[rel="stylesheet"], style')].length,
      tokens: ["--f-sans", "--f-display", "--f-mono", "--c-bg", "--c-fg", "--c-accent"].map((t) => css.getPropertyValue(t).trim()),
      heading: { width: Math.round(h1.width), height: Math.round(h1.height) },
    };
  });
}

async function goTo(page: Page, id: string) {
  await page.evaluate((sid) => (location.hash = sid), id);
  await page.waitForTimeout(900);
}

for (const theme of themes) {
  test(`${theme.id}: opening overlays and visiting every slide leaves the styles alone`, async ({ page }) => {
    await openDeck(page, "hero", theme.path);
    await page.evaluate(() => document.fonts.ready);
    const before = await snapshot(page);

    // Every slide, so every lazily loaded part of the theme has loaded.
    for (const id of ["about", "experience", "skills", "projects", "education", "contact"]) await goTo(page, id);
    await goTo(page, "skills");
    const network = page.locator("#skills").getByRole("button", { name: /network/i });
    if (await network.count()) {
      await network.first().click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await page.waitForTimeout(600);
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).toHaveCount(0);
    }
    await goTo(page, "hero");
    await page.evaluate(() => document.fonts.ready);

    expect(await snapshot(page)).toEqual(before);
  });
}

test("plain: the last name stays on one line after the skills network", async ({ page }) => {
  await openDeck(page, "skills");
  await page.locator("#skills").getByRole("button", { name: /network/i }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await goTo(page, "hero");
  const [first, last] = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>("#hero h1 > span")].map((s) => s.getBoundingClientRect().height),
  );
  // One line each: the last name is no taller than the first.
  expect(last!).toBeLessThanOrEqual(first! + 1);
});
