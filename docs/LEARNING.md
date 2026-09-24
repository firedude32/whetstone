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

## Policy as code (Phase 1)
Each toggle is a Markdown file, not a string buried in TypeScript. That gets you four things at once:
1. **Readable:** a teacher can read the exact rule.
2. **Versioned:** `git log policies/socratic.md` is its history.
3. **Testable:** the tests sit next to the rule they test.
4. **Publishable:** `/policies` renders the same file the pipeline uses, so the transparency page can't drift from reality.

The same idea shows up as infrastructure-as-code (Terraform) and access policies as code (Open Policy Agent).

## Validate at the boundary (Phase 1)
Data from outside your program is untrusted until it's checked. That includes files, user input, and LLM output. zod turns "a YAML file" into "a `Policy` object TypeScript can trust," or crashes with a readable error. The schema is `.strict()`, so a typo like `redirect_mesage` is an error instead of a silently ignored key. Silently ignoring config is how a restriction ends up off without anyone knowing. Phase 2 applies the same idea to LLM JSON output.

## The Norway problem (Phase 1)
In YAML 1.1, a bare `no`, `off`, `on`, or `yes` is read as a boolean, so the country code `NO` for Norway famously became `false`. Our parser (js-yaml 4, YAML 1.2) reads `on` as the string `"on"`. Other tools might not, so the policy files quote it (`default: "on"`) and the schema accepts only the strings `"on"` and `"off"`. If any parser ever produced `true`, validation would fail loudly.

## Deterministic prompts (Phase 1)
The same toggles should always compile to the byte-identical system prompt, whatever order they were switched on in. Two reasons:
- Providers can cache a repeated prompt prefix, which is cheaper and faster. A reordered prompt is a cache miss.
- Logged prompts can be diffed, so when behavior changes you can see exactly what text changed.

That's why policies are sorted by id and the compiler follows that order, not the user's.

## Fail closed on unknown ids (Phase 1)
If settings say `no-ghostwritng` (typo), the safe response is to crash, not skip it. Skipping would turn a restriction off. This is the first instance of the fail-closed rule the pipeline uses everywhere a restriction is involved.
