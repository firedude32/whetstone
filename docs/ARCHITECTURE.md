# Architecture

## Layout

```
policies/        Toggle definitions as Markdown + YAML frontmatter (the product)
lib/             Framework-free core — never imports Next.js
  pipeline/      The message pipeline (pure, testable)
  config/        Env + pricing config
scripts/chat.ts  Terminal adapter  (npm run chat)
evals/           Eval harness adapter (npm run eval)
app/             Next.js web adapter (Phase 4+)
supabase/        SQL migrations + RLS (Phase 4+)
docs/            ARCHITECTURE, DECISIONS, LEARNING
```

The core is called by three adapters — CLI, evals, web — so it can't depend on any one of them.

```mermaid
flowchart LR
  CLI[scripts/chat.ts] --> Core
  EVAL[evals/run.ts] --> Core
  WEB[app/ route handlers] --> Core
  subgraph Core[lib/ — framework-free]
    P[policies loader + prompt compiler]
    PL[pipeline]
    LLM[LLM provider interface]
  end
  LLM --> Anthropic[(Anthropic API)]
  WEB --> DB[(Supabase Postgres + RLS)]
```

## The message pipeline

One judge call before generation handles both the crisis check and classification
(see DECISIONS D2). Different fields fail in different directions.

```mermaid
flowchart TD
  A[User message] --> B{1. Hard limits<br/>daily-limit}
  B -- over limit --> BX[Limit message<br/>no LLM call]
  B -- ok --> C[2. Pre-check — one judge call<br/>crisis, labels, task_help, confidence]
  C -- call/JSON error --> CE[crisis: fail-safe<br/>relax companionship + spiritual,<br/>add resources footer<br/>restrictions: fail CLOSED]
  C -- crisis = true --> CR[Crisis mode<br/>bypass companionship + spiritual<br/>warm reply + 988]
  C -- ok --> D{3. Attempt gate<br/>attempt-first on AND task_help<br/>AND &lt; 40 words?}
  D -- yes --> DX[Ask for your attempt]
  D -- no --> E{4. Label matches<br/>enabled toggle?}
  E -- yes --> EX[Return that policy's<br/>redirect_message]
  E -- no --> F[5. Build system prompt<br/>base + invariants + enabled fragments]
  CR --> F
  CE --> F
  F --> G[6. Generate — MODEL_MAIN<br/>buffered, not streamed]
  G --> H{7. Output judge — MODEL_JUDGE<br/>violations?}
  H -- none --> OK[Return reply]
  H -- violations --> I[8. Regenerate once<br/>with judge feedback]
  I --> H2{Judge again}
  H2 -- none --> OK
  H2 -- still failing --> FB[Safe fallback reply]
  OK --> L[9. Log labels, blocks, violations,<br/>tokens, cost]
  FB --> L
  EX --> L
  DX --> L
  BX --> L
```

## Enforcement hierarchy

From strongest to weakest. A toggle is only as strong as its strongest layer.

| Layer | Strength | Why |
|---|---|---|
| App code (daily-limit, attempt gate, cooling-off) | Unbreakable | No model is involved; there is nothing to argue with |
| Input classifier | Strong | Runs before generation; the user's text is data being labeled, not instructions being followed |
| Output judge | Strong | Inspects what was actually produced, regardless of how the user got there |
| System prompt | Weak | The model reads it alongside the user's text, and a clever user can argue with it |
