# AGENTS.md

> **OpenCode QuotaWeave – Agent Instructions**
>
> This file defines the architecture rules, quality standards, security requirements, testing obligations, Git conventions, and Definition of Done for all agents working on this project.

---

## 1. Architecture Rules

### 1.1 Package Boundaries

- **`@opencode-quotaweave/core`** – Pure TypeScript, platform-agnostic. **Zero** dependencies on OpenCode, MCP, or any runtime-specific APIs.
- **`@opencode-quotaweave/opencode-plugin`** – OpenCode 2 integration layer. Imports only from `core` and OpenCode SDK.
- **`@opencode-quotaweave/mcp-server`** – MCP server exposing diagnostic/support tools. Imports only from `core` and `@modelcontextprotocol/sdk`.

### 1.2 Dependency Direction

```
opencode-plugin  ──►  core  ◄──  mcp-server
```

- No circular dependencies.
- No `core` → `plugin` or `core` → `mcp-server` imports.
- Common context/file-access types live in `core/src/types.ts`; domain types live in their policy, routing, quota and workflow modules and are re-exported from the core entry point.

### 1.3 TypeScript Project References

- Root `tsconfig.json` uses `composite: true` and `references` to all packages.
- Each package has its own `tsconfig.json` with `composite: true`.
- Build order: `core` → `opencode-plugin` & `mcp-server` (parallel).

### 1.4 Public API Surface

- Each package exports **only** via `exports` field in `package.json`.
- No deep imports from `dist/` or `src/` across package boundaries.
- Internal modules are not exported.

---

## 2. Quality Standards

### 2.1 TypeScript

- **Strict mode** always (`strict: true`).
- `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noFallthroughCasesInSwitch` enabled.
- `noUnusedLocals`, `noUnusedParameters` – no dead code.
- `verbatimModuleSyntax` – explicit imports/exports.
- No `any`, unsafe suppressions, disabled lint rules, or weakened tests.
- Handwritten TS/TSX and JavaScript, including tests: at most 300 code lines per file, 50 code lines per function, 4 parameters and 3 nesting levels.
- Code lines exclude blank and comment-only lines. Executable limits live in `scripts/quality/limits.ts`.
- At 250 code lines, review the module before extending it. Split by responsibility; do not compress code to satisfy a limit.
- Run `pnpm quality:changed` after a meaningful edit batch and `pnpm quality:all` before completion.

### 2.2 ESLint (Flat Config)

- Extends `typescript-eslint/recommended` and `prettier`.
- No warning-level rules – errors only.
- Run via `pnpm lint` (root) or `pnpm lint` (package).

### 2.3 Prettier

- Single quotes, trailing commas, 100 char line width.
- Run via `pnpm format:check` (CI) or `pnpm format` (local). For scoped audits, pass an explicit public file list to Prettier; full-tree commands may include private files absent from `.prettierignore`.

### 2.4 Vitest

- Unit tests in `tests/` mirroring `src/` structure.
- **No trivial assertions** (`expect(true).toBe(true)`).
- Test behavior, not implementation.
- Coverage threshold: **80%** statements, branches, functions, lines.

### 2.5 pnpm Scripts (per package)

| Script         | Purpose                                                        |
| -------------- | -------------------------------------------------------------- |
| `build`        | `tsc --build`; plugin also runs the Solid transform            |
| `lint`         | `eslint .`                                                     |
| `format:check` | `prettier --check .`                                           |
| `typecheck`    | `tsc --noEmit`                                                 |
| `test`         | `vitest run`                                                   |
| `check`        | `lint && format:check && typecheck && typecheck:tests && test` |

### 2.6 Root Workspace Scripts

| Script          | Purpose                                                                       |
| --------------- | ----------------------------------------------------------------------------- |
| `check:all`     | Infrastructure, quality, formatting, Bash, build/typechecks and package tests |
| `test:all`      | Runs `test` in all packages                                                   |
| `typecheck:all` | Builds all packages, then runs package typechecks                             |
| `build:all`     | Builds all packages in dependency order                                       |

---

## 3. Git Read-Only Rules (CRITICAL)

### 3.1 Absolute Prohibition

