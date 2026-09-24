import { z } from "zod";
import { devUsage, getDeps } from "@/app/_server/deps";
import { runPipeline } from "@/lib/pipeline/pipeline";

const Body = z.object({
  message: z.string().trim().min(1).max(20_000),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(20_000) }))
    .max(50),
  enabledIds: z.array(z.string()).max(50),
  dailyLimit: z.number().int().min(1).max(500).optional(),
});

export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: z.prettifyError(parsed.error) }, { status: 400 });
  }
  const { message, history, enabledIds, dailyLimit } = parsed.data;

  let deps;
  try {
    deps = getDeps();
  } catch (e) {
    // Configuration problems (e.g. missing API key) are shown to the developer, never secret values.
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }

  const known = new Set(deps.policies.map((p) => p.id));
  const unknown = enabledIds.filter((id) => !known.has(id));
  if (unknown.length) return Response.json({ error: `Unknown toggles: ${unknown.join(", ")}` }, { status: 400 });

  const usage = devUsage();
  const result = await runPipeline(
    {
      message,
      history,
      enabledIds,
      config: dailyLimit ? { "daily-limit": { daily_limit: dailyLimit } } : undefined,
      messagesToday: usage.today(),
    },
    deps,
  );
  if (result.kind !== "limit") usage.increment();

  console.log(
    `[chat] ${result.kind}${result.toggleId ? ` (${result.toggleId})` : ""} labels=[${result.trace.labels}] ` +
      `violations=${result.trace.violations.length} cost=$${result.trace.costUsd.toFixed(5)} ${result.trace.latencyMs}ms` +
      (result.trace.error ? ` error=${result.trace.error}` : ""),
  );
  return Response.json({ ...result, messagesToday: usage.today() });
}
