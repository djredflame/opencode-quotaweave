---
name: git-safety
description: QuotaWeave git-safety responsibilities and validation workflow
version: 1.1.0
---

# Git Safety Skill

Read AGENTS.md section 3 first. Git and GitHub are read-only for every agent, tool and hook. No exceptions, indirect wrappers, staging, history repair or publication actions.

Audit manifest commands and transitive scripts before execution. Inspect the checked-in permission format, modeled denial precedence, private path protection and script side effects; distinguish local structural validation from real host enforcement. Broad branch, CodeGraph, pnpm-exec and act permissions are unsafe. A textual scanner cannot prove arbitrary shell or third-party code safe.

Use pnpm agents:check and manifest-defined checks. The compatibility pnpm git:safety wrapper delegates to the same structural validator; it is not a shell analyzer. Read-only Git inspection may support review but must never alter Git state. Do not dump configurations that may expose credentials.

Output audited commands, permission gaps, residual bypass risks and verification evidence. Record only nonsensitive verified guardrail findings using docs/development/memory.md. The maintainer handles all commits, pushes, merges, publication and incident remediation.
