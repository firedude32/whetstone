import { describe, it, expect } from "vitest";
import { compileSystemPrompt } from "./compile";
import type { Policy, PromptFrame } from "./schema";

function policy(id: string, fragment: string | null): Policy {
  return {
    id,
    name: `Name of ${id}`,
    summary: "",
    default: "on",
    enforcement: fragment ? ["system_prompt"] : ["app_gate"],
    config: {},
    tests: [],
    promptFragment: fragment,
    judgeCriteria: null,
    rationale: "",
    file: `${id}.md`,
  };
}

const frame: PromptFrame = { base: "BASE", invariants: "INVARIANTS" };
const policies = [policy("alpha", "Do alpha."), policy("beta", "Do beta."), policy("gamma", null)];

describe("compileSystemPrompt", () => {
  it("with no toggles, is just base and invariants", () => {
    expect(compileSystemPrompt(policies, [], frame)).toBe("BASE\n\nINVARIANTS");
  });

  it("adds a headed block per enabled toggle", () => {
    expect(compileSystemPrompt(policies, ["alpha"], frame)).toBe(
      "BASE\n\nINVARIANTS\n\n## Name of alpha\nDo alpha.",
    );
  });

  it("orders blocks by the policies array, not enabledIds", () => {
    const a = compileSystemPrompt(policies, ["beta", "alpha"], frame);
    const b = compileSystemPrompt(policies, ["alpha", "beta"], frame);
    expect(a).toBe(b);
    expect(a.indexOf("Do alpha.")).toBeLessThan(a.indexOf("Do beta."));
  });

  it("skips enabled toggles with no prompt fragment", () => {
    expect(compileSystemPrompt(policies, ["gamma"], frame)).toBe("BASE\n\nINVARIANTS");
  });

  it("includes a duplicated id once", () => {
    const out = compileSystemPrompt(policies, ["alpha", "alpha"], frame);
    expect(out.match(/Do alpha\./g)).toHaveLength(1);
  });

  it("throws on an unknown id, naming it (fail closed)", () => {
    expect(() => compileSystemPrompt(policies, ["alpha", "no-ghostwritng"], frame)).toThrow(
      /no-ghostwritng/,
    );
  });

  it("always keeps the invariants even when every toggle is on", () => {
    const out = compileSystemPrompt(policies, ["alpha", "beta", "gamma"], frame);
    expect(out.startsWith("BASE\n\nINVARIANTS\n\n")).toBe(true);
  });
});
