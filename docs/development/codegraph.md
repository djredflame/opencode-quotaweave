# CodeGraph Workflow

QuotaWeave can use a connected CodeGraph service to support source navigation and change-impact analysis.

The repository configuration declares a CodeGraph MCP server:

```text
codegraph serve --mcp --path .
```

This is a configured launch command, not proof that the executable is installed, running, or connected.

## Purpose

CodeGraph may support:

- Locating symbols and definitions.
- Finding callers and dependencies.
- Understanding module relationships.
- Identifying potentially affected tests.
- Reviewing change impact before refactoring.

Graph information should be checked against current source files.

## Using CodeGraph

Before relying on the service:

1. Confirm that a CodeGraph connection is available.
2. Inspect the operations exposed by the connected service.
3. Verify the active project root.
4. Confirm that private files and generated artifacts are excluded.
5. Query relevant symbols and dependencies.
6. Validate returned locations against the repository.

Do not assume specific tool names or commands without confirming the installed version's contract.

## Fallback

If CodeGraph is unavailable, use source inspection and ordinary read-only development tools.

For example:

```bash
rg "symbolName" packages scripts
```

Connected Serena symbol and reference operations may also help when available and authorized.

Do not install global tooling or rebuild an index solely to satisfy a documentation checklist.

## Updating Graph Information

After meaningful source changes:

1. Collect affected source and test paths.
2. Check whether the connected service supports incremental updates.
3. Use a supported update operation only when authorized.
4. Confirm that changed relationships are reflected in subsequent queries.

If indexing happens automatically, verify freshness rather than starting an additional process.

If no verified update operation is available, report:

```text
Graph freshness unknown; maintenance not performed.
```

Do not invent build, reset, watch, or verification commands.

## Security

A configured project path is not a sandbox.

Verify that the service excludes credentials, private routing configuration, local memories, and other sensitive files.

Do not clear graph data, start background watchers, or inspect private local stores without explicit authorization.

## Related Documentation

- [Shared Agent Infrastructure](agent-infrastructure.md)
- [Project Knowledge](memory.md)
- [Code Quality](quality.md)