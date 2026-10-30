# Architecture

This document describes the implemented architecture of QuotaWeave v0.1.0 and the boundaries of its current integrations.

Future capabilities are described separately in the [Roadmap](../ROADMAP.md).

## Package Structure

QuotaWeave is a TypeScript/pnpm monorepo with three primary packages.

```text
@opencode-quotaweave/opencode-plugin
                  |
                  v
       @opencode-quotaweave/core
                  ^
                  |
   @opencode-quotaweave/mcp-server
```

| Package           | Responsibility                                              |
| ----------------- | ----------------------------------------------------------- |
| `core`            | Routing, configuration, policies, quotas, and workflows     |
| `opencode-plugin` | OpenCode integration, routing tools, and terminal dashboard |
| `mcp-server`      | MCP diagnostics and stdio server integration                |

Core has no direct platform filesystem imports. External file operations are supplied through `ConfigFileAccess`.

Platform independence does not imply that core is side-effect-free: quota management and workflows can use timers, events, and in-memory state.

## Public Package Entry Points

### Core

`@opencode-quotaweave/core` exports its public domain APIs through `src/index.ts`.

The package provides engines, configuration loaders, domain types, and the `QuotaWeaveCore` facade.

### OpenCode Plugin

The plugin exports several entry points:

- Root and server exports for the V2 adapter.
- A separate legacy OpenCode adapter.
- A TUI entry point.
- Package metadata.

The plugin's root export is not interchangeable with all internal source modules.

Do not assume that private plugin factories or native automatic model-selection hooks are publicly exported.

### MCP Server

The MCP package publicly exports:

- `QuotaWeaveMcpServer`
- `McpServerConfig`
- `VERSION`

Internal helper functions are not necessarily part of the public package contract.

Always import packages through declared exports rather than private source or build paths.

## Routing and Configuration

### Configured Routing

`QuotaWeaveCore.route()` uses `ConfigRoutingEngine`.

This engine evaluates configured candidates using:

- Task categories.
- Enabled models and allowlists.
- Capability requirements.
- Provider constraints.
- Cost estimates.
- Caller-provided cooldown state.
- Deterministic score profiles.

Routing may return a refusal with no selected model.

A successful candidate evaluation is not an actual provider invocation or automatic OpenCode model switch.

### Legacy Candidate Routing

The separately exported `RoutingEngine` supports candidate-based routing and its own custom-strategy and fallback behavior.

This is distinct from `ConfigRoutingEngine`.

Features implemented in the legacy engine must not be described as automatic fallback or native model switching in the configured OpenCode integration.

### Configuration Loading

The core loader accepts:

```typescript
findAndLoadConfig(projectRoot, configPathOrUndefined, configFileAccess);
```

It loads an explicit global configuration path or `router.json`, with an optional `router.project.json` under the project root.

There is no implicit home-directory discovery guarantee.

Configuration validation is performed by runtime validators. The provided `schema.json` is an editor aid and is not identical to all runtime validation rules.

### Project Overrides

Project-specific configuration is intended to narrow global settings.

The current validators reject newly introduced model and category identities, but they do not fully prevent changes that relax existing cost or model restrictions.

In particular, some global free-only and cost settings can be relaxed through project overrides.

**Treat project overrides as trusted configuration until restrictive-only enforcement is completed.**

Callers that use `resolveConfig` directly must validate their inputs first.

### Scoring and Strategies

Configured routing uses fixed scoring profiles.

Important limitations:

- Configured `round-robin` rotates eligible candidates deterministically.
- Configured `weighted` uses Smooth Weighted Round Robin with per-model `weight` (default `1.0`; zero-weight models are never selected).
- Rotation and weighting state is runtime-only, isolated per category and router instance, and resets when the eligible candidate set or configured model weights change.
- Configured `custom` scoring currently uses fixed factors.
- Some configured strategy-weight keys do not match the score-factor keys consumed by the scorer.
- The configured quota score is currently a constant placeholder.
- The legacy candidate engine has different scoring capabilities.

Configured cost limits compare estimates per 1,000 tokens rather than actual total request cost.

Session budget fields are not live spend enforcement.

### Cooldowns and Recovery

Caller-supplied cooldown state can exclude candidates.

Provider failures do not currently produce a complete automatic observation, backoff, and recovery cycle.

Shadow-mode and multi-agent configuration fields do not establish execution of those features.

### Simulation

`ConfigRoutingEngine.simulate()` provides detailed candidate scores, exclusion reasons, and routing context.

`QuotaWeaveCore.simulateRouting()` exposes a simpler result through the core route path.

