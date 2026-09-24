/**
 * TEMPORARY STAND-INS for Ethan's unfinished exercises, so the app runs today.
 *
 * `lib/exercises.ts` calls the real implementation first and only falls back to these
 * while the real one still throws "not implemented". Once every TODO(ethan) exercise
 * passes its tests, delete this file and the fallback wrapper.
 *
 * Deliberately minimal: good enough to run, not the reference solution. Don't copy these.
 */
import type { Policy, PromptFrame } from "./policies/schema";
import type { PrecheckDecision, PrecheckOutcome } from "./pipeline/precheck";

export function compileSystemPromptStandin(policies: Policy[], enabledIds: string[], frame: PromptFrame): string {
  const known = new Set(policies.map((p) => p.id));
  const bad = enabledIds.find((id) => !known.has(id));
  if (bad) throw new Error(`unknown toggle id: ${bad}`);
  const blocks = policies
    .filter((p) => enabledIds.includes(p.id) && p.promptFragment)
    .map((p) => `## ${p.name}\n${p.promptFragment}`);
  return [frame.base, frame.invariants, ...blocks].join("\n\n");
}

export function requireEnvStandin(
  name: string,
  opts: { secret?: boolean; env?: Record<string, string | undefined> } = {},
): string {
  const v = (opts.env ?? process.env)[name]?.trim();
  if (!v) throw new Error(`Missing environment variable ${name}. Set it in .env.local.`);
  return v;
}

export function resolvePrecheckStandin(outcome: PrecheckOutcome, knownLabels: string[]): PrecheckDecision {
  if (!outcome.ok) return { mode: "failed", reason: outcome.error };
  if (outcome.data.crisis) return { mode: "crisis" };
  const labels = [...new Set(outcome.data.labels)].filter((l) => knownLabels.includes(l));
  return { mode: "normal", labels, taskHelp: outcome.data.task_help };
}
