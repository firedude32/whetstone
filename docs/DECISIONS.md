# Decisions

One entry per architectural decision. Newest at the bottom.

---

### D1 — Framework-free core (2026-09-24)
**Decision:** Policies, pipeline, and LLM providers live in `lib/` and never import Next.js. CLI, evals, and web are thin adapters.
**Alternatives:** Logic inside Next.js route handlers; a monorepo with packages; a separate Python service.
**Why:** The eval harness and CLI must run the *real* pipeline without a web server. A monorepo is overhead for one developer, and Python would mean two languages and two deploys.

### D2 — Merge crisis check and input classifier into one call (2026-09-24)
**Decision:** One judge call returns `{crisis, labels, task_help, confidence}`.
**Alternatives:** Two separate calls, as in the original spec.
**Why:** It halves pre-generation latency and cost. Fail-open vs fail-closed is still applied per field, so the safety semantics are unchanged.

### D3 — Crisis fail-safe "middle ground" (2026-09-24)
**Decision:** If the pre-check errors, don't enter full crisis mode. Instead, relax the companionship and spiritual-authority toggles for that message and append a short resources footer (988). Restriction toggles still fail closed.
**Alternatives:** Treat every error as a crisis (spec original); ignore errors.
**Why:** Treating every error as a crisis turns an API outage into crisis messages on every reply, which teaches users to ignore them. The middle ground keeps the invariant that no restriction stands between someone and help.

### D4 — Test expectations: `enforced` / `not_enforced` (2026-09-24)
**Decision:** Each policy test says whether the toggle *should kick in*. "Enforced" passes if the pipeline redirected **or** a separate grader prompt confirms the output followed the toggle.
**Alternatives:** `blocked` / `allowed` only.
**Why:** Shape-changing toggles (socratic, plain-speech, no-personhood, cite-or-abstain) never block, so `blocked` can't measure them. The grader is a different prompt from the pipeline's judge, so the pipeline isn't grading its own work.

### D5 — attempt-first uses a word floor only (2026-09-24)
**Decision:** 40-word minimum, with no check of attempt quality.
**Alternatives:** Also have the classifier judge whether the attempt is genuine.
**Why:** Simplicity for v1. Known weakness: filler text passes. Revisit if evals or users show it being gamed.

### D6 — Guardian mode deferred (2026-09-24)
**Decision:** No `guardian_links`, no `locked_by_user_id`, no `/guardian` in v1.
**Why:** It narrows scope. Cooling-off still works as a self-imposed commitment device.

### D7 — v1 is 18+ (2026-09-24)
**Decision:** Age attestation at signup requires 18+.
**Alternatives:** 13+ as originally specified.
**Why:** With guardian mode deferred, serving minors would add COPPA and provider-policy obligations with no oversight tooling. Revisit alongside guardian mode.

### D8 — Cooling-off rules (2026-09-24)
**Decision:**
- Turning cooling-off off is itself a loosening, so it waits 24h.
- Raising `daily_limit` is a loosening.
- Tightening cancels any conflicting pending loosening.
- A mixed change is split: the stricter parts apply now and the looser parts wait.
**Why:** Without these rules, the commitment device has trivial escape hatches.

### D9 — Data model additions (2026-09-24)
**Decision:** Add a `reflection_notes` table. Increment `usage_daily` through an atomic Postgres function.
**Why:** The spec had nowhere to store reflection answers. A read-then-write increment lets two simultaneous messages both slip past the limit (a race condition).

### D10 — Quote accuracy is best-effort (2026-09-24)
**Decision:** Invariant 4 is enforced by requiring a citation and marking paraphrases, not by verification.
**Why:** The judge has no source text to check quotes against. Copy says "reduced," never "guaranteed."

### D11 — Toolchain versions (2026-09-24)
**Decision:** Next.js 16.3 (App Router), React 19.2, Tailwind 4, vitest 5, tsx, npm, `@types/node@22`.
**Why:** These are the current create-next-app defaults. `@types/node` was bumped from 20 to 22 to match Node 22 and satisfy vitest's peer dependency.

### D12 — Strict policy schema; base prompt as a file (2026-09-24)
**Decision:**
- Frontmatter is validated with a `.strict()` zod schema, plus cross-field rules (for example, `input_classifier` requires `classifier_label`).
- `policies/_base.md` holds the identity prompt, and `_invariants.md` holds the safety rules.
- Files starting with `_` are not toggles.

