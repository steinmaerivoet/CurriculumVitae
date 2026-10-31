import { test, expect } from "@playwright/test";
import { SLIDES, expectAtRestOn, openDeck } from "./helpers";

test("a skill links to the employer where it was used", async ({ page }) => {
  await openDeck(page, "skills");
  await expectAtRestOn(page, SLIDES.indexOf("skills"));
  await page.locator("#skills").getByRole("tab", { name: /Cloud & platform/ }).click();
  await page.waitForTimeout(600);
  await page.locator("#skills").getByRole("button", { name: /Kubernetes/ }).click();
  await page.locator("#skills").getByRole("button", { name: /Lead Engineer · Belfius/ }).locator("visible=true").first().click();
  await expectAtRestOn(page, SLIDES.indexOf("experience"));
  await expect(page.locator("#experience-panel h3")).toHaveText("Belfius");
});

test("a technology chip on experience links to its skill", async ({ page, isMobile }) => {
  await openDeck(page, "experience");
  await expectAtRestOn(page, SLIDES.indexOf("experience"));
  await page.locator("#experience").getByRole("tab", { name: /Ixor/ }).click();
  await page.waitForTimeout(800);
  await page.locator("#experience-panel").getByRole("button", { name: "Kafka", exact: true }).click();
  await expectAtRestOn(page, SLIDES.indexOf("skills"));
  await expect(page.locator("#skills").getByRole("heading", { name: "Kafka", level: 3 }).locator("visible=true")).toBeVisible();
  if (isMobile) await expect(page.locator("#skills").getByRole("button", { name: "Close" })).toBeVisible();
});

test("a project card links to its employer, with the project open", async ({ page }) => {
  await openDeck(page, "projects");
  await expectAtRestOn(page, SLIDES.indexOf("projects"));
  await page.locator("#projects").getByRole("button", { name: /Belfius · Kubernetes Operator/ }).click();
  await expectAtRestOn(page, SLIDES.indexOf("experience"));
  await expect(page.locator("#experience-panel h3")).toHaveText("Belfius");
  await expect(page.locator("#experience-panel").getByRole("button", { name: /Cloud-native integration platform/ })).toHaveAttribute("aria-expanded", "true");
});

test("the network view opens, connects and navigates", async ({ page, isMobile }) => {
  await openDeck(page, "skills");
  await expectAtRestOn(page, SLIDES.indexOf("skills"));
  await page.locator("#skills").getByRole("button", { name: "Network" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  // Every node is connected to something: a lonely node is a missing link in cv.yaml.
  const lonely = await page.evaluate(() => {
    const linked = new Set([...document.querySelectorAll("[data-edge]")].flatMap((l) => l.getAttribute("data-edge")!.split("|")));
    return [...document.querySelectorAll("[data-node]")].map((g) => g.getAttribute("data-node")!).filter((id) => !linked.has(id));
  });
  expect(lonely).toEqual([]);
  // Wheel and keys inside the view never move the deck underneath.
  await page.mouse.move(400, 400);
  await page.mouse.wheel(0, 400);
  await page.waitForTimeout(500);
  await expectAtRestOn(page, SLIDES.indexOf("skills"));
  // Mouse: hover shows the connections, a click goes there. Touch: tap, then tap again.
  const node = page.locator('[data-node][aria-label="Ixor"]');
  if (isMobile) {
    await node.tap();
    await expect(dialog).toBeVisible();
    await node.tap();
  } else {
    await node.click();
  }
  await expect(dialog).toHaveCount(0);
  await expectAtRestOn(page, SLIDES.indexOf("experience"));
  await expect(page.locator("#experience-panel h3")).toHaveText("Ixor");
});
