# QuotaWeave

**Smarter model decisions. Better use of your AI budget.**

_Making agentic coding more accessible with free and affordable AI models._

QuotaWeave is an open-source TypeScript project for configurable AI model routing, explainable decisions, and future multi-model orchestration in [OpenCode](https://opencode.ai).

Not every development task needs an expensive AI model. Codebase exploration, planning, implementation, testing, and review have different requirements.

QuotaWeave aims to help developers understand model choices and make better use of available AI capabilities, particularly when working with limited quotas or modest budgets.

The long-term vision is to coordinate approved models according to their strengths, availability, and configured constraints while keeping developers in control.

## Overview

**QuotaWeave v0.1.0 establishes the project's initial foundation.**

The current implementation includes:

- Configurable model routing and candidate evaluation.
- Explainable routing decisions and simulations.
- Policy evaluation and in-memory quota management.
- Reusable workflow orchestration primitives.
- An OpenCode terminal dashboard with six views.
- MCP server diagnostics and integration foundations.

The project is under active development. Configuration-based routing and simulation are implemented; automatic OpenCode model switching, live provider quota synchronization, and autonomous multi-model orchestration are future capabilities.

This repository provides the source code and development setup. Public npm distribution and native-host compatibility should not be assumed without separate verification.

## Why QuotaWeave?

Agentic coding should not depend on using a premium AI model for every task.

Developers using free tiers, affordable models, or limited subscriptions face several challenges:

- **Limited quotas:** Advanced models may have restrictive usage allowances.
- **Different strengths:** Models differ in coding, reasoning, exploration, and review capabilities.
- **Unnecessary costs:** Routine tasks may not require premium capabilities.
- **Multiple providers:** Available models can be distributed across services and subscriptions.
- **Limited transparency:** Understanding why a model is selected can be difficult.

QuotaWeave provides a foundation for configurable, explainable routing and future quota-aware decisions.

**The goal is not to replace powerful models, but to use them where their capabilities matter most.**

## Features

### Configurable Model Routing

The routing engine evaluates configured model candidates using:

- Model allowlists and task categories.
- Provider and capability filters.
- Configured cost and latency estimates.
- Free-only restrictions.
- Candidate scoring and ranking.
- Eligibility and exclusion explanations.

Routing currently uses deterministic scoring and user-provided configuration. It does not automatically switch the active model in OpenCode.

### Routing Simulation

Simulate routing decisions without contacting an AI provider.

Simulations support task evaluation, candidate comparisons, score inspection, and exclusion explanations.

Simulation does not consume provider model quota, change the active OpenCode model, or guarantee that a provider will accept a real request.

### Policy Evaluation

The policy engine provides:

- Rule registration and evaluation.
- Conditional decisions.
- Policy actions.
- Approval requirements.

Calling applications are responsible for acting on policy results. The current implementation does not automatically enforce every policy across OpenCode execution.

### Quota Management

The core includes:

- In-memory quota allocations.
- Reservations.
- Periodic replenishment.
- Threshold events.
- In-memory usage tracking.

These are reusable quota-management primitives, not live provider account synchronization or cross-session spending enforcement.

### Workflow Orchestration

The workflow foundation supports:

- Dependency-ordered execution.
- Sequential and parallel steps.
- Nested execution steps.
- Retries.
- In-memory execution history.

Actual AI model invocation requires an executor supplied by the calling application. Autonomous agent coordination is not currently integrated into OpenCode.

## OpenCode Integration

QuotaWeave includes an OpenCode plugin with a terminal dashboard and routing inspection tools.

### Terminal Dashboard

| View         | Purpose                                              |
| ------------ | ---------------------------------------------------- |
| **Overview** | Inspect routing configuration and status.            |
| **Models**   | Explore configured model information.                |
| **Routing**  | Inspect routing categories and candidate evaluation. |
| **Policies** | Review configured policies and constraints.          |
| **Simulate** | Preview routing decisions.                           |
| **System**   | Inspect configuration and integration information.   |

### Commands

| Command                  | Purpose                      |
| ------------------------ | ---------------------------- |
| `/route`                 | Open the overview.           |
| `/route-status`          | Display routing status.      |
| `/route-models`          | Open the model explorer.     |
| `/route-simulate <task>` | Simulate routing for a task. |

The OpenCode V2 server adapter also defines:

- `route_status`
- `route_models`
- `route_simulate`

These tools inspect and simulate routing. They do not automatically select the active OpenCode model.

Automated tests cover relevant plugin behavior. Actual command registration, terminal interaction, and integration compatibility should be verified with the installed OpenCode version.

## MCP Integration

QuotaWeave includes an MCP server package with stdio transport and two diagnostic tools.

| Tool           | Purpose                                           |
| -------------- | ------------------------------------------------- |
| `health_check` | Return basic server health information.           |
| `quota_status` | Inspect the server's in-memory quota information. |

Health currently uses a static response. Quota information is local to the MCP server and does not represent live provider accounts or the OpenCode plugin's session state.

The package exposes a programmatic `QuotaWeaveMcpServer` API. A working standalone CLI bootstrap and real MCP-client interoperability have not yet been established.

See [Architecture — MCP Adapter](docs/architecture.md#mcp-adapter) for the implementation boundaries.

## Getting Started

QuotaWeave is currently intended for source-based development and testing.

### Requirements

- Node.js 24 or newer.
- pnpm 12.x, with version 12.15.0 pinned in the project.
- Git.
- OpenCode for native plugin integration testing.

ShellCheck and shfmt are required for the complete development quality checks.

### Install and Build

Clone the repository:

```bash
git clone https://github.com/djredflame/opencode-quotaweave.git
cd opencode-quotaweave
```

Install dependencies:

```bash
pnpm install --frozen-lockfile
```

Build all packages:

```bash
pnpm build:all
```

Installation also runs the configured preparation build.

Run the complete local checks:

```bash
pnpm check:all
```

Package coverage is checked separately:

```bash
pnpm test:coverage
```

See [Contributing](CONTRIBUTING.md) and [Testing](docs/testing.md) for additional information.

## Configuration

Start with [router.example.json](router.example.json).

Copy it into the project directory used by QuotaWeave:

```bash
cp router.example.json router.json
```

Review the example and replace its provider and model information with values appropriate to your environment.

Configuration supports:

- Provider and model identifiers.
- Model capabilities.
- Task categories.
- Cost classifications and estimates.
- Latency estimates.
- Routing eligibility rules.
- Free-only filtering.

The example contains both free and paid models. Set `freeOnly` to `true` to exclude candidates classified as paid or unknown-cost.

An optional `router.project.json` supports project-specific overrides.

`QUOTAWEAVE_CONFIG_PATH` can select an explicit global configuration file.

**Security:** Do not store credentials in routing configuration. Project overrides must currently be treated as trusted configuration because restrictive-only override behavior is not fully enforced.

QuotaWeave does not automatically retrieve current provider prices, quotas, or availability.

For configuration loading, validation, and routing limitations, see [Architecture](docs/architecture.md#routing-and-configuration).

## Local Plugin Development

From the repository root:

```bash
pnpm dev:plugin
```

This builds and deploys the local OpenCode plugin artifacts into the project's `.opencode/plugins/opencode-quotaweave/` directory.

Start OpenCode from the checkout and verify that the plugin and commands are available.

This is a development workflow, not a verified public package-installation method.

## Architecture

QuotaWeave uses a TypeScript/pnpm monorepo with three primary packages.

| Package                                | Responsibility                                       |
| -------------------------------------- | ---------------------------------------------------- |
| `@opencode-quotaweave/core`            | Routing, policies, quotas, and workflow primitives.  |
| `@opencode-quotaweave/opencode-plugin` | OpenCode integration, tools, and terminal dashboard. |
| `@opencode-quotaweave/mcp-server`      | MCP diagnostics and server integration.              |

The dependency direction is:

```text
opencode-plugin --> core <-- mcp-server
```

The core separates reusable domain logic from platform-specific adapters. Host integrations provide external file access and other runtime-specific behavior.

The repository also includes strict TypeScript validation, automated tests, code-quality checks, and developer infrastructure.

Read the [Architecture Guide](docs/architecture.md) for detailed implementation boundaries.

## Roadmap

| Milestone                            | Focus                                                                                                               |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| **v0.1.0 — Foundation**              | Configurable routing, simulation, policies, quota and workflow primitives, OpenCode dashboard, and MCP diagnostics. |
| **v0.2.x — Decision Intelligence**   | Configurable Decision Models, approved model pools, and task classification.                                        |
| **v0.3.x — Active Routing**          | Native OpenCode model selection and controlled transitions.                                                         |
| **v0.4.x — Quota Brain**             | Usage observations, quota-aware decisions, cooldowns, and controlled recovery.                                      |
| **v0.5.x — Agent Mesh**              | Coordinated task decomposition and model delegation.                                                                |
| **v0.6+ — Ecosystem & Optimization** | Expanded MCP integrations, diagnostics, and efficiency improvements.                                                |

The long-term vision is a development workflow in which affordable models handle routine exploration, specialized models contribute to implementation and review, and stronger reasoning models are used where their capabilities provide meaningful value.

These future capabilities are not part of the current autonomous OpenCode execution path.

See the complete [Roadmap](ROADMAP.md) for planned milestones and their boundaries.

## Current Limitations

QuotaWeave's initial foundation is not a complete autonomous routing platform.

Current limitations include:

- No automatic OpenCode model switching.
- No live provider quota, price, or availability synchronization.
- No autonomous OpenCode multi-agent execution.
- No account-wide or cross-session spending enforcement.
- No verified standalone MCP CLI bootstrap.
- Native OpenCode and MCP host compatibility still requires manual verification.

Round-robin rotation and weighted model selection are implemented in the core routing engine. Other configurable strategies and constraints are not fully implemented, including configurable score weighting, total-request cost enforcement, and restrictive-only project overrides.

Simulation is an explanation of configured decisions, not proof of provider access or successful execution.

See [Architecture](docs/architecture.md) and [Testing](docs/testing.md) for detailed technical and verification boundaries.

## Development Workflow

QuotaWeave follows classical GitFlow.

| Branch           | Purpose                                     |
| ---------------- | ------------------------------------------- |
| `main`           | Stable source and release branch.           |
| `develop`        | Integration branch for ongoing development. |
| `feature/*`      | Feature development from `develop`.         |
| `release/vX.Y.Z` | Release stabilization from `develop`.       |
| `hotfix/*`       | Urgent fixes from `main`.                   |

The intended flow is:

- Features merge into `develop`.
- Release branches merge into `main`, followed by tagging and synchronization back into `develop`.
- Hotfix branches merge into `main`, followed by synchronization back into `develop`.

Normal releases do not merge `develop` directly into `main`.

GitHub branch protection and mandatory status checks are repository settings and must be configured separately.

See [Contributing](CONTRIBUTING.md#gitflow-workflow) for the full procedure.

## Development & AI Transparency

QuotaWeave is an independently maintained open-source project.

The project's architecture, technical direction, development priorities, and release decisions are guided by the human maintainer.

AI-assisted development tools support implementation, refactoring, testing, and documentation. Changes are evaluated through project quality checks and maintainer review as available.

Much of the documentation is maintained with AI assistance. It may contain errors, outdated statements, or assumptions that have not been independently verified.

**Source code, automated tests, and verified runtime behavior remain the authoritative technical references.**

Corrections and contributions that improve documentation accuracy are welcome.

## Contributing

Contributions, bug reports, technical feedback, and documentation improvements are welcome.

QuotaWeave follows a **fork-and-pull-request workflow**. Contributors fork the repository, create their own branches, and submit pull requests targeting `develop`.

All contributions are reviewed, and **only the project maintainer approves and merges changes into the upstream repository**.

- [Contributing Guide](CONTRIBUTING.md) — Fork setup, development workflow, and pull requests.
- [Shared Development Rules](AGENTS.md) — Engineering and coding-assistant guidance.
- [Code of Conduct](CODE_OF_CONDUCT.md) — Community expectations.
- [Roadmap](ROADMAP.md) — Planned milestones.
- [Changelog](CHANGELOG.md) — Version history.

Report security vulnerabilities privately through [SECURITY.md](SECURITY.md).

## License

QuotaWeave is licensed under the [MIT License](LICENSE).

This is an independent community project and is not developed, sponsored, or endorsed by the OpenCode team.
