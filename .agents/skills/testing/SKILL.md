---
name: testing
description: QuotaWeave testing responsibilities and validation workflow
version: 1.1.0
---

# Testing Skill

Read AGENTS.md first. Test behavior with meaningful assertions, regression cases for bugs and tests for new public APIs. Mock external SDKs, network and filesystem where appropriate. Preserve the 80% coverage requirement; never weaken tests or thresholds.

Retrieve known constraints and use available graph relationships to locate callers and tests. Start with targeted tests, then manifest-defined lint, formatting, typecheck, build and full checks appropriate to scope. Package tests use Vitest; infrastructure fixtures use Node's built-in test runner without extra dependencies.

Fixtures stay inside the project and clean up only directories they created. No hook starts watch processes. Write tests only within task scope. Output exact commands, pass/fail results, coverage measured (or explicitly unmeasured) and environmental limitations. Record reusable verified failure causes in project knowledge using docs/development/memory.md; omit transient debug noise.

Before extending a module, run `pnpm quality:changed <path>` and review its code-line budget.
At 250 code lines, consider splitting by responsibility before adding more code. Hard limits apply
to handwritten code including tests: 300 code lines per file, 50 per function, four parameters,
three nesting levels. Comment-only and blank lines are excluded. Do not compress code or disable
rules to satisfy a limit. Keep test registration callbacks small and move reusable fixture data
into focused modules. Use `pnpm quality:all` and `pnpm typecheck:tests` before completion.

**Permanent Policy — Fix the code, never the quality gate.** Never disable diagnostics, skip tests,
weaken assertions, lower thresholds, exclude failing files or hide CI errors to make checks pass.
Exceptions require technical justification, minimal scope and explicit maintainer approval.
