import path from "node:path";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // scripts/*.test.mjs use node:test (npm run test:ai-attribution, test:commitlint).
    exclude: [...configDefaults.exclude, "scripts/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
