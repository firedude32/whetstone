import { describe, it, expect } from "vitest";
import { requireEnv } from "./env";

describe("requireEnv", () => {
  it("returns the trimmed value when set", () => {
    expect(requireEnv("MODEL_MAIN", { env: { MODEL_MAIN: "  claude-sonnet-5 " } })).toBe(
      "claude-sonnet-5",
    );
  });

  it("throws with the variable name when missing", () => {
    expect(() => requireEnv("ANTHROPIC_API_KEY", { env: {} })).toThrow(/ANTHROPIC_API_KEY/);
  });

  it("treats empty and whitespace-only as missing", () => {
    expect(() => requireEnv("X", { env: { X: "" } })).toThrow(/X/);
    expect(() => requireEnv("X", { env: { X: "   " } })).toThrow(/X/);
  });

  it("never leaks a value into an error message", () => {
    try {
      requireEnv("NEXT_PUBLIC_API_KEY", { secret: true, env: { NEXT_PUBLIC_API_KEY: "sk-SECRET" } });
      expect.fail("should have thrown");
    } catch (e) {
      expect((e as Error).message).not.toContain("sk-SECRET");
    }
  });

  it("refuses secrets with a NEXT_PUBLIC_ prefix", () => {
    expect(() =>
      requireEnv("NEXT_PUBLIC_ANTHROPIC_API_KEY", {
        secret: true,
        env: { NEXT_PUBLIC_ANTHROPIC_API_KEY: "sk-x" },
      }),
    ).toThrow(/NEXT_PUBLIC_/);
  });

  it("allows NEXT_PUBLIC_ for non-secrets", () => {
    expect(
      requireEnv("NEXT_PUBLIC_SUPABASE_URL", { env: { NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co" } }),
    ).toBe("https://x.supabase.co");
  });
});
