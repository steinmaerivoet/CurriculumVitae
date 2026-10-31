import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/** Unit tests for the content service (src/core) and the BFFs (src/bff). */
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: { include: ["tests/unit/**/*.test.ts"], environment: "node" },
});
