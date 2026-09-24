import type { ChatTurn, LLMProvider, Usage } from "../llm/types";
import { totalCost } from "../llm/pricing";
import type { Policy, PromptFrame } from "../policies/schema";
import { compileSystemPrompt, resolvePrecheck } from "../exercises";
import { PrecheckSchema, precheckSystemPrompt, precheckUserContent, type PrecheckOutcome } from "./precheck";
import { JudgeSchema, judgeSystemPrompt, judgeUserContent, type Violation } from "./judge";

export const CRISIS_FOOTER =
  "If you are struggling or in danger: call or text 988 (Suicide & Crisis Lifeline, US), or call 911 in an emergency.";

/** Turns of history sent to the main model. Older turns are dropped (a running summary comes later). */
export const HISTORY_TURNS = 10;

/** Toggles relaxed in crisis mode (spec §4). */
const CRISIS_BYPASS = new Set(["no-companionship", "no-spiritual-authority"]);

export type PipelineDeps = {
  llm: LLMProvider;
  policies: Policy[];
  frame: PromptFrame;
  crisisGuidance: string;
  models: { main: string; judge: string };
};

export type PipelineInput = {
  message: string;
  history: ChatTurn[];
  enabledIds: string[];
  /** Overrides policy config, e.g. { "daily-limit": { daily_limit: 10 } }. */
  config?: Record<string, Record<string, number>>;
  messagesToday: number;
};

export type ResultKind =
  | "reply" // normal generated answer
  | "crisis" // crisis-mode answer
  | "limit" // daily limit reached, no LLM call
  | "attempt_required" // attempt-first gate
  | "redirect" // a classifier toggle blocked it
  | "precheck_failed" // couldn't classify → fail closed
  | "fallback"; // judge failed or violations persisted after one retry

export type PipelineResult = {
  kind: ResultKind;
  text: string;
  /** The toggle responsible for a limit / attempt / redirect result. */
  toggleId?: string;
  trace: {
    crisis: boolean;
    labels: string[];
    taskHelp: boolean | null;
    violations: Violation[];
    regenerated: boolean;
    error?: string;
    calls: Usage[];
    costUsd: number;
    latencyMs: number;
  };
};

const FALLBACK_TEXT =
  "I couldn't produce a response that fits your settings, so I'm not showing one. Try rephrasing, or work on this step yourself first.";

