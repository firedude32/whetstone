/**
 * The pipeline in the terminal — same code the web app runs.
 *   npm run chat
 *   npm run chat -- --on socratic --off attempt-first,daily-limit --limit 5
 * Reads ANTHROPIC_API_KEY (and MODEL_MAIN / MODEL_JUDGE) from .env.local.
 */
import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { AnthropicProvider } from "../lib/llm/anthropic";
import { loadCrisisGuidance, loadPolicies, loadPromptFrame } from "../lib/policies/loader";
import { requireEnv } from "../lib/exercises";
import { runPipeline } from "../lib/pipeline/pipeline";
import type { ChatTurn } from "../lib/llm/types";

try {
  process.loadEnvFile(".env.local");
} catch {
  // fall through: requireEnv will explain what's missing
}

const args = process.argv.slice(2);
const flag = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const list = (s?: string) => (s ? s.split(",").map((x) => x.trim()) : []);

const policies = loadPolicies();
const on = new Set(policies.filter((p) => p.default === "on").map((p) => p.id));
list(flag("on")).forEach((id) => on.add(id));
list(flag("off")).forEach((id) => on.delete(id));
const limit = flag("limit") ? Number(flag("limit")) : undefined;

const deps = {
  llm: new AnthropicProvider(requireEnv("ANTHROPIC_API_KEY", { secret: true })),
  policies,
  frame: loadPromptFrame(),
  crisisGuidance: loadCrisisGuidance(),
  models: {
    main: process.env.MODEL_MAIN || "claude-sonnet-5",
    judge: process.env.MODEL_JUDGE || "claude-haiku-4-5",
  },
};

console.log(`Toggles on: ${[...on].join(", ") || "none"}\nType a message. Ctrl+C to quit.\n`);

async function main() {
  const rl = readline.createInterface({ input: stdin, output: stdout });
  const history: ChatTurn[] = [];
  let sent = 0;
  let cost = 0;

  while (true) {
    const message = (await rl.question("you > ")).trim();
    if (!message) continue;
    const r = await runPipeline(
      {
        message,
        history,
        enabledIds: [...on],
        config: limit ? { "daily-limit": { daily_limit: limit } } : undefined,
        messagesToday: sent,
      },
      deps,
    );
    if (r.kind !== "limit") sent++;
    cost += r.trace.costUsd;
    history.push({ role: "user", content: message }, { role: "assistant", content: r.text });

    const tag = r.kind === "reply" ? "" : ` [${r.kind}${r.toggleId ? `: ${r.toggleId}` : ""}]`;
    console.log(`\nwhetstone${tag} > ${r.text}\n`);
    console.log(
      `  labels=[${r.trace.labels}] violations=${r.trace.violations.length} regenerated=${r.trace.regenerated} ` +
        `$${r.trace.costUsd.toFixed(5)} (session $${cost.toFixed(4)}) ${(r.trace.latencyMs / 1000).toFixed(1)}s\n`,
    );
}
}

main();
