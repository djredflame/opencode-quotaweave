---
name: architecture
description: QuotaWeave architecture responsibilities and validation workflow
version: 1.1.0
---

# Architecture Skill

Read AGENTS.md first. Its package boundaries, strict TypeScript rules and public API requirements are authoritative.

Before substantial changes retrieve relevant project knowledge, then inspect available graph relationships, actual exports, callers, dependencies and affected tests. Follow docs/development/codegraph.md; never invent tool names or assume old report API lists are current contracts.

Keep core pure, platform adapters separate and shared public types in core (common types and domain-specific type modules, re-exported by its entry point). Use package exports for public imports. Prefer small composable helpers, immutable inputs and explicit errors. Preserve ADR-002/003, model approval and the authorized routing/TUI scope.

Use manifest-defined build, typecheck, lint and targeted test commands. Architecture review is read-only unless implementation is authorized. Output components, blast radius, API compatibility, tests and limitations. Batch supported graph maintenance after changes; update durable verified architecture knowledge using docs/development/memory.md.

Before extending a module, run `pnpm quality:changed <path>` and review its code-line budget.
At 250 code lines, consider splitting by responsibility before adding more code. Hard limits apply
to handwritten code including tests: 300 code lines per file, 50 per function, four parameters,
three nesting levels. Comment-only and blank lines are excluded. Do not compress code or disable
rules to satisfy a limit. Keep test registration callbacks small and move reusable fixture data
into focused modules. Use `pnpm quality:all` and `pnpm typecheck:tests` before completion.