**Why:** Typos must fail loudly. The base prompt belongs with the policies so `/policies` can show the *complete* prompt, not just the toggle parts.

### D13 — `compileSystemPrompt` takes a third `frame` argument (2026-09-24)
**Decision:** The signature is `(policies, enabledIds, frame)`, not the spec's `(policies, enabledIds)`.
**Alternatives:** Have the compiler read `_base.md` and `_invariants.md` from disk itself.
**Why:** Keeps the compiler a pure function (no file I/O), which makes it trivially testable.

### D14 — App-level toggles get chat-level tests (2026-09-24)
**Decision:**
- `daily-limit` tests use a `context.messages_today` field.
- `cooling-off` tests check that the chat never claims a setting changed and keeps following restrictions when told they've lapsed.
- Tests can carry `history` for multi-turn escalation.

**Why:** Every toggle needs measurable evals. The real settings logic for cooling-off (`isLoosening`) is unit-tested in Phase 5.

### D15 — No GitHub Pages; run locally now, deploy to Vercel later (2026-09-24)
**Decision:** The chat runs as a Next.js server, locally via `npm run dev` for now and on Vercel later.
**Alternatives:** GitHub Pages (static hosting).
**Why:** A static site has no server, so the browser would have to call Anthropic with the API key embedded in the page, where anyone could copy it and spend on it. That breaks the non-negotiable security rule.

### D16 — Temporary stand-ins for unfinished exercises (2026-09-24)
**Decision:** `lib/exercises.ts` calls Ethan's implementation and falls back to `lib/standins.ts` only while it still throws "not implemented". It logs a warning once per function.
**Why:** Ethan wanted a testable UI before finishing the exercises, without losing them. Delete both files once all `TODO(ethan)` tests pass.

### D17 — Structured outputs for judge calls (2026-09-24)
**Decision:** The pre-check and output judge use the API's structured outputs (`messages.parse` with a zod schema).
**Why:** The API constrains the JSON shape and the SDK validates it, so malformed JSON is now rare. Failure is still possible (refusal, truncation, network errors, timeouts), so every judge call keeps a fail direction. The Phase 2 exercise moved from "parse the JSON" to "decide what a failure means" (`resolvePrecheck`).

### D18 — Crisis handling when the daily limit is reached (2026-09-24)
**Decision:** The daily-limit message always includes 988 and 911. No model is called after the limit, even for a possible crisis.
**Alternatives:** Run the pre-check after the limit to detect a crisis.
**Why:** That would make the limit bypassable and costly: every over-limit message would be a paid model call. Always showing the resources meets invariant 1 without any call.

### D19 — Crisis mode skips the output judge (2026-09-24)
**Decision:** Crisis replies are not judged or regenerated. If the reply lacks 988, it is appended.
**Why:** A restriction must never replace a crisis reply with a generic fallback.

### D20 — Pre-check failure shows resources, no generation (2026-09-24; refines D3)
**Decision:** If the pre-check fails, the reply is an apology plus crisis resources, and nothing is generated.
**Why:** Simpler and more predictable than generating with some toggles relaxed. It still fails closed for restrictions and fails open toward help.

### D21 — Dev-mode settings and usage (2026-09-24)
**Decision:**
- Until accounts exist, toggles live in the browser (localStorage) and are sent with each request.
- The daily count is kept in the server's memory.

**Why:** This makes the UI testable today. It is not secure: anyone can flip toggles in DevTools. Phases 4–6 move both into Supabase, where the server reads settings itself.

### D22 — attempt-first counts attempts across the conversation (2026-09-24)
**Decision:** If any user message in the recent history meets the word minimum, follow-up task questions pass.
**Why:** Otherwise every "what about step 2?" would be blocked after a real attempt. Known weakness: one long message unlocks the rest of the conversation.

### D23 — Redirects run before the attempt gate (2026-09-24)
**Decision:** Pipeline order is pre-check → classifier redirect → attempt gate, reversing spec §5.
**Why:** Found in the first live test. "Write me an essay" was answered with "show me your attempt first, then I'll respond," which implies the essay would be written after an attempt. A hard "no" must take priority over "try first."
