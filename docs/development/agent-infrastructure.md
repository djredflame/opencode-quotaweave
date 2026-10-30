# Shared Agent Infrastructure

QuotaWeave maintains shared development guidance and executable infrastructure for supported coding assistants.

This infrastructure is intended to improve consistency, safety, and code quality.

It does not introduce an autonomous QuotaWeave agent runtime or replace the native OpenCode, Codex, or Claude Code execution environments.

## Source of Truth

`AGENTS.md` contains the shared project rules.

Six canonical skills provide specialized instructions:

| Skill           | Responsibility                                  |
| --------------- | ----------------------------------------------- |
| `architecture`  | Package boundaries, design, and maintainability |
| `testing`       | Test strategy, regressions, and coverage        |
| `security`      | Trust boundaries, secrets, and safe operations  |
| `release`       | Release review and preparation                  |
| `git-safety`    | Git mutation restrictions and safe inspection   |
| `documentation` | Accurate public documentation and references    |

Skills live under:

```text
.agents/skills/<name>/SKILL.md
```

`CLAUDE.md` references the shared rules for Claude Code. OpenCode and Codex use the shared repository instructions according to their supported discovery mechanisms.

These files are maintained directly. There is no generated adapter synchronization process.

## Shared Executable Infrastructure

The `scripts/agents/` directory contains reusable tooling for coding assistants.

It does not define independent AI agents.

| File                    | Purpose                                    |
| ----------------------- | ------------------------------------------ |
| `hook.ts`               | Shared command-hook entry point            |
| `hook-handler.ts`       | Hook event handling                        |
| `hook-input.ts`         | Bounded hook input parsing                 |
| `guard.ts`              | Recognized command and path restrictions   |
| `workspace.ts`          | Project root and protected-path validation |
| `validate.ts`           | Shared infrastructure validation           |
| `validate-opencode.ts`  | OpenCode configuration validation          |
| `post-edit.ts`          | Post-edit feedback entry point             |
| `post-edit-feedback.ts` | Advisory code-size feedback                |
| `tests/`                | Infrastructure and regression fixtures     |

The directory is separate from the canonical Markdown instructions to avoid duplicating executable behavior across platforms.

## Development Workflow

Before substantial changes:

1. Read the relevant shared rules and skills.
2. Inspect affected source, callers, and tests.
3. Use verified code-navigation and knowledge tools when available.
4. Make focused changes with strict types.
5. Run targeted tests and quality checks.
6. Review affected documentation and public claims.
7. Report changed files, validation, and limitations.

For executable changes:

```bash
pnpm quality:changed
pnpm agents:check
pnpm test:agents
pnpm check:all
```

The full local check is not automatically required after every documentation-only edit. Use targeted Markdown checks when the change does not affect executable behavior.

## Hook Adapters

### Claude Code and Codex

The repository contains:

- `.claude/settings.json`
- `.codex/hooks.json`
- `CLAUDE.md`

Shared command-hook handlers process supported events and recognized tool inputs.

Configured lifecycle events include session initialization, pre-tool validation, post-edit feedback, compaction, and stop handling.

The hooks are designed to remain lightweight and avoid unnecessary subprocesses or background work.

Post-edit feedback is advisory, not an automatic code modification or a secure prevention mechanism.

### OpenCode

OpenCode uses its native project instruction and skill discovery mechanisms.

QuotaWeave does not install a separate auto-loaded agent-infrastructure plugin.

The `.opencode/plugins/` directory is reserved for the locally deployed QuotaWeave plugin.

Run:

```bash
pnpm dev:plugin
```

to deploy the development plugin when native OpenCode testing is required.

OpenCode does not currently receive the same post-edit infrastructure feedback as the Claude/Codex command-hook adapters.

Use:

```bash
pnpm quality:changed
```

after an edit batch.

## Permissions and Security Boundaries

The repository includes rules intended to restrict:

- Access to known private files.
- Operations outside the approved workspace.
- Git and GitHub mutations.
- Dangerous shell commands.
- Unauthorized publication.
- Certain development-agent tool actions.

The checked-in OpenCode configuration uses a plural `permissions` array with locally validated rule ordering.

This configuration describes intended restrictions. The installed OpenCode host's schema and enforcement behavior still require native verification.

Similarly, the Claude and Codex hook files are checked against repository expectations but are not guaranteed compatible with every host version or execution environment.

**Do not treat project instructions, hooks, or command scanners as a complete security sandbox.**

Actual boundaries depend on host configuration, permissions, tools, and execution environment.

## Git Safety

Coding assistants must not perform maintainer-only Git or GitHub mutations.

This includes:

- Staging and committing.
- Branch creation or switching.
- Merges, resets, and rebases.
- Tags and pushes.
- Repository publication.
- GitHub settings changes.

Read-only inspection is permitted when the active task and host permissions allow it.

See [AGENTS.md](../../AGENTS.md) and the canonical [Git Safety Skill](../../.agents/skills/git-safety/SKILL.md).

## Knowledge Services

The project configuration includes declarations for external knowledge services, including CodeGraph and Serena.

Configured or enabled service declarations do not establish that a service is running, connected, current, or safe to query.

Before relying on a service:

1. Confirm the actual connection.
2. Inspect its advertised operations.
3. Verify project scope.
4. Protect sensitive paths and private memory.
5. Confirm data freshness against source.
6. Use incremental maintenance only when supported.

Do not invent unsupported tool names or assume persistent background indexing.

See [CodeGraph](codegraph.md) and [Project Knowledge](memory.md).

## Host Compatibility

| Capability                 | OpenCode                              | Codex                       | Claude Code                 |
| -------------------------- | ------------------------------------- | --------------------------- | --------------------------- |
| Shared instructions        | Native project discovery              | Native project discovery    | `CLAUDE.md` reference       |
| Canonical skills           | Host discovery                        | Host discovery              | Host discovery              |
| Shared executable scripts  | Explicit workflow                     | Command-hook adapters       | Command-hook adapters       |
| Post-edit quality feedback | Explicit command                      | Advisory hook               | Advisory hook               |
| Git safety                 | Instructions and declared permissions | Instructions and guards     | Instructions and guards     |
| CodeGraph / memory         | Optional connected services           | Optional connected services | Optional connected services |

Native host acceptance must be verified independently.

The table describes intended integration paths, not proof that every host accepts the checked-in configuration.

## Configuration Limitations

The OpenCode configuration currently declares an intended permissions model, but host compatibility and precedence are not independently established by local validation.

Codex and Claude command hooks use root-relative commands. Start supported sessions from the repository root when relying on these adapters.

Windows shell compatibility and cloud-host hook execution may require additional configuration.

CodeGraph and Serena are external services. Availability and project isolation must be established before use.

## Verification

Validate shared infrastructure:

```bash
pnpm agents:check
pnpm typecheck:agents
pnpm test:agents
pnpm check:all
```

Native verification should include:

- Loading all six canonical skills.
- Correct shared instruction discovery.
- Supported hook loading.
- Protected-path handling in disposable fixtures.
- Git mutation restrictions.
- Host-native permission behavior.
- Platform-specific execution where applicable.

Do not test safety restrictions by making real unauthorized repository changes.

## Code Quality

See [Code Quality](quality.md) for:

- Structural limits.
- Module boundaries.
- TypeScript and test requirements.
- Post-edit feedback.
- Configuration loader interfaces.
- Bash quality tools.

The complete set of project rules remains in [AGENTS.md](../../AGENTS.md).
