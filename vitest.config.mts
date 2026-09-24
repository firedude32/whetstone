import { defineConfig } from "vitest/config";
import path from "node:path";


export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname) },
  },
  test: {
    // The core (lib/, policies/, evals/) is framework-free, so plain Node is enough.
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules/**", ".next/**"],
  },
});
