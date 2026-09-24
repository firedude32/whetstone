import type { Policy, PromptFrame } from "./schema";

/**
 * Build the system prompt from the always-on frame plus the enabled toggles.
 *
 * Required behavior (see compile.test.ts):
 * 1. Output starts with `frame.base`, then `frame.invariants`, then one block per
 *    enabled toggle that has a `promptFragment`. Blocks are separated by a blank line.
 * 2. Each toggle block is `## <policy.name>` on its own line, then its fragment.
 * 3. Toggle blocks appear in the order of the `policies` array, NOT the order of
 *    `enabledIds`. Same inputs must always give a byte-identical string.
 *    (Why: stable prompts are cacheable by the provider and diffable in logs.)
 * 4. Enabled toggles with `promptFragment === null` (e.g. daily-limit) add nothing.
 * 5. Duplicate ids in `enabledIds` are harmless — each toggle appears at most once.
 * 6. An id in `enabledIds` that matches no policy THROWS, naming the id.
 *    (Fail closed: a typo must not silently turn a restriction off.)
 *
 * @param policies all loaded policies (as returned by loadPolicies, sorted by id)
 * @param enabledIds ids of toggles that are on for this user
 * @param frame base prompt and invariants, always included
 */
export function compileSystemPrompt(
  policies: Policy[],
  enabledIds: string[],
  frame: PromptFrame,
): string {
  // TODO(ethan): implement. Tests: lib/policies/compile.test.ts
  void policies;
  void enabledIds;
  void frame;
  throw new Error("not implemented");
}
