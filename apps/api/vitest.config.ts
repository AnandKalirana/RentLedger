import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    // Each test file gets a fresh module registry so vi.mock() is isolated
    isolate: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/**/*.ts"],
      exclude: ["src/__tests__/**", "src/server.ts"],
    },
    // Resolve the @/ alias the same way tsc-alias does in production
    alias: {
      "@/": path.resolve(__dirname, "src") + "/",
    },
  },
  resolve: {
    alias: {
      "@/": path.resolve(__dirname, "src") + "/",
    },
  },
});
