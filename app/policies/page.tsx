import type { Metadata } from "next";
import Link from "next/link";
import { loadCrisisGuidance, loadPolicies, loadPromptFrame } from "@/lib/policies/loader";

export const metadata: Metadata = { title: "Policies · Whetstone" };

const LAYER_NAME: Record<string, string> = {
  app_gate: "App code",
  input_classifier: "Input classifier",
  output_judge: "Output judge",
  system_prompt: "System prompt",
};

export default function PoliciesPage() {
  const policies = loadPolicies();
  const frame = loadPromptFrame();
  const crisis = loadCrisisGuidance();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12">
      <p className="text-sm">
        <Link href="/" className="text-ink-2 underline underline-offset-4">
          ← Back to chat
        </Link>
      </p>
      <h1 className="mt-6 font-display text-4xl">Policies</h1>
      <p className="mt-4 text-ink-2">
        Every instruction Whetstone gives the AI is on this page, word for word. These are the same files the app
        reads, so this page cannot drift from what actually runs.
      </p>

      <section className="mt-12">
        <h2 className="font-display text-2xl">Always on</h2>
        <h3 className="mt-6 font-semibold">Base prompt</h3>
        <Prompt text={frame.base} />
        <h3 className="mt-6 font-semibold">Safety invariants</h3>
        <p className="mt-1 text-sm text-ink-2">No toggle, setting, or account can override these.</p>
        <Prompt text={frame.invariants} />
        <h3 className="mt-6 font-semibold">Crisis mode</h3>
        <Prompt text={crisis} />
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl">Toggles</h2>
        {policies.map((p) => (
          <article key={p.id} id={p.id} className="mt-10 scroll-mt-8 border-t border-rule pt-8">
            <h3 className="font-display text-xl">{p.name}</h3>
            <p className="mt-1 text-ink-2">{p.summary}</p>
            <p className="mt-3 text-xs uppercase tracking-[0.12em] text-ink-2">
              Enforced by: {p.enforcement.map((l) => LAYER_NAME[l]).join(" · ")} · Default {p.default}
            </p>
            <p className="mt-4">{p.rationale}</p>
            {p.redirect_message && (
              <>
                <h4 className="mt-5 text-sm font-semibold">What you see when it applies</h4>
                <Prompt text={p.redirect_message.trim()} />
              </>
            )}
            {p.promptFragment && (
              <>
                <h4 className="mt-5 text-sm font-semibold">Instruction given to the AI</h4>
                <Prompt text={p.promptFragment} />
              </>
            )}
            {p.classifierDefinition && (
              <>
                <h4 className="mt-5 text-sm font-semibold">What the input classifier looks for</h4>
                <Prompt text={p.classifierDefinition} />
              </>
            )}
            {p.judgeCriteria && (
              <>
                <h4 className="mt-5 text-sm font-semibold">What the output judge checks</h4>
                <Prompt text={p.judgeCriteria} />
              </>
            )}
          </article>
        ))}
      </section>
    </main>
  );
}

function Prompt({ text }: { text: string }) {
  return (
    <blockquote className="mt-2 whitespace-pre-wrap border-l-2 border-rule bg-paper-2 px-4 py-3 text-sm">
      {text}
    </blockquote>
  );
}
