/**
 * Read a required environment variable, failing fast if it's missing.
 *
 * Rules:
 * - Returns the value, trimmed of surrounding whitespace.
 * - Throws an Error if the variable is undefined, empty, or only whitespace.
 *   The message must include the variable's name (so the developer knows what to set)
 *   and must NOT include any value (it could be a secret).
 * - Throws if `name` starts with "NEXT_PUBLIC_" and `opts.secret` is true —
 *   a secret must never be exposed to the browser.
 *
 * @param name  the env var to read, e.g. "ANTHROPIC_API_KEY"
 * @param opts.secret  mark true for API keys / service-role keys
 * @param opts.env  the environment to read from (defaults to process.env; injectable for tests)
 */
export function requireEnv(
  name: string,
  opts: { secret?: boolean; env?: Record<string, string | undefined> } = {},
): string {
  // TODO(ethan): implement. Tests: lib/config/env.test.ts
  void name;
  void opts;
  throw new Error("not implemented");
}
