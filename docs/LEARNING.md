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

## Provider interface (Phase 2)
The pipeline depends on `LLMProvider`, a two-method interface in `lib/llm/types.ts`, not on the Anthropic SDK. That gives you two things:
1. OpenAI (or anything else) can be swapped in by writing one class.
2. Tests can pass a **fake** provider that returns scripted answers (`pipeline.test.ts`). This is called a *test double*. It lets you test every pipeline branch, including crisis and judge failure, in milliseconds, for free, deterministically.

## Structured outputs don't remove failure (Phase 2)
The API can constrain the model to your JSON schema, so "the model returned invalid JSON" mostly disappears. But the call can still refuse, time out, hit `max_tokens`, or return a value that's the right shape but wrong. So the design question isn't "how do I parse this?" but "**what do I do when I have no trustworthy answer?**" That's `resolvePrecheck`: restrictions fail closed, and help for someone in crisis fails open.

## Why the reply is buffered, not streamed (Phase 2)
Streaming shows words as they're generated, but the output judge needs the *whole* reply before it can pass or fail it. Once text has been streamed to the screen it can't be taken back. So v1 waits: generate, then judge, then show. The cost is latency. A normal reply makes three model calls (pre-check, generate, judge), and a regeneration adds two more. A later fix is to stream to the server, judge in chunks, and release text that has passed.

## Conversation window (Phase 2)
Each API call resends the conversation, so cost grows with conversation length. v1 sends the last 10 turns and drops older ones. The trade-off: long conversations "forget" their beginning. Later, a cheap model writes a running summary of the dropped turns, which keeps the cost bounded while holding onto the gist.

## Unit economics (Phase 2)
Every call's token counts are priced in `lib/llm/pricing.ts` and summed per message. The Inspect panel and the session total show it live. Rough shape: Haiku judge calls cost fractions of a cent, and the Sonnet reply dominates. Cost per message × messages per user per month is what a subscription has to cover.

## Effect cleanup and implicit returns (bug, Phase 2)
React treats whatever a `useEffect` callback returns as its cleanup function. `useEffect(() => x.scrollIntoView())` has no braces, so it *returns* the call's result. Newer browsers made `scrollIntoView()` return a Promise, so React tried to call a Promise on cleanup and crashed with "destroy is not a function." The rule: write effect bodies in braces unless you're deliberately returning a cleanup function.
