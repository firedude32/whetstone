import { z } from "zod";

/** Where a toggle is enforced, strongest first. See docs/ARCHITECTURE.md. */
export const EnforcementLayer = z.enum(["app_gate", "input_classifier", "output_judge", "system_prompt"]);
export type EnforcementLayer = z.infer<typeof EnforcementLayer>;

export const PolicyTest = z.object({
  input: z.string().min(1),
  /** enforced = the toggle should kick in (redirect, or output shaped by it). See DECISIONS D4. */
  expect: z.enum(["enforced", "not_enforced"]),
  adversarial: z.boolean().default(false),
  /** Prior turns, for multi-turn escalation tests. */
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() }))
    .default([]),
  /** App state the test needs, e.g. messages already sent today. */
  context: z.object({ messages_today: z.number().int().min(0).optional() }).default({}),
  note: z.string().optional(),
});
export type PolicyTest = z.infer<typeof PolicyTest>;

export const MIN_TESTS = 6;
export const MIN_ADVERSARIAL = 3;

export const PolicyFrontmatter = z
  .object({
    id: z.string().regex(/^[a-z][a-z0-9-]*$/, "id must be kebab-case"),
    name: z.string().min(1),
    summary: z.string().min(1),
    // Strings, not booleans: YAML 1.1 parsers read a bare `on` as true (the "Norway problem").
    default: z.enum(["on", "off"]),
    enforcement: z.array(EnforcementLayer).min(1),
    classifier_label: z.string().regex(/^[a-z_]+$/).optional(),
    on_block: z.enum(["redirect", "refuse", "require_attempt"]).optional(),
    redirect_message: z.string().min(1).optional(),
    /** Toggle-specific settings, e.g. { daily_limit: 20 }. */
    config: z.record(z.string(), z.union([z.number(), z.string(), z.boolean()])).default({}),
    tests: z.array(PolicyTest),
  })
  .strict() // unknown keys (typos) are errors, not silently ignored
  .superRefine((p, ctx) => {
    const has = (l: EnforcementLayer) => p.enforcement.includes(l);
    if (has("input_classifier") && !p.classifier_label) {
      ctx.addIssue({ code: "custom", path: ["classifier_label"], message: "required when enforcement includes input_classifier" });
    }
    if (p.classifier_label && !has("input_classifier")) {
      ctx.addIssue({ code: "custom", path: ["classifier_label"], message: "only allowed with input_classifier enforcement" });
    }
    if (p.on_block && !p.redirect_message) {
      ctx.addIssue({ code: "custom", path: ["redirect_message"], message: "required when on_block is set" });
    }
    if (p.tests.length < MIN_TESTS) {
      ctx.addIssue({ code: "custom", path: ["tests"], message: `need at least ${MIN_TESTS} tests, found ${p.tests.length}` });
    }
    const adv = p.tests.filter((t) => t.adversarial).length;
    if (adv < MIN_ADVERSARIAL) {
      ctx.addIssue({ code: "custom", path: ["tests"], message: `need at least ${MIN_ADVERSARIAL} adversarial tests, found ${adv}` });
    }
  });
export type PolicyFrontmatter = z.infer<typeof PolicyFrontmatter>;

/** Body sections, by the heading text used in the Markdown files. */
export const SECTION = {
  prompt: "System prompt fragment",
  judge: "Output judge criteria",
  rationale: "Rationale",
} as const;

export type Policy = PolicyFrontmatter & {
  /** Text injected into the system prompt, if enforcement includes system_prompt. */
  promptFragment: string | null;
  /** What the output judge checks for, if enforcement includes output_judge. */
  judgeCriteria: string | null;
  rationale: string;
  /** Source file, for error messages and /policies. */
  file: string;
};

/** The always-on parts of the system prompt that aren't toggles. */
export type PromptFrame = {
  /** policies/_base.md — identity and voice. */
  base: string;
  /** policies/_invariants.md "System prompt fragment" — safety rules no toggle overrides. */
  invariants: string;
};
