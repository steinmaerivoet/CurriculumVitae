// Deploy step for Cloudflare Workers Builds.
//
// The repo, not the dashboard, decides what goes live: a build of `main` is
// deployed to production (steinmaerivoet.dev), every other branch only uploads
// a preview version. Set BOTH the "Deploy command" and the "Non-production
// branch deploy command" of the Worker to `npm run deploy` (see CLOUDFLARE.md).
//
// Workers Builds exposes the branch as WORKERS_CI_BRANCH. Outside Workers
// Builds, pass the branch yourself: `WORKERS_CI_BRANCH=main npm run deploy`.
import { spawnSync } from "node:child_process";

const PRODUCTION_BRANCH = "main";
const branch = process.env.WORKERS_CI_BRANCH;

if (!branch) {
  console.error(
    "deploy: WORKERS_CI_BRANCH is not set. Run this in Workers Builds, " +
      "or set it yourself, e.g. WORKERS_CI_BRANCH=main npm run deploy.",
  );
  process.exit(1);
}

const production = branch === PRODUCTION_BRANCH;
const args = production ? ["wrangler", "deploy"] : ["wrangler", "versions", "upload"];

console.log(
  production
    ? `deploy: branch "${branch}" → production (steinmaerivoet.dev)`
    : `deploy: branch "${branch}" → preview version only`,
);

const result = spawnSync("npx", args, { stdio: "inherit", shell: process.platform === "win32" });
process.exit(result.status ?? 1);
