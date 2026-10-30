# Code Quality and Module Boundaries

QuotaWeave uses strict TypeScript, automated tests, and executable structural quality checks.

The canonical structural limits are defined in `scripts/quality/limits.ts`.

## Structural Limits

| Constraint | Hard limit |
|---|---|
| Code lines per authored file | 300 |
| Code lines per function | 50 |
| Function parameters | 4 |
| Nesting depth | 3 |

Blank lines and comment-only lines are excluded according to the shared counter.

A 250-line review budget provides an advisory warning before a module reaches the hard file limit.

The review budget does not change the 300-line maximum.

Do not compress unrelated statements or remove useful documentation merely to satisfy structural limits.

Split modules around responsibilities and stable interfaces.

## TypeScript Conventions

- Use strict typing.
- Avoid `any` and unsafe suppressions.
- Prefer meaningful variable, type, class, and function names.
- Use explicit type imports where appropriate.
- Keep functions focused on one responsibility.
- Preserve public API contracts.
- Validate external data at runtime.
- Use safe error handling and resource cleanup.

Follow the repository's ESLint and Prettier configuration.

## Daily Development Workflow

Before substantial changes:

1. Inspect relevant source and dependencies.
2. Identify affected tests.
3. Check the current module's responsibilities and size.
4. Use verified project knowledge when available.

After an edit batch:

```bash
pnpm quality:changed
```

This checks staged, unstaged, and untracked authored code, subject to the tool's file selection rules.

Run relevant tests and type checks.

Before completing significant executable changes:

```bash
pnpm check:all
```

To check the full authored source inventory:

```bash
pnpm quality:all
```

These checks must not be weakened merely to make a change pass.

## Package Boundaries

The intended dependency direction is:

```text
opencode-plugin --> core <-- mcp-server
```

The structural checker validates:

- Declared package boundaries.
- Cross-package import restrictions.
- Public package export usage.
- Platform-independent core imports.
- Statically declared runtime module cycles.

Import another package through its declared public exports.

Do not import its private `src` or `dist` paths.

Dynamic imports and arbitrary computed paths are outside the complete coverage of the static dependency analysis.

## Tests

Tests are included in the project's linting, type checking, and structural quality expectations.

- Use behavioral tests for public APIs.
- Preserve meaningful assertions.
- Add regressions for bug fixes.
- Mock external boundaries where appropriate.
- Use real domain components for cross-module integration tests.
- Avoid exposing private internals solely for testing.
- Clean up asynchronous resources.

See [Testing](../testing.md) for coverage thresholds and commands.

## Post-Edit Feedback

Codex and Claude Code contain command-hook adapters for advisory post-edit size feedback.

OpenCode does not currently have an equivalent automatically loaded infrastructure plugin.

For OpenCode development sessions, run:

```bash
pnpm quality:changed
```

after making changes.

Post-edit feedback does not replace the full structural checker.

It does not automatically revert edits or guarantee that every possible input is blocked.

See [Shared Agent Infrastructure](agent-infrastructure.md).

## Configuration File Access

Core configuration loading uses an injected `ConfigFileAccess` interface.

This separates reusable configuration logic from Node-specific filesystem operations.

Example:

```typescript
const loadedConfiguration = await findAndLoadConfig(
  projectRoot,
  configPath,
  configFileAccess,
);
```

Public loader signatures include:

```typescript
loadConfigFile(path, access);
loadGlobalConfig(path, access);
loadProjectConfig(path, globalConfig, access);
findAndLoadConfig(projectRoot, configPathOrUndefined, access);
```

Runtime adapters provide the necessary filesystem operations.

The OpenCode plugin contains a Node-specific file access adapter.

Core loaders reject invalid project configuration. Platform wrappers may catch loading errors while trying configuration candidates.

Configuration load success or a generic warning does not establish that every invalid override is clearly reported to users.

## Routing Simulation Validation

The native simulation handlers consume the configured engine's simulation results and validate incoming tool arguments.

Tests verify that simulation does not invoke models or mutate active routing state.

The detailed engine simulation API and the simpler core simulation facade return different result shapes.

See [Architecture](../architecture.md).

## Bash Quality

The repository uses ShellCheck and shfmt.

Check Bash formatting:

```bash
pnpm format:bash:check
```

Apply Bash formatting:

```bash
pnpm format:bash
```

Run ShellCheck:

```bash
pnpm lint:bash
```

Configuration is maintained in:

- `.shellcheckrc`
- `.shfmtrc`

## Quality Policy

Quality gates are engineering requirements, not optional presentation targets.

Do not:

- Disable diagnostics to conceal failures.
- Reduce coverage thresholds without explicit project approval.
- Skip failing tests to obtain a green result.
- Introduce unsafe types as shortcuts.
- Bypass package boundaries.
- Remove meaningful checks during refactoring.

Fix the underlying issue and preserve observable behavior.