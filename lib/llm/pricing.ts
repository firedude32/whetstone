import type { Usage } from "./types";

/**
 * USD per million tokens. Verified against Anthropic's published pricing on 2026-09-24.
 * Thinking tokens are billed as output and are included in output_tokens.
 */
export const PRICES: Record<string, { input: number; output: number }> = {
  "claude-sonnet-5": { input: 2, output: 10 },
  "claude-haiku-4-5": { input: 1, output: 5 },
  "claude-opus-5": { input: 5, output: 25 },
};

/** Estimated cost of one call. Unknown models return NaN so a missing price is visible, not $0. */
export function costUsd(u: Usage): number {
  const p = PRICES[u.model];
  if (!p) return NaN;
  return (u.inputTokens * p.input + u.outputTokens * p.output) / 1_000_000;
}

export function totalCost(usages: Usage[]): number {
  return usages.reduce((sum, u) => sum + costUsd(u), 0);
}
