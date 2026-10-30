# Local CI

QuotaWeave uses local quality checks and GitHub Actions workflows for automated validation.

This document describes the available commands, CI workflow inventory, and local execution limitations.

## Requirements

For the complete local checks:

- Node.js 24 or newer.
- pnpm 12.x.
- Installed workspace dependencies.
- ShellCheck.
- shfmt.

For GitHub Actions emulation:

- Docker.
- `act`.
- Suitable runner images.

## Canonical Local Check

Run:

```bash
pnpm check:all
```

This includes the project's configured:

- Agent infrastructure validation and tests.
- TypeScript checks.
- Code-quality and architecture checks.
- Formatting checks.
- Bash formatting and ShellCheck.
- Package builds.
- Package tests.

Package coverage is separate:

```bash
pnpm test:coverage
```

Additional checks:

```bash
pnpm agents:check
pnpm test:agents
pnpm quality:changed
pnpm quality:all
pnpm format:check
pnpm format:bash:check
pnpm lint:bash
```

There is no root `agents` command. Use `agents:check`.

## CI Workflows

The repository defines eight GitHub Actions workflows.

| Workflow                   | Purpose                                             |
| -------------------------- | --------------------------------------------------- |
| `agent-infrastructure.yml` | Agent validation, type checks, and fixture coverage |
| `audit.yml`                | Dependency security auditing                        |
| `build.yml`                | Package builds and output validation                |
| `lint.yml`                 | Code quality, linting, and formatting               |
| `test.yml`                 | Package tests and configured coverage               |
| `typecheck.yml`            | TypeScript validation                               |
| `validate-artifacts.yml`   | Package archives and installation validation        |
| `validate-structure.yml`   | Repository structure and manifest validation        |

The workflows have been prepared for `main` and `develop` integration.

Pull request branch filters target the destination branch. They do not automatically enforce GitFlow source-branch restrictions.

No automatic publishing or release workflow is established.

## Local Workflow Emulation

The repository includes:

```bash
./scripts/bash/ci-local.sh test.yml
```

This wrapper uses `act` and Docker for local workflow execution.

It may install dependencies, run containers, and create temporary environment files.

It is not an offline or read-only operation.

Only run it in an environment where those actions are permitted.

### Platform Limitations

`act` generally runs Linux containers and cannot establish native macOS or Windows results.

Runner image behavior, matrix selection, actions, and local credentials may differ from actual GitHub-hosted execution.

## Previously Observed Local Results

During pre-push verification, seven of the eight workflows were reported successful through local `act` execution.

The dependency audit was not included in that successful set.

The test workflow required an explicit Ubuntu matrix selection and runner mapping for local execution.

These results are historical local verification, not evidence that all GitHub Actions runs have passed remotely.

After the first push, inspect actual GitHub Actions results for both long-lived branches.

## Package Artifact Validation

The artifact workflow is intended to:

1. Build the workspace.
2. Pack the three packages.
3. Inspect archive contents.
4. Install generated archives in a disposable consumer.
5. Check public imports and dependency resolution.

Previous local source-only verification reported successful package packing and installation/import checks.

This does not establish npm publication or native OpenCode/MCP host compatibility.

## Existing Shell Wrappers

The repository contains:

- `scripts/bash/ci-local.sh`
- `scripts/bash/quality.sh`
- `scripts/bash/git-safety-check.sh`

These wrappers have different scopes.

`quality.sh` and `ci-local.sh` are not complete replacements for `pnpm check:all`.

Some wrapper installation paths have historically suppressed installation failures when an existing dependency directory was present. Do not interpret that as proof of a successful fresh installation.

The Git-safety wrapper delegates to structural validation. It is not a universal shell-command analyzer.

## Manual Release Verification

Before an official release:

- Review full local checks.
- Run applicable coverage checks.
- Confirm actual GitHub Actions results.
- Verify package installation and exports.
- Test the plugin in the intended OpenCode version.
- Test the MCP server with a real client.
- Confirm versioning and changelog consistency.

See [Testing](../testing.md) and [Contributing — Release Preparation](../../CONTRIBUTING.md#release-preparation).
