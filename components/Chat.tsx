"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { PipelineResult, ResultKind } from "@/lib/pipeline/pipeline";

export type PolicySummary = {
  id: string;
  name: string;
  summary: string;
  defaultOn: boolean;
  enforcement: string[];
  dailyLimit?: number;
  minWords?: number;
};

type Entry =
  | { role: "user"; content: string }
  | { role: "assistant"; content: string; kind: ResultKind; toggleId?: string; trace?: PipelineResult["trace"] }
  | { role: "error"; content: string };

const STORAGE_KEY = "whetstone.settings.v1";
const BLOCK_KINDS: ResultKind[] = ["limit", "attempt_required", "redirect", "precheck_failed", "fallback"];

const KIND_LABEL: Partial<Record<ResultKind, string>> = {
  limit: "Daily limit",
  attempt_required: "Attempt first",
  redirect: "Redirected",
  precheck_failed: "Not checked",
  fallback: "Withheld",
  crisis: "Support",
};

export default function Chat({ policies }: { policies: PolicySummary[] }) {
  const byId = Object.fromEntries(policies.map((p) => [p.id, p]));
  const defaultLimit = byId["daily-limit"]?.dailyLimit ?? 20;

  const [enabled, setEnabled] = useState<string[]>(() => policies.filter((p) => p.defaultOn).map((p) => p.id));
  const [dailyLimit, setDailyLimit] = useState(defaultLimit);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [usedToday, setUsedToday] = useState<number | null>(null);
  const [sessionCost, setSessionCost] = useState(0);
  const endRef = useRef<HTMLDivElement>(null);

  // Restore settings saved in this browser (a convenience; real settings live server-side in Phase 5).
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
      if (saved && Array.isArray(saved.enabled)) {
        setEnabled(saved.enabled.filter((id: string) => byId[id]));
        if (typeof saved.dailyLimit === "number") setDailyLimit(saved.dailyLimit);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ enabled, dailyLimit }));
    } catch {}
  }, [enabled, dailyLimit]);

  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [entries, pending]);

  const toggle = (id: string) =>
    setEnabled((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  async function send() {
    const message = draft.trim();
    if (!message || pending) return;
    const history = entries.flatMap((e) =>
      e.role === "user" || e.role === "assistant" ? [{ role: e.role, content: e.content }] : [],
    );
    setEntries((cur) => [...cur, { role: "user", content: message }]);
    setDraft("");
    setPending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history, enabledIds: enabled, dailyLimit }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      const r = data as PipelineResult & { messagesToday: number };
      setEntries((cur) => [
        ...cur,
        { role: "assistant", content: r.text, kind: r.kind, toggleId: r.toggleId, trace: r.trace },
      ]);
      setUsedToday(r.messagesToday);
      setSessionCost((c) => c + (r.trace.costUsd || 0));
    } catch (e) {
      setEntries((cur) => [...cur, { role: "error", content: (e as Error).message }]);
    } finally {
      setPending(false);
    }
  }

  const words = draft.trim().split(/\s+/).filter(Boolean).length;
  const minWords = byId["attempt-first"]?.minWords ?? 40;
  const activePolicies = policies.filter((p) => enabled.includes(p.id));

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-rule">
        <div className="mx-auto flex max-w-3xl items-baseline justify-between px-4 py-4">
          <h1 className="font-display text-2xl tracking-wide">Whetstone</h1>
          <nav className="flex gap-5 text-sm text-ink-2">
            <Link href="/policies" className="underline-offset-4 hover:underline">
              Policies
            </Link>
            <button
              onClick={() => setSettingsOpen((o) => !o)}
              aria-expanded={settingsOpen}
              aria-controls="settings"
              className="underline-offset-4 hover:underline"
            >
              Settings
            </button>
          </nav>
        </div>
      </header>

      {settingsOpen && (
        <section id="settings" aria-label="Settings" className="border-b border-rule bg-paper-2">
          <div className="mx-auto max-w-3xl px-4 py-6">
            <p className="mb-5 text-sm text-ink-2">
              Development build. Settings are stored in this browser and apply immediately. Accounts, locking,
              and the 24-hour cooling-off delay arrive with sign-in.
            </p>
            <ul className="grid gap-4 sm:grid-cols-2">
              {policies.map((p) => (
                <li key={p.id} className="flex gap-3">
                  <input
                    id={`t-${p.id}`}
                    type="checkbox"
                    role="switch"
                    checked={enabled.includes(p.id)}
                    onChange={() => toggle(p.id)}
                    className="mt-1 h-4 w-4 accent-[var(--rubric)]"
                  />
                  <label htmlFor={`t-${p.id}`} className="text-sm">
                    <span className="font-semibold">{p.name}</span>
                    <span className="block text-ink-2">{p.summary}</span>
                    {p.id === "daily-limit" && (
                      <span className="mt-2 flex items-center gap-2 text-ink-2">
                        Messages per day
                        <input
                          type="number"
                          min={1}
                          max={500}
                          value={dailyLimit}
                          onChange={(e) => setDailyLimit(Math.max(1, Number(e.target.value) || 1))}
                          className="w-16 border border-rule bg-paper px-1 py-0.5 text-ink"
                        />
                      </span>
                    )}
                  </label>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        {entries.length === 0 && (
          <div className="mx-auto max-w-xl py-16 text-center text-ink-2">
            <p className="font-display text-xl text-ink">AI that sharpens you instead of thinking for you.</p>
            <p className="mt-3 text-sm">Bring what you have already tried. Leave when you are ready to think.</p>
          </div>
        )}

        <ol className="space-y-8">
          {entries.map((e, i) => (
            <li key={i}>
              {e.role === "user" && (
                <div>
                  <p className="mb-1 text-xs uppercase tracking-[0.15em] text-ink-2">You</p>
                  <p className="whitespace-pre-wrap">{e.content}</p>
                </div>
              )}
              {e.role === "error" && (
                <p role="alert" className="border-l-2 border-rubric pl-4 text-sm text-rubric">
                  Error: {e.content}
                </p>
              )}
              {e.role === "assistant" && <AssistantEntry entry={e} policyName={e.toggleId ? byId[e.toggleId]?.name : undefined} />}
            </li>
          ))}
          {pending && (
            <li aria-live="polite" className="text-sm italic text-ink-2">
              Checking against your settings…
            </li>
          )}
        </ol>
        <div ref={endRef} />
      </main>

      <footer className="sticky bottom-0 border-t border-rule bg-paper">
        <div className="mx-auto max-w-3xl px-4 py-3">
          {activePolicies.length > 0 && (
            <ul aria-label="Active toggles" className="mb-2 flex flex-wrap gap-1.5">
              {activePolicies.map((p) => (
                <li key={p.id} className="border border-rule px-1.5 py-0.5 text-[11px] text-ink-2">
                  {p.name}
                </li>
              ))}
            </ul>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex items-end gap-3"
          >
            <label htmlFor="msg" className="sr-only">
              Message
            </label>
            <textarea
              id="msg"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={3}
              placeholder="Write your question, and what you have tried."
              className="flex-1 resize-y border border-rule bg-paper-2 px-3 py-2 placeholder:text-ink-2/70"
            />
            <button
              type="submit"
              disabled={pending || !draft.trim()}
              className="border border-ink px-4 py-2 text-sm disabled:opacity-40"
            >
              Send
            </button>
          </form>
          <p className="mt-2 flex justify-between text-[11px] text-ink-2">
            <span>
              {enabled.includes("attempt-first") && `${words} words · task help needs ${minWords}`}
            </span>
            <span>
              {usedToday !== null && enabled.includes("daily-limit") && `${usedToday} / ${dailyLimit} today · `}
              session cost ${sessionCost.toFixed(4)}
            </span>
          </p>
        </div>
      </footer>
    </div>
  );
}

function AssistantEntry({
  entry,
  policyName,
}: {
  entry: Extract<Entry, { role: "assistant" }>;
  policyName?: string;
}) {
  const blocked = BLOCK_KINDS.includes(entry.kind);
  const label = KIND_LABEL[entry.kind];
  return (
    <div className={blocked ? "border-l-2 border-rubric bg-paper-2 py-3 pl-4 pr-3" : ""}>
      <p className="mb-1 text-xs uppercase tracking-[0.15em] text-ink-2">
        Whetstone
        {label && (
          <span className="text-rubric">
            {" "}
            · {label}
            {policyName && ` · ${policyName}`}
          </span>
        )}
      </p>
      <p className={`whitespace-pre-wrap ${blocked ? "italic" : ""}`}>{entry.content}</p>
      <div className="mt-2 flex gap-4 text-xs text-ink-2">
        {entry.toggleId && (
          <Link href={`/policies#${entry.toggleId}`} className="underline underline-offset-4">
            Why?
          </Link>
        )}
        {entry.trace && (
          <details>
            <summary className="cursor-pointer select-none">Inspect</summary>
            <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 font-mono text-[11px]">
              <dt>result</dt>
              <dd>{entry.kind}</dd>
              <dt>crisis</dt>
              <dd>{String(entry.trace.crisis)}</dd>
              <dt>labels</dt>
              <dd>{entry.trace.labels.join(", ") || "none"}</dd>
              <dt>task help</dt>
              <dd>{String(entry.trace.taskHelp)}</dd>
              <dt>violations</dt>
              <dd>
                {entry.trace.violations.length === 0
                  ? "none"
                  : entry.trace.violations.map((v) => `${v.toggle_id}: ${v.reason}`).join(" | ")}
              </dd>
              <dt>regenerated</dt>
              <dd>{String(entry.trace.regenerated)}</dd>
              <dt>calls</dt>
              <dd>
                {entry.trace.calls.map((c) => `${c.model} ${c.inputTokens}→${c.outputTokens}`).join(", ") || "none"}
              </dd>
              <dt>cost</dt>
              <dd>${entry.trace.costUsd.toFixed(5)}</dd>
              <dt>latency</dt>
              <dd>{(entry.trace.latencyMs / 1000).toFixed(1)}s</dd>
              {entry.trace.error && (
                <>
                  <dt>error</dt>
                  <dd>{entry.trace.error}</dd>
                </>
              )}
            </dl>
          </details>
        )}
      </div>
    </div>
  );
}
