@AGENTS.md

# Whetstone project conventions

- Teaching mode: build in phases, stop after each, explain concepts (<=200 words) before building.
- Exercises for the owner are marked `TODO(ethan)`: write signature + docstring + failing tests; never write the solution unless asked.
- Keep `docs/LEARNING.md` (one entry per concept) and `docs/DECISIONS.md` (dated decisions) updated.
- `lib/`, `policies/`, `evals/` must never import Next.js (see docs/DECISIONS.md D1).
- Verify SDK/model names/API params against current official docs before use.
- Secrets never use the `NEXT_PUBLIC_` prefix.
