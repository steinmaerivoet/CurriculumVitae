import { test, expect, type Page } from "@playwright/test";
import { expectAtRestOn, openDeck } from "./helpers";

/**
 * Records the opacity of every animated text element on every frame while
 * `action` runs. Text may fade in, but it must never fade out again.
 */
async function recordOpacity(page: Page, action: () => Promise<void>) {
  await page.evaluate(() => {
    const els = [...document.querySelectorAll<HTMLElement>("[data-reveal], .split-char")];
    const w = window as unknown as { __rec: number[][]; __stop: boolean };
    w.__rec = els.map(() => []);
    w.__stop = false;
    const tick = () => {
      els.forEach((el, i) => w.__rec[i]!.push(Number(getComputedStyle(el).opacity)));
      if (!w.__stop) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  await action();
  return page.evaluate(() => {
    const w = window as unknown as { __rec: number[][]; __stop: boolean };
    w.__stop = true;
    return w.__rec;
  });
}

test("text never disappears again once it has been shown", async ({ page, isMobile }) => {
  test.skip(isMobile, "uses the keyboard");
  await openDeck(page);
  await page.waitForTimeout(1500); // let the intro finish

  const series = await recordOpacity(page, async () => {
    for (const key of ["ArrowDown", "ArrowDown", "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowDown"]) {
      await page.keyboard.press(key);
      await page.waitForTimeout(1200);
    }
  });

  let drops = 0;
  for (const s of series) {
    for (let i = 1; i < s.length; i++) if (s[i]! < s[i - 1]! - 0.01) drops++;
  }
  expect(drops, "an element became less visible after it was shown").toBe(0);
});

test("every slide shows all of its content once it is reached", async ({ page, isMobile }) => {
  test.skip(isMobile, "uses the keyboard");
  await openDeck(page);
  for (let i = 1; i < 7; i++) {
    await page.keyboard.press("ArrowDown");
    await expectAtRestOn(page, i);
  }
  await page.waitForTimeout(2000);
  const hidden = await page.evaluate(
    () => [...document.querySelectorAll<HTMLElement>("[data-reveal]")].filter((el) => Number(getComputedStyle(el).opacity) < 0.99).length,
  );
  expect(hidden).toBe(0);
});
