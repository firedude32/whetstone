# Whetstone

AI that sharpens you instead of thinking for you.

A chat interface over an LLM where **toggles** — Markdown policy files in `policies/` —
restrict how you use the AI. The toggles are the product; the chat is where they apply.

## Setup

```bash
npm install
cp .env.example .env.local   # then fill in values
npm run check                # typecheck + lint + tests
npm run dev                  # web app at http://localhost:3000
```

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Next.js dev server |
| `npm run check` | typecheck, lint, unit tests |
| `npm test` | unit tests (vitest) |
| `npm run chat` | pipeline in the terminal (Phase 2) |
| `npm run eval` | policy eval harness (Phase 3) |

## Docs

- `docs/ARCHITECTURE.md`: structure and pipeline diagram
- `docs/DECISIONS.md`: architectural decisions and why
- `docs/LEARNING.md`: concepts log