export async function runPipeline(input: PipelineInput, deps: PipelineDeps): Promise<PipelineResult> {
  const started = Date.now();
  const calls: Usage[] = [];
  const trace: PipelineResult["trace"] = {
    crisis: false,
    labels: [],
    taskHelp: null,
    violations: [],
    regenerated: false,
    calls,
    costUsd: 0,
    latencyMs: 0,
  };
  const done = (kind: ResultKind, text: string, toggleId?: string): PipelineResult => {
    trace.costUsd = totalCost(calls);
    trace.latencyMs = Date.now() - started;
    return { kind, text, toggleId, trace };
  };

  const enabled = deps.policies.filter((p) => input.enabledIds.includes(p.id));
  const isOn = (id: string) => enabled.some((p) => p.id === id);
  const policy = (id: string) => deps.policies.find((p) => p.id === id)!;
  const cfg = (id: string, key: string) => {
    const v = input.config?.[id]?.[key] ?? policy(id).config[key];
    return typeof v === "number" ? v : Number(v);
  };

  // 1. Hard limits — code only, no LLM call. The message carries crisis resources (invariant 1).
  if (isOn("daily-limit") && input.messagesToday >= cfg("daily-limit", "daily_limit")) {
    return done("limit", policy("daily-limit").redirect_message!.trim(), "daily-limit");
  }

  // 2 + 3. Pre-check: crisis + classifier in one judge call (DECISIONS D2).
  let outcome: PrecheckOutcome;
  try {
    const { data, usage } = await deps.llm.generateJSON({
      model: deps.models.judge,
      system: precheckSystemPrompt(deps.policies),
      messages: [{ role: "user", content: precheckUserContent(input.history, input.message) }],
      maxTokens: 512,
      schema: PrecheckSchema,
    });
    calls.push(usage);
    outcome = { ok: true, data };
  } catch (e) {
    outcome = { ok: false, error: (e as Error).message };
  }

  const knownLabels = deps.policies.flatMap((p) => (p.classifier_label ? [p.classifier_label] : []));
  const decision = resolvePrecheck(outcome, knownLabels);
  const history = input.history.slice(-HISTORY_TURNS);

  if (decision.mode === "failed") {
    // Fail closed for restrictions (don't generate), fail open for crisis (always show help).
    trace.error = decision.reason;
    return done(
      "precheck_failed",
      `I couldn't check your message against your settings, so I haven't answered it. Please try again in a moment.\n\n${CRISIS_FOOTER}`,
    );
  }

  if (decision.mode === "crisis") {
    trace.crisis = true;
    const ids = input.enabledIds.filter((id) => !CRISIS_BYPASS.has(id));
    const system = `${compileSystemPrompt(deps.policies, ids, deps.frame)}\n\n## Crisis mode\n${deps.crisisGuidance}`;
    try {
      const { text, usage } = await deps.llm.generate({
        model: deps.models.main,
        system,
        messages: [...history, { role: "user", content: input.message }],
        maxTokens: 1024,
      });
      calls.push(usage);
      // The output judge is skipped: a restriction must never replace a crisis reply with a fallback.
      return done("crisis", text.includes("988") ? text : `${text}\n\n${CRISIS_FOOTER}`);
    } catch (e) {
      trace.error = (e as Error).message;
      return done("crisis", `I'm not able to respond properly right now. Please reach a person today.\n\n${CRISIS_FOOTER}`);
    }
  }

  trace.labels = decision.labels;
  trace.taskHelp = decision.taskHelp;

  // 4. Block / redirect on classifier labels for enabled toggles. Runs before the attempt
  //    gate: a hard "no" must not be answered with "try first, then I'll help" (DECISIONS D23).
  const blocking = enabled.find((p) => p.classifier_label && decision.labels.includes(p.classifier_label));
  if (blocking) return done("redirect", blocking.redirect_message!.trim(), blocking.id);

  // 5. Attempt gate — code only. An attempt anywhere earlier in the conversation counts.
  if (isOn("attempt-first") && decision.taskHelp) {
    const min = cfg("attempt-first", "min_words");
    const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
    const attempted = [input.message, ...history.filter((t) => t.role === "user").map((t) => t.content)].some(
      (m) => words(m) >= min,
    );
    if (!attempted) return done("attempt_required", policy("attempt-first").redirect_message!.trim(), "attempt-first");
  }

  // 6. Build the system prompt.
  const system = compileSystemPrompt(deps.policies, input.enabledIds, deps.frame);
  const judged = enabled.filter((p) => p.judgeCriteria);

  const generate = async (extra = "") => {
    const { text, usage } = await deps.llm.generate({
      model: deps.models.main,
      system: system + extra,
      messages: [...history, { role: "user", content: input.message }],
      maxTokens: 4096,
    });
    calls.push(usage);
    return text;
  };

  const judge = async (draft: string): Promise<Violation[]> => {
    if (judged.length === 0) return [];
    const { data, usage } = await deps.llm.generateJSON({
      model: deps.models.judge,
      system: judgeSystemPrompt(judged),
      messages: [{ role: "user", content: judgeUserContent(input.message, draft) }],
      maxTokens: 1024,
      schema: JudgeSchema,
    });
    calls.push(usage);
    const ids = new Set(judged.map((p) => p.id));
    return data.violations.filter((v) => ids.has(v.toggle_id));
  };

  try {
    // 7. Generate (buffered, so it can be judged before the user sees it).
    let draft = await generate();

    // 8. Output judge.
    let violations = await judge(draft);
    trace.violations = violations;

    // 9. One regeneration with the judge's feedback, then a safe fallback.
    if (violations.length > 0) {
      trace.regenerated = true;
      const feedback = violations.map((v) => `- ${v.toggle_id}: ${v.reason}`).join("\n");
      draft = await generate(
        `\n\n## Correction\nA previous draft of your reply broke these restrictions:\n${feedback}\nWrite a new reply that follows every restriction.`,
      );
      violations = await judge(draft);
      trace.violations = [...trace.violations, ...violations];
      if (violations.length > 0) return done("fallback", FALLBACK_TEXT);
    }

    return done("reply", draft);
  } catch (e) {
    // Generation or judge failed → fail closed.
    trace.error = (e as Error).message;
    return done("fallback", "Something went wrong checking this response, so I'm not showing it. Please try again.");
  }
}
