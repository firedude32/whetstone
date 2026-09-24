import { describe, it, expect } from "vitest";
import { loadPolicies, loadPromptFrame, parsePolicy } from "./loader";

const V1_IDS = [
  "attempt-first",
  "cite-or-abstain",
  "cooling-off",
  "daily-limit",
  "no-companionship",
  "no-ghostwriting",
  "no-personhood",
  "no-spiritual-authority",
  "plain-speech",
  "socratic",
];

describe("the real policies/ directory", () => {
  const policies = loadPolicies();

  it("loads exactly the ten v1 toggles, sorted by id", () => {
    expect(policies.map((p) => p.id)).toEqual(V1_IDS);
  });

  it("gives every classifier-enforced toggle a unique label", () => {
    const labels = policies.flatMap((p) => (p.classifier_label ? [p.classifier_label] : []));
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("has every toggle's prompt fragment free of exclamation points (brand rule)", () => {
    for (const p of policies) expect(p.promptFragment ?? "").not.toContain("!");
  });

  it("loads the base prompt and invariants", () => {
    const frame = loadPromptFrame();
    expect(frame.base).toMatch(/Whetstone/);
    expect(frame.invariants).toMatch(/988/);
  });
});

// A minimal valid file; each test below breaks one thing.
const tests = Array.from({ length: 6 }, (_, i) =>
  `  - input: "t${i}"\n    expect: enforced\n    adversarial: ${i < 3}`,
).join("\n");

function file(fm: string, body = "## System prompt fragment\nDo X.\n\n## Rationale\nBecause.") {
  return `---\n${fm}\ntests:\n${tests}\n---\n${body}`;
}

const GOOD = `id: demo\nname: Demo\nsummary: s\ndefault: "on"\nenforcement: [system_prompt]`;

describe("parsePolicy validation", () => {
  it("accepts a valid policy", () => {
    const p = parsePolicy(file(GOOD), "demo.md");
    expect(p.promptFragment).toBe("Do X.");
    expect(p.judgeCriteria).toBeNull();
  });

  it("accepts a bare YAML `on` (parsed as a string, not true)", () => {
    expect(() => parsePolicy(file(GOOD.replace('"on"', "on")), "demo.md")).not.toThrow();
  });

  it("rejects a boolean default", () => {
    expect(() => parsePolicy(file(GOOD.replace('"on"', "true")), "demo.md")).toThrow(/default/);
  });

  it("rejects a misspelled enforcement layer", () => {
    expect(() => parsePolicy(file(GOOD.replace("system_prompt", "system_promt")), "demo.md")).toThrow(
      /enforcement/,
    );
  });

  it("rejects unknown keys (typos)", () => {
    expect(() => parsePolicy(file(GOOD + "\nredirect_mesage: hi"), "demo.md")).toThrow(/redirect_mesage/);
  });

  it("requires classifier_label with input_classifier", () => {
    const fm = GOOD.replace("[system_prompt]", "[input_classifier, system_prompt]");
    expect(() => parsePolicy(file(fm), "demo.md")).toThrow(/classifier_label/);
  });

  it("requires redirect_message with on_block", () => {
    expect(() => parsePolicy(file(GOOD + "\non_block: redirect"), "demo.md")).toThrow(/redirect_message/);
  });

  it("requires the id to match the file name", () => {
    expect(() => parsePolicy(file(GOOD), "other.md")).toThrow(/must match file name/);
  });

  it("requires a judge section when output_judge is enforced", () => {
    const fm = GOOD.replace("[system_prompt]", "[output_judge, system_prompt]");
    expect(() => parsePolicy(file(fm), "demo.md")).toThrow(/Output judge criteria/);
  });

  it("requires enough adversarial tests", () => {
    const src = file(GOOD).replaceAll("adversarial: true", "adversarial: false");
    expect(() => parsePolicy(src, "demo.md")).toThrow(/adversarial/);
  });
});
