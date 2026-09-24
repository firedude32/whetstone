import { describe, it, expect } from "vitest";
import type { z } from "zod";
import type { GenerateRequest, LLMProvider } from "../llm/types";
import { loadCrisisGuidance, loadPolicies, loadPromptFrame } from "../policies/loader";
import { runPipeline, type PipelineInput } from "./pipeline";

const policies = loadPolicies();
const frame = loadPromptFrame();
const crisisGuidance = loadCrisisGuidance();
const defaults = policies.filter((p) => p.default === "on").map((p) => p.id);

/** A scripted fake LLM: no network, no cost, fully deterministic. */
function fakeLLM(script: {
  precheck?: object | Error;
  replies?: string[];
  judgements?: object[];
}) {
  const replies = [...(script.replies ?? ["A plain answer."])];
  const judgements = [...(script.judgements ?? [])];
  const log = { generate: [] as GenerateRequest[], json: 0 };
  const llm: LLMProvider = {
    async generate(req) {
      log.generate.push(req);
      return { text: replies.shift() ?? "A plain answer.", usage: { model: req.model, inputTokens: 100, outputTokens: 50 } };
    },
    async generateJSON<T>(req: GenerateRequest & { schema: z.ZodType<T> }) {
      log.json++;
      const isPrecheck = req.system.includes("You classify messages");
      const value = isPrecheck
        ? (script.precheck ?? { crisis: false, labels: [], task_help: false, confidence: 1 })
        : (judgements.shift() ?? { violations: [] });
      if (value instanceof Error) throw value;
      return { data: req.schema.parse(value), usage: { model: req.model, inputTokens: 10, outputTokens: 5 } };
    },
  };
  return { llm, log };
}

function run(llm: LLMProvider, over: Partial<PipelineInput> = {}) {
  return runPipeline(
    { message: "What is a gerund?", history: [], enabledIds: defaults, messagesToday: 0, ...over },
    { llm, policies, frame, crisisGuidance, models: { main: "claude-sonnet-5", judge: "claude-haiku-4-5" } },
  );
}

describe("runPipeline", () => {
  it("answers a normal question", async () => {
    const { llm } = fakeLLM({});
    const r = await run(llm);
    expect(r.kind).toBe("reply");
    expect(r.trace.costUsd).toBeGreaterThan(0);
  });

  it("stops at the daily limit without calling any model, and includes 988", async () => {
    const { llm, log } = fakeLLM({});
    const r = await run(llm, { messagesToday: 20 });
    expect(r.kind).toBe("limit");
    expect(r.text).toContain("988");
    expect(log.json + log.generate.length).toBe(0);
  });

  it("respects a configured daily limit", async () => {
    const { llm } = fakeLLM({});
    const r = await run(llm, { messagesToday: 5, config: { "daily-limit": { daily_limit: 5 } } });
    expect(r.kind).toBe("limit");
  });

  it("fails closed when the pre-check errors, but still shows 988", async () => {
    const { llm, log } = fakeLLM({ precheck: new Error("boom") });
    const r = await run(llm);
    expect(r.kind).toBe("precheck_failed");
    expect(r.text).toContain("988");
    expect(log.generate).toHaveLength(0);
  });

  it("crisis mode bypasses companionship and spiritual-authority, and always includes 988", async () => {
    const { llm, log } = fakeLLM({
      precheck: { crisis: true, labels: ["companionship_request"], task_help: false, confidence: 1 },
      replies: ["Please reach someone you trust."],
    });
    const r = await run(llm);
    expect(r.kind).toBe("crisis");
    expect(r.text).toContain("988");
    expect(log.generate[0].system).not.toContain("## No companionship");
    expect(log.generate[0].system).toContain("## Crisis mode");
  });

  it("asks for an attempt on short task-help requests", async () => {
    const { llm, log } = fakeLLM({ precheck: { crisis: false, labels: [], task_help: true, confidence: 1 } });
    const r = await run(llm, { message: "Solve x^2 - 5x + 6 = 0" });
    expect(r.kind).toBe("attempt_required");
    expect(r.toggleId).toBe("attempt-first");
    expect(log.generate).toHaveLength(0);
  });

  it("lets task help through once the conversation contains an attempt", async () => {
    const { llm } = fakeLLM({ precheck: { crisis: false, labels: [], task_help: true, confidence: 1 } });
    const attempt = Array.from({ length: 45 }, (_, i) => `word${i}`).join(" ");
    const r = await run(llm, {
      message: "What about step two?",
      history: [
        { role: "user", content: attempt },
        { role: "assistant", content: "Good start." },
      ],
    });
    expect(r.kind).toBe("reply");
  });

  it("redirects on a classifier label for an enabled toggle", async () => {
    const { llm } = fakeLLM({
      precheck: { crisis: false, labels: ["ghostwriting_request"], task_help: false, confidence: 1 },
    });
    const r = await run(llm);
    expect(r.kind).toBe("redirect");
    expect(r.toggleId).toBe("no-ghostwriting");
  });

  it("ignores a label whose toggle is off", async () => {
    const { llm } = fakeLLM({
      precheck: { crisis: false, labels: ["ghostwriting_request"], task_help: false, confidence: 1 },
    });
    const r = await run(llm, { enabledIds: defaults.filter((id) => id !== "no-ghostwriting") });
    expect(r.kind).toBe("reply");
  });

  it("regenerates once on a violation, then succeeds", async () => {
    const { llm, log } = fakeLLM({
      replies: ["Great question!", "A plain answer."],
      judgements: [{ violations: [{ toggle_id: "plain-speech", reason: "exclamation point" }] }, { violations: [] }],
    });
    const r = await run(llm);
    expect(r.kind).toBe("reply");
    expect(r.text).toBe("A plain answer.");
    expect(r.trace.regenerated).toBe(true);
    expect(log.generate[1].system).toContain("## Correction");
  });

  it("falls back if the regeneration still violates", async () => {
    const bad = { violations: [{ toggle_id: "plain-speech", reason: "!" }] };
    const { llm } = fakeLLM({ judgements: [bad, bad] });
    const r = await run(llm);
    expect(r.kind).toBe("fallback");
  });

  it("ignores judge violations for toggles that are off", async () => {
    const { llm } = fakeLLM({ judgements: [{ violations: [{ toggle_id: "socratic", reason: "no question" }] }] });
    const r = await run(llm);
    expect(r.kind).toBe("reply");
    expect(r.trace.regenerated).toBe(false);
  });
});
