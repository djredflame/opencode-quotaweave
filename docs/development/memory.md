# Project Knowledge and Memory Workflow

QuotaWeave uses repository documentation as the durable source of project knowledge.

Optional connected knowledge and memory services may support retrieval and maintenance when their capabilities are verified.

The repository does not currently establish a verified automatic memory-capture system.

## Principles

Project knowledge should be:

- Relevant to the active repository.
- Supported by source or validated results.
- Clear about verification scope and date.
- Free from credentials and private information.
- Maintainable without duplicate or conflicting records.

Project documentation is preferred over unverified memory-service assumptions.

## Retrieval

Before using an external knowledge service:

1. Confirm that it is connected.
2. Inspect the operations actually available.
3. Confirm project scope and access permissions.
4. Retrieve only information relevant to the current task.
5. Verify important findings against current source and documentation.

Do not assume that a configured service is active.

Do not invent memory APIs, metadata fields, or successful retrieval results.

Never inspect memories from other projects or private local stores when access is not explicitly authorized.

## Maintenance

After meaningful validated changes, update relevant project knowledge when an authorized service provides a supported update operation.

Preserve:

- The project or component.
- A concise description of the change.
- Relevant source paths.
- Verification evidence.
- Known limitations.
- The verification date, where useful.

Prefer updating an existing record by a stable identity over creating duplicate entries.

Do not store:

- Credentials or tokens.
- Private routing configuration.
- Transcripts or private conversations.
- Temporary debug output.
- Unverified claims.
- Full source dumps.

## Repository Fallback

When no verified memory service is available, maintain durable knowledge in the relevant repository documentation.

Typical destinations include:

- `docs/architecture.md`
- `docs/testing.md`
- `docs/development/quality.md`
- `docs/development/agent-infrastructure.md`

Additional topic records may be maintained under `docs/development/knowledge/` when justified and explicitly created.

Repository Markdown files are reviewable project documentation, not a connected memory runtime.

Historical audit reports should not replace maintained technical guidance.

## Agent Hooks

Existing hooks provide reminders and shared development context.

They do not automatically retrieve project memories, capture conversations, synchronize knowledge stores, or maintain background indexing.

Before a task handoff, preserve the objective, decisions, changed files, verification, limitations, and remaining work in the task context.

See [Shared Agent Infrastructure](agent-infrastructure.md).
