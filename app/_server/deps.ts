import "server-only"; // build fails if a client component ever imports this file
import { AnthropicProvider } from "@/lib/llm/anthropic";
import { loadCrisisGuidance, loadPolicies, loadPromptFrame } from "@/lib/policies/loader";
import { requireEnv } from "@/lib/exercises";
import type { PipelineDeps } from "@/lib/pipeline/pipeline";

let cached: PipelineDeps | null = null;

/** Build pipeline dependencies once per server process. */
export function getDeps(): PipelineDeps {
  if (cached) return cached;
  cached = {
    llm: new AnthropicProvider(requireEnv("ANTHROPIC_API_KEY", { secret: true })),
    policies: loadPolicies(),
    frame: loadPromptFrame(),
    crisisGuidance: loadCrisisGuidance(),
    models: {
      main: process.env.MODEL_MAIN || "claude-sonnet-5",
      judge: process.env.MODEL_JUDGE || "claude-haiku-4-5",
    },
  };
  return cached;
}

/**
 * DEV ONLY: messages sent today, counted in this server process's memory.
 * Resets on restart and is shared by everyone hitting this server.
 * Replaced by the usage_daily table in Phase 4/6.
 */
const counts = new Map<string, number>();
export function devUsage() {
  const day = new Date().toISOString().slice(0, 10);
  return {
    today: () => counts.get(day) ?? 0,
    increment: () => counts.set(day, (counts.get(day) ?? 0) + 1),
  };
}
