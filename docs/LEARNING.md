# Learning log

One short entry per concept. Newest at the bottom.

---

## Ports and adapters (Phase 0)
Keep the core logic ignorant of *how* it's called. The pipeline takes a message and settings and returns a result. It doesn't know whether a terminal, a test, or a web request asked. Each entry point is an **adapter** that translates its world (CLI flags, HTTP requests) into a core call. Payoff: tests and evals exercise the real logic with no server running.

## The `NEXT_PUBLIC_` boundary (Phase 0)
Next.js inlines any env var starting with `NEXT_PUBLIC_` into the JavaScript sent to browsers, where anyone can read it with DevTools. Everything else stays on the server. So the prefix is a *publishing decision*, not a naming style. The Supabase URL and anon key are public by design, because Row-Level Security is what protects the data. The Anthropic key and service-role key must never carry the prefix. Phase 8 adds an automated check that scans the built client bundle for secret names.

## Fail fast on configuration (Phase 0)
A missing API key should crash at startup with a clear message, not surface as a confusing 401 error ten steps into the pipeline. That's the job of `requireEnv` (your exercise).

## Enforcement hierarchy (Phase 0 — preview)
App code > input classifier > output judge > system prompt. The system prompt is weakest because the model reads it in the same context as the user's text, so users can argue with it. The classifier and judge are stronger because they *label* the text instead of following it. App code is unbreakable because no model is involved. See `docs/ARCHITECTURE.md`.
