# Changelog

All notable changes to QuotaWeave are documented here.

This project follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.1.0] - Initial Source Version

The initial QuotaWeave source version establishes a modular foundation for configurable AI model routing, explainable decisions, and future multi-model orchestration in OpenCode.

### Added

**Core and Routing**

- Configurable routing with task categories, model allowlists, provider and capability filtering.
- Candidate scoring using configured capability, cost, and latency information.
- Routing decisions with candidate rankings and exclusion explanations.
- Simulation without provider requests or active model switching.
- Policy evaluation with rules, conditions, actions, and approval requirements.
- In-memory quota allocations, reservations, replenishment, and threshold events.
- Workflow execution primitives with dependencies, retries, sequential and parallel steps, and in-memory history.

**OpenCode Integration**

- OpenCode plugin with routing inspection and simulation tools.
- Terminal dashboard with six views: Overview, Models, Routing, Policies, Simulate, and System.
- Four routing-related terminal commands.
- V2 server tools: `route_status`, `route_models`, and `route_simulate`.

**MCP Integration**

- MCP server package with stdio transport.
- `health_check` and `quota_status` handlers.
- Programmatic `QuotaWeaveMcpServer` API.

**Developer Infrastructure**

- TypeScript/pnpm monorepo with three packages.
- Strict TypeScript, ESLint, Prettier, and Vitest configuration.
- Automated tests and structural code-quality checks.
- GitHub Actions workflows for builds, tests, linting, type checking, package validation, and dependency auditing.
- Shared developer rules and six canonical coding-agent skills.
- Classical GitFlow contribution and release process.
- Architecture, development, testing, security, and contribution documentation.

### Fixed

- Model inspector selection reactivity.
- Model-row identifier and status handling.
- Routing-tab navigation and dispatch.
- Native simulation argument validation and result handling.

### Scope

Version 0.1.0 provides the initial routing, inspection, simulation, and integration foundations.

Autonomous OpenCode model switching, live provider quota synchronization, intelligent Decision Models, and coordinated Agent Mesh execution are planned for future milestones.

The source version does not imply npm publication, verified native-host interoperability, or full implementation of the roadmap.

See the [Roadmap](ROADMAP.md) for upcoming development.