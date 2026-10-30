# Testing

QuotaWeave uses automated tests, strict TypeScript checks, structural validation, and CI workflows.

This document describes the current test infrastructure and its verification boundaries.

## Test Organization

### Core

Core tests cover:

- Policy evaluation and operators.
- Configuration validation and loading boundaries.
- Candidate-based and configured routing.
- Routing simulations and refusals.
- Quota allocation, reservations, and replenishment.
- Workflow execution, nested steps, and retries.
- Events, utilities, and cross-module behavior.

Core integration tests use real core components rather than requiring an external OpenCode host.

### OpenCode Plugin

Plugin tests cover:

- Plugin class behavior.
- Tool arguments and output.
- TUI state and model selection.
- Routing view behavior.
- Host bindings and view registration.
- Reactivity, keyboard focus, and scrolling.
- Simulation input and output.
- Solid build transformation.

Host interfaces are mocked or represented through fixtures where necessary.

Passing these tests does not prove that the plugin loads successfully in every native OpenCode version.

### MCP Server

MCP tests cover server behavior and tool handlers using mocked SDK classes.

These tests do not establish real stdio interoperability or confirm acceptance by an external MCP client.

### Agent Infrastructure

Agent infrastructure fixtures use Node's built-in test runner.

They test recognized hook inputs, command and path restrictions, structural validation, and feedback behavior.

They do not guarantee that OpenCode, Claude Code, or Codex will accept every declared native configuration.

## Commands

Run all package tests:

```bash
pnpm test:all
```

Run individual package tests:

```bash
pnpm --filter=@opencode-quotaweave/core test
pnpm --filter=@opencode-quotaweave/opencode-plugin test
pnpm --filter=@opencode-quotaweave/mcp-server test
```

Run agent infrastructure tests:

```bash
pnpm test:agents
```

Run test TypeScript validation:

```bash
pnpm typecheck:tests
```

Run code-quality checks:

```bash
pnpm quality:changed
pnpm quality:all
```

Run the full local check:

```bash
pnpm check:all
```

Run package coverage separately:

```bash
pnpm test:coverage
```

The complete check includes configured linting, formatting, type checking, build validation, package tests, and development infrastructure checks.

It does not automatically run all package coverage reports.

## Coverage

The project targets at least 80% coverage for statements, branches, functions, and lines.

| Scope | Current enforcement |
|---|---|
| Core | Numeric 80% thresholds |
| MCP Server | Numeric 80% thresholds |
| OpenCode Plugin | Coverage reporting without numeric thresholds |
| Agent Infrastructure | Node test coverage thresholds |

Plugin coverage is a known gap relative to the project's coverage policy.

Do not interpret a successful plugin coverage command as evidence that the 80% policy has been met.

Coverage reports are generated locally and must be refreshed before quoting current percentages.

## Testing Conventions

- Test observable behavior through public APIs.
- Cover refusals, missing configuration, and error paths.
- Add regression tests when fixing bugs.
- Use meaningful test names and assertions.
- Mock external host and network boundaries.
- Use real domain components where cross-module behavior matters.
- Await asynchronous assertions and clean up listeners, timers, and resources.
- Avoid arbitrary timeout increases that conceal unresolved work.
- Never weaken assertions, coverage thresholds, or diagnostics merely to obtain a passing result.

Follow the structural limits documented in [AGENTS.md](../AGENTS.md) and [Code Quality](development/quality.md).

## GitHub Actions

The repository defines eight GitHub Actions workflows:

- `agent-infrastructure.yml`
- `audit.yml`
- `build.yml`
- `lint.yml`
- `test.yml`
- `typecheck.yml`
- `validate-artifacts.yml`
- `validate-structure.yml`

The workflow branch filters have been prepared for `main` and `develop`.

The test workflow declares a Node 24 matrix for Linux, macOS, and Windows.

The infrastructure workflow also declares platform-specific validation.

Local workflow execution with `act` has been used for Linux-oriented verification. Seven workflows were reported successful locally; the dependency audit remained separate.

This does not establish successful remote GitHub Actions runs on all operating systems.

## Local CI Emulation

`act` can be used to emulate supported GitHub Actions jobs locally.

It does not fully reproduce GitHub-hosted runners or native macOS and Windows environments.

See [Local CI](development/local-ci.md) for the available wrapper and known limitations.

## Manual Integration Verification

Before treating v0.1.0 as a verified native integration, test:

### OpenCode

- Plugin discovery and startup.
- All four terminal commands.
- All six dashboard views.
- Keyboard and mouse interaction.
- Focus and scrolling behavior.
- Configuration loading and error presentation.
- Routing simulation without active model switching.
- Native host permissions and tool registration.

### MCP

- Server startup through a supported entry point.
- Real stdio client connection.
- Tool listing and invocation.
- Response compatibility.
- Handling of invalid or unknown requests.
- Clean shutdown.

### Packaging

- Package archives and public exports.
- Fresh installation from generated tarballs.
- Workspace dependency resolution.
- Plugin server and TUI entry points.

A previously reported source-only package verification passed local archive installation/import checks. Native OpenCode and MCP interoperability are distinct requirements.

## Interpreting Results

A successful source test does not necessarily prove deployment readiness.

Distinguish:

1. Unit and fixture tests.
2. Cross-module integration tests.
3. Local package installation tests.
4. Emulated GitHub Actions.
5. Actual remote GitHub Actions.
6. Real native-host integration tests.

Record the relevant scope and date when reporting verification results.

For implementation limitations, see [Architecture](architecture.md).