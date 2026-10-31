import { defineConfig, devices } from "@playwright/test";

const PORT = 4322;

/**
 * End-to-end tests for the slideshow. They build the site, serve the
 * production build and drive it like a visitor would: wheel, trackpad,
 * keyboard and touch. Screenshots of every slide land in
 * test-results/screens for a visual review.
 *
 *   npm run test:e2e
 */
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  fullyParallel: true,
  // Input tests depend on realistic event timing; too many parallel browsers
  // on one machine slow event delivery down and make gestures look different.
  workers: 2,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  webServer: {
    command: `npm run build && npx astro preview --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env["CI"],
    timeout: 180_000,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "laptop", use: { ...devices["Desktop Chrome"], viewport: { width: 1366, height: 768 } } },
    { name: "phone", use: { ...devices["Pixel 7"] } },
    { name: "small-phone", use: { ...devices["Pixel 7"], viewport: { width: 360, height: 640 } } },
  ],
});