**All coding agents (OpenCode, Codex and Claude Code), their tools, hooks and subagents MUST use Git and GitHub EXCLUSIVELY in read-only mode.**

No exceptions. No workarounds. No indirect paths.

### 3.2 Explicitly Forbidden Operations

| Category          | Forbidden Commands                                                                             |
| ----------------- | ---------------------------------------------------------------------------------------------- |
| Commits           | `git commit`, `git add`, `git reset`, `git stash`                                              |
| History Rewrite   | `git rebase`, `git reset --hard`, `git commit --amend`, `git filter-branch`, `git filter-repo` |
| Branching         | `git checkout -b`, `git switch -c`, `git branch -d`, `git branch -m`, `git tag`, `git tag -d`  |
| Remote Sync       | `git push`, `git fetch`, `git pull`, `git remote add/remove`                                   |
| Merging           | `git merge`, `git rebase`, `git cherry-pick`, `git revert`                                     |
| Repository Init   | `git init`, `git clone` (except explicit user request)                                         |
| Cleanup           | `git clean`, `git gc`, `git prune`, `git update-ref`                                           |
| GitHub Operations | `gh pr create`, `gh issue create`, `gh release create`, `gh repo create`                       |
| Publishing        | `npm publish`, `pnpm publish`, `gh release create`                                             |

### 3.3 Explicitly Allowed Read-Only Operations

- `git status`, `git diff`, `git log`, `git show`, `git ls-files`, `git ls-remote`
- `git rev-parse`, `git branch --list`, `git branch -a`, `git describe`
- `git blame`, `git show`, `git diff --name-only`, `git diff --stat`
- `git ls-remote`, `git remote -v`, `git config --list`
- Read-only GitHub API queries (issues, PRs, releases, repos)

### 3.4 Enforcement

- `opencode.json` currently declares an array of `permissions` rules with shell approval and Git/GitHub denials. The structural validator checks this array; native-host acceptance and enforcement require manual verification.
- Hooks reject recognized prohibited tool inputs; they are guardrails, not a sandbox.
- No agent may override these prohibitions; host sandbox and maintainer controls remain necessary.
- Subagents and Skills MUST NOT contain Git write instructions

### 3.5 Boundaries & Limitations

A command blacklist is not a sandbox. Write operations could still occur via:

- Shell scripts that internally call forbidden commands
- Third-party tools that wrap Git operations
- MCP tools that expose Git write capabilities

**Mitigation**: All scripts and tools executed by OpenCode MUST be audited for Git write operations. The declared OpenCode `shell` rule defaults to `ask`; native enforcement is unverified. Scripts require task authorization and host approval where requested. Task authorization must establish the permitted scope; instructions alone do not authorize deployment, installation, cleanup or external mutation.

---

## 4. Security Rules

### 4.1 Secrets Management

- **Never** commit API keys, tokens, passwords, or `.env` files.
- Use environment variables or secret managers at runtime.
- `.env`, `.env.*`, `*.pem`, `*.key` are in `.gitignore`.

### 4.2 Dependencies

- Minimize production dependencies.
- Audit via `pnpm audit` in CI.
- No `npm`, `yarn`, or `bun` lockfiles – only `pnpm-lock.yaml`.

### 4.3 Input Validation

- All external inputs (MCP tool args, OpenCode hooks, CLI args) validated with Zod or equivalent.
- No `eval`, `Function`, or dynamic code execution.

### 4.4 Permissions (OpenCode)

- `opencode.json` declares read/edit denials for sensitive paths (`.env`, `.ssh`, `.aws`, etc.); do not infer native-host enforcement from the local validator.
- Shell commands require `ask` by default; do not grant broad command-prefix allows.

### 4.5 OpenCode Plugin Directory Protection

- **`.opencode/plugins/` is reserved for the intended QuotaWeave local development plugin only.**
- Agent infrastructure plugins, standalone hooks, diagnostic plugins and unrelated auto-loaded modules are forbidden.
- The local development plugin is deployed via `pnpm dev:plugin` to `.opencode/plugins/opencode-quotaweave/`.
- The infrastructure validator (`pnpm agents:check`) enforces this by checking that no loose `.ts`/`.js` files or unauthorized plugin directories exist in `.opencode/plugins/`.