These are distinct API surfaces.

Category inference in configured routing uses keyword heuristics rather than an LLM decision engine.

Simulation does not call a provider or consume model quota.

## Policy Engine

`PolicyEngine` supports:

- Policy registration and validation.
- Priority-ordered rule evaluation.
- Condition matching.
- Decisions, actions, and approval requirements.

The engine returns evaluation results for callers to handle.

It does not directly execute model changes, notifications, or a human approval interface.

Missing policies default to allow.

Some core policy context values are placeholders rather than live provider or quota telemetry.

## Quota Management

`QuotaManager` maintains:

- Registered quotas.
- Allocations and reservations.
- Periodic replenishment.
- Threshold events.
- In-memory usage history.

Reservation expiration is processed through the replenishment interval rather than guaranteed at the exact expiration instant.

The manager does not automatically register or charge quotas from routing configuration, synchronize provider accounts, or persist its state.

Quota lookup for a model currently matches global and model-ID scopes rather than every declared scope type.

Consumers should shut down quota managers to release timers and listeners.

## Workflow Orchestration

`WorkflowOrchestrator` supports dependency-ordered steps and built-in executors for:

- Routing.
- Policy checks.
- Quota allocation and release.
- Model invocation interfaces.
- Data transformations.
- Conditions.
- Parallel and sequential nested steps.

Retry helpers, events, and bounded in-memory history are implemented.

Parallel and sequential steps can contain nested steps; this does not constitute a general persistent nested-workflow engine.

Custom step types require a consumer-provided executor.

Timeout and abort checks do not guarantee interruption of an already-running external provider call.

Persistence settings do not currently implement persistent execution history.

The default core model-invocation service rejects invocation. Neither platform adapter currently provides complete autonomous provider execution.

## OpenCode Integration

The OpenCode plugin contains separate V2 and legacy adapters.

### V2 Server Adapter

The V2 adapter defines tools named:

- `route_status`
- `route_models`
- `route_simulate`

These provide status inspection, configured model information, and routing simulation.

The legacy adapter uses dotted tool names.

Neither adapter currently establishes native automatic model-selection routing.

### Terminal Dashboard

The TUI implements six views:

- Overview
- Models
- Routing
- Policies
- Simulate
- System

Four terminal commands are registered in the implementation:

- `/route`
- `/route-status`
- `/route-models`
- `/route-simulate`

Policies and System display configuration and integration information, not live provider telemetry.

Model filtering, selection, scrolling, focus, and simulation are covered by automated tests with mocked host boundaries where necessary.

### Plugin Build

The plugin build includes TypeScript compilation and a Solid transformation step.

The watch build does not perform every transformation used by the full build.

For local development:

```bash
pnpm dev:plugin
```

This builds and deploys the local plugin artifacts. Native OpenCode loading must still be verified in the installed host.

## MCP Adapter

`QuotaWeaveMcpServer` provides a programmatic server class.

Calling `start()` initializes handlers and connects a `StdioServerTransport`.

The server currently exposes:

- `health_check`
- `quota_status`

The health response is static.

Quota status describes the MCP server's own in-memory quota state. It is not synchronized with the OpenCode plugin or provider accounts.

HTTP and WebSocket transport selections are not implemented and currently throw.

### Startup Limitations

The package does not provide a verified standalone CLI or `bin` bootstrap.

Its package start and development scripts target an entry point that exports symbols without automatically starting the server.

Consumers must construct the server and explicitly call `start()`.

### Interoperability Limitations

Current handler tests use mocked MCP SDK boundaries.

They do not establish:

- Successful connection from a real MCP client.
- Complete wire-protocol response compatibility.
- Correct startup through the package scripts.
- Real-client shutdown behavior.

The current MCP implementation does not expose routing, workflow execution, resources, or prompts through additional registered tools.

## Builds and Verification

The workspace uses TypeScript project references with strict compiler settings.

Builds follow dependency order, and the plugin has an additional TUI transformation step.

Useful commands:

```bash
pnpm build:all
pnpm typecheck:tests
pnpm test:all
pnpm check:all
pnpm test:coverage
```

Full local checks do not automatically establish package coverage or native host interoperability.

See [Testing](testing.md) for coverage enforcement, CI details, and verification requirements.

For coding-agent infrastructure, see [Shared Agent Infrastructure](development/agent-infrastructure.md).

## Future Architecture

Planned additions include Decision Models, configurable model pools, native active routing, quota observations, controlled recovery, and Agent Mesh coordination.

These will extend the current primitives rather than being treated as already implemented.

See the [Roadmap](../ROADMAP.md).
