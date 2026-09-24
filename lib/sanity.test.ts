import { it, expect } from "vitest";

// Proves the test runner and "@/..." alias work. Delete once real tests exist.
it("toolchain works", async () => {
  const mod = await import("@/lib/config/env");
  expect(typeof mod.requireEnv).toBe("function");
});