---

## 5. Testing Obligations

### 5.1 Test Pyramid

- **Unit tests** (Vitest) – fast, isolated, per-package.
- **Integration tests** – cross-package, in `tests/integration/` (future).
- **Compatibility tests** – against OpenCode versions (future).

### 5.2 Requirements

- Every new public function/class has a test.
- Bug fixes include a regression test.
- Tests run in CI on Linux, macOS, Windows.

### 5.3 Test Conventions

- `describe` / `it` with clear names.
- `beforeEach` / `afterEach` for setup/teardown.
- Mock external dependencies (OpenCode SDK, MCP SDK, filesystem, network).
- No flaky tests – fix or remove immediately.

## 5.4 Permanent Policy — Fix the Code, Never the Quality Gate

"Fix the code, never the quality gate. Never disable diagnostics, skip tests, weaken assertions, lower thresholds, exclude failing files or hide CI errors to make checks pass. Exceptions require technical justification, minimal scope and explicit maintainer approval."

---

## 6. Git Conventions (Classical GitFlow)

### 6.1 Long-Lived Branches

- **`main`** — Stable, release-ready, protected. All merges via PR with passing CI and approval.
- **`develop`** — Integration branch for features, protected. All merges via PR with passing CI and approval.

### 6.2 Branch Types & Flow

| Branch Type      | Originates From | Merges Into Via PR | Notes                                                                     |
| ---------------- | --------------- | ------------------ | ------------------------------------------------------------------------- |
| `feature/*`      | `develop`       | `develop`          | Feature work; never target `main`                                         |
| `release/vX.Y.Z` | `develop`       | `main`             | Stabilize, then merge to `main`, tag, merge `main` back to `develop`      |
| `hotfix/*`       | `main`          | `main`             | Urgent fixes; tag on `main` if applicable, merge `main` back to `develop` |

### 6.3 Prohibited Actions

- Direct pushes to `main` or `develop`.
- Force pushes to `main` or `develop`.
- Direct `develop` → `main` merges (must use `release/*` branch).
- Deleting `main` or `develop`.

### 6.4 Commits

- **Conventional Commits** (Angular style):
  ```
  <type>(<scope>): <subject>
  ```
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `build`, `ci`, `security`.
- Scope: package name (`core`, `plugin`, `mcp`) or `root`.
- Subject: imperative, lowercase, no period.

### 6.5 Pull Requests

- PR title follows Conventional Commits.
- Description includes: motivation, changes, testing done, screenshots (if UI).
- Requires: `check:all` passing, 1 approval, no merge conflicts.
- Target branch must be `main` or `develop` per the flow above.

### 6.6 Tags & Releases

- Semantic Versioning is the maintainer convention. Changesets is planned but not installed.
- Tags: `v<major>.<minor>.<patch>` on `main` commit after release/hotfix merge.
- Maintain CHANGELOG.md explicitly until release automation is configured.

### 6.7 Maintainer-Only Git Operations

**All coding agents (OpenCode, Codex, Claude Code) operate in read-only Git mode.** The maintainer exclusively performs:

- Creating commits, branches, tags
- Pushing to remote, opening PRs, merging PRs
- Configuring branch protection/rulesets
- Publishing releases and npm packages

Agents MUST NOT execute any Git write operations (see Section 3).

---

## 7. Definition of Done

A task is **Done** when:

- [ ] Code compiles (`typecheck` passes).
- [ ] Lint passes (`lint` passes).
- [ ] Format check passes (`format:check` passes).
- [ ] All tests pass (`test` passes, coverage ≥ 80%).
- [ ] `check:all` passes at root.
- [ ] Documentation updated (README, JSDoc, CHANGELOG if user-facing).
- [ ] No `console.log`, `debugger`, or commented-out code.
- [ ] No `TODO`/`FIXME` without linked issue.
- [ ] Security review (if touching auth, secrets, or external input).
- [ ] Changes and limitations reported for maintainer review. Commits, PRs and merges are maintainer-only and are not agent completion steps.

---

## 8. Agent Skills Reference

Read the applicable canonical `SKILL.md` source. All six skills live in `.agents/skills/<name>/SKILL.md`.

