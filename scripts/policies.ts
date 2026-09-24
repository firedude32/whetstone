/**
 * Inspect the policy set.
 *   npm run policies                 table of toggles
 *   npm run policies -- --prompt     compiled system prompt with all default-on toggles
 *   npm run policies -- --prompt socratic plain-speech   ...with exactly these toggles
 */
import { loadPolicies, loadPromptFrame } from "../lib/policies/loader";
import { compileSystemPrompt } from "../lib/policies/compile";

const args = process.argv.slice(2);
const policies = loadPolicies();

if (args[0] === "--prompt") {
  const ids = args.length > 1 ? args.slice(1) : policies.filter((p) => p.default === "on").map((p) => p.id);
  console.log(compileSystemPrompt(policies, ids, loadPromptFrame()));
} else {
  console.table(
    policies.map((p) => ({
      id: p.id,
      default: p.default,
      enforcement: p.enforcement.join(", "),
      tests: p.tests.length,
      adversarial: p.tests.filter((t) => t.adversarial).length,
    })),
  );
}
