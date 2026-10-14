import { Cormorant_Garamond, Instrument_Sans, JetBrains_Mono } from "next/font/google";
import { loadPolicies } from "@/lib/policies/loader";
import Landing, { type PolicyFile } from "@/components/Landing";

// Fonts for the homepage only; the chat and policy pages keep the root layout's fonts.
const display = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
});
const sans = Instrument_Sans({ variable: "--font-instrument", subsets: ["latin"] });
const mono = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"] });

const SHOWCASE = ["no-ghostwriting", "attempt-first", "socratic"];

export default function HomePage() {
  // Runs on the server: the policy tabs show the real files, not marketing copy.
  const policies = loadPolicies();
  const files: PolicyFile[] = SHOWCASE.flatMap((id) => {
    const p = policies.find((x) => x.id === id);
    if (!p) return [];
    const text = [
      "---",
      `id: ${p.id}`,
      `name: ${p.name}`,
      `default: ${p.default}`,
      `enforcement: [${p.enforcement.join(", ")}]`,
      "---",
      "",
      "## System prompt fragment",
      p.promptFragment ?? "(enforced in app code, not the prompt)",
    ].join("\n");
    return [{ file: `${p.id}.md`, text }];
  });
  const tests = policies.flatMap((p) => p.tests);

  return (
    <Landing
      fontClass={`${display.variable} ${sans.variable} ${mono.variable}`}
      policyFiles={files}
      testCount={tests.length}
      adversarialCount={tests.filter((t) => t.adversarial).length}
    />
  );
}
