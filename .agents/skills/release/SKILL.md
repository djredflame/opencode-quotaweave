---
name: release
description: QuotaWeave release responsibilities and validation workflow
version: 1.1.0
---

# Release Skill

Read AGENTS.md first. Prepare release documentation and review CI; never perform Git/GitHub writes, publication, deployment or version commands with Git side effects.

Inspect actual manifests, CHANGELOG.md and .github/workflows before describing behavior. Changesets, a version script and a release workflow are not installed/configured here; do not invent commands or automatic release support. SemVer and Conventional Commit naming are maintainer conventions, not Git permissions.

Use manifest-defined build/check/test scripts within task scope. Review artifacts and cross-platform CI without running act or mutating external services. Retrieve relevant release constraints selectively; use graph impact review when code/API changes warrant it.

Output proposed notes, compatibility changes, checks and maintainer next steps. Write documentation only when authorized; update verified durable constraints via docs/development/memory.md. The maintainer handles all versioning, tags, commits, PRs and releases.
