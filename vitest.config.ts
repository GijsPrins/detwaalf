import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  test: {
    environment: "happy-dom",
    include: ["test/unit/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["app/mappers/**", "app/utils/**"],
      reporter: ["text", "lcov"],
    },
  },
  resolve: {
    alias: {
      "~": resolve(__dirname, "app"),
      "@": resolve(__dirname, "app"),
    },
  },
});