| Skill         | Canonical source                                                               | Scope                                           |
| ------------- | ------------------------------------------------------------------------------ | ----------------------------------------------- |
| architecture  | [.agents/skills/architecture/SKILL.md](.agents/skills/architecture/SKILL.md)   | Boundaries, APIs and impact                     |
| testing       | [.agents/skills/testing/SKILL.md](.agents/skills/testing/SKILL.md)             | Regression checks and validation                |
| security      | [.agents/skills/security/SKILL.md](.agents/skills/security/SKILL.md)           | Inputs, secrets and permissions                 |
| release       | [.agents/skills/release/SKILL.md](.agents/skills/release/SKILL.md)             | Release preparation and documentation           |
| git-safety    | [.agents/skills/git-safety/SKILL.md](.agents/skills/git-safety/SKILL.md)       | Read-only Git and command audits                |
| documentation | [.agents/skills/documentation/SKILL.md](.agents/skills/documentation/SKILL.md) | Public docs, examples, branding and consistency |

For documentation work, use the documentation skill; add architecture, release or security only when the claim being changed needs that responsibility.

No project agent personas are defined; host agents select these responsibilities within the authorized task.
ADR-002 is the project policy shorthand for coordination preview and approval where applicable; ADR-003 means no silent model fallback. No standalone ADR-002/003 Markdown records are present. Do not launch concurrent file writers.

---

## 9. Tooling Versions (manifest and workspace catalog)

| Tool       | Version                    |
| ---------- | -------------------------- |
| Node.js    | ≥24 (LTS)                  |
| pnpm       | 12.15.0 (`packageManager`) |
| TypeScript | 6.x                        |
| ESLint     | 10.x                       |
| Prettier   | 3.x                        |
| Vitest     | 5.x                        |

---

_This document is binding for automated and human contributors. Maintainers review instruction updates using the `docs(agents):` convention; agents do not create PRs._

## 10. Shared agent workflow

[`docs/development/agent-infrastructure.md`](docs/development/agent-infrastructure.md) is the canonical infrastructure reference. This section summarizes the workflow.

1. Start in this project root. Read the [infrastructure guide](docs/development/agent-infrastructure.md).
   Stay inside this workspace; never inspect parent/sibling repositories,
   user caches or private directories. Do not install tools or start background processes.
2. Before substantial changes, retrieve relevant project knowledge using the verified workflow in
   [memory.md](docs/development/memory.md). Consult available CodeGraph relationships and freshness
   using [codegraph.md](docs/development/codegraph.md), then inspect source, callers and affected tests.
   If unavailable, state the limitation and use `rg` or connected semantic tools. Trivial changes do
   not require graph or memory calls. Never invent operation names or claim an unavailable query ran.
3. Preserve `opencode-plugin → core ← mcp-server`, approved model selection, free/mixed models,
   routing/simulation behavior and native TUI integration.
   Respect ADR-002 coordination and ADR-003 no silent model fallback. Never read, print, copy or modify
   `dev.route.json`. Infrastructure work must not change model routing or the ongoing TUI redesign.
4. Select scripts from package.json manifests, inspect transitive commands and run targeted checks first.
   Keep writes coordinated. Native hooks check recognized paths/commands but cannot secure arbitrary
   shell programs, third-party plugins, tool code or concurrent sessions; retain host restrictions.
5. After meaningful changes, run appropriate checks and batch graph maintenance once using only
   supported update APIs. Prefer incremental updates; reuse automatic indexing if already active.
   Where unavailable, explicitly report freshness unknown and the source paths needing review.
6. Update an existing relevant project memory with verified durable knowledge, provenance/date,
   source paths and validation evidence; otherwise use the documented local knowledge fallback.
   Never store secrets, transcripts, source dumps, debugging noise or unverified assumptions.
   Do not automatically delete knowledge. Correct conflicts against current source.
7. Before compaction or handoff, preserve the objective, decisions, changed files, failing checks,
   next actions and actual knowledge references. At completion report files, tests and limitations,
   including graph/MEM operations actually performed. Do not destroy unfinished user work.

Native hook support and manual fallbacks are documented in the infrastructure guide. Validate
with `pnpm agents:check` and `pnpm test:agents`.
