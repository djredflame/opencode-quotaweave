# QuotaWeave Roadmap

QuotaWeave aims to make agentic coding more accessible through intelligent use of free, affordable, and user-approved AI models.

This roadmap outlines the intended development direction. Milestones are planning targets, not guaranteed release dates or delivery commitments.

## v0.1.0 — Foundation

**Initial source version**

The initial implementation establishes the technical foundation for future intelligent routing.

Implemented components include:

- Configuration-based routing, candidate filtering, scoring, and explanations.
- Routing simulation without provider invocation.
- Policy evaluation primitives.
- In-memory quota management.
- Dependency-ordered workflow execution primitives.
- OpenCode tools and a six-view terminal dashboard.
- MCP stdio server class with health and quota diagnostics.
- Automated tests, development tooling, and GitHub Actions workflows.

The current implementation does not automatically select OpenCode's active model, retrieve live provider quotas, or execute multi-model agent workflows.

Native OpenCode loading and MCP client interoperability require separate verification.

See [README — Features](README.md#features), [Architecture](docs/architecture.md), and [Testing](docs/testing.md).

## v0.2.x — Decision Intelligence

**Planned**

- Configurable Decision Models, separate from execution models.
- User-approved model pools with explicit provider and model allowlists.
- Task classification and category recommendations.
- Explainable model recommendations.
- More flexible capability-based routing.
- Improved configuration validation.
- Better cost and latency estimation.
- Preparation for integration with active OpenCode routing.

Decision Models are intended to support model selection, not silently override user-approved providers, models, or cost boundaries.

## v0.3.x — Active Routing

**Planned**

- Native OpenCode model-selection integration.
- Controlled changes to the active execution model.
- Session-aware routing decisions.
- Explicitly approved fallback and recovery paths.
- Runtime provider-state integration where supported.
- Visible routing decisions and integration diagnostics.
- Configuration reload improvements.

Native routing must respect user control. Model changes that affect cost, provider access, or other configured constraints should not happen silently.

## v0.4.x — Quota Brain

**Planned**

- Local observations of real usage and rate-limit behavior.
- Comparison of configured estimates with observed consumption.
- Cooldown management and adaptive backoff.
- Provider-specific usage patterns where observable.
- Quota-aware recommendations and controlled fallback.
- Budget warnings and configurable restrictions.
- Usage-history-based predictions.

Quota Brain is intended to build upon the current in-memory quota primitives, not merely rename them.

Provider support will depend on available interfaces and the reliability of observable account information.

## v0.5.x — Agent Mesh

**Planned**

- Task decomposition across development phases.
- Model delegation according to capabilities and configured pools.
- Safe context handoffs.
- Agent coordination and execution control.
- Human approval gates at important transitions.
- Workflow persistence and replay.
- Improved multi-model testing and diagnostics.

A possible workflow could involve an affordable exploration model, a reasoning model for planning, a coding model for implementation, and specialized models for verification.

This describes intended behavior. The current workflow primitives do not automatically orchestrate OpenCode agents.

## v0.6+ — Ecosystem and Optimization

**Planned**

- Expanded MCP diagnostics and integrations.
- Additional transport options where technically justified.
- Efficiency metrics for tokens, latency, and estimated costs.
- Provider comparison and routing analytics.
- Configuration tuning recommendations.
- External monitoring integrations.
- Distribution improvements for supported packages and plugins.
- Exploration of shared or multi-user deployment scenarios.

Future work will be prioritized according to technical feasibility, maintainer capacity, and community feedback.

## Design Principles

QuotaWeave development follows several principles:

1. **Accessibility:** Make useful agentic workflows possible with affordable AI models.
2. **User control:** Respect explicit model allowlists, policies, and approval boundaries.
3. **Transparency:** Explain model decisions and their limitations.
4. **Modularity:** Keep reusable core logic separate from host integrations.
5. **Predictability:** Avoid silently changing providers, models, or spending constraints.
6. **Engineering quality:** Preserve tests, strict typing, and maintainable architecture.

## Current Technical Boundaries

The following are not implemented as complete end-user integrations in v0.1.0:

- Automatic model switching inside OpenCode.
- Live provider quota and price synchronization.
- Real model invocation through the core workflow service.
- Automatic cooldown observations and controlled recovery.
- Agent Mesh coordination.
- Persistent workflow history.
- Complete session-level spending enforcement.

Configured strategy names do not necessarily imply fully implemented scheduling behavior. For example, configured round-robin routing currently does not rotate candidates.

Project-specific configuration overrides also require additional enforcement work before they can be treated as a strict security boundary.

Refer to [Architecture](docs/architecture.md) for current implementation details.

## Release and Verification

Public source availability, Git tags, GitHub Releases, and npm publication are separate events.

The maintainer controls version approval and publication. Release readiness requires the relevant source checks, package validation, and native-host verification.

See [Contributing — Release Preparation](CONTRIBUTING.md#release-preparation) and [Testing](docs/testing.md).

Roadmap items may change as OpenCode, model providers, and available integration interfaces evolve.
