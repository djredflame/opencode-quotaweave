# Contributing to QuotaWeave

Thank you for your interest in contributing to QuotaWeave.

Contributions, bug reports, documentation improvements, tests, and technical feedback are welcome.

QuotaWeave follows a **fork-and-pull-request contribution model**. External contributors work in their own forks and submit pull requests to the upstream repository.

**Only the project maintainer is authorized to approve and merge pull requests into the upstream repository.**

Before contributing, read the [Code of Conduct](CODE_OF_CONDUCT.md), [README](README.md), and [Shared Development Rules](AGENTS.md).

## Development Setup

### Requirements

- Node.js 24 or newer.
- pnpm 12.x, pinned to 12.15.0 in the project manifest.
- Git.
- ShellCheck and shfmt for the complete quality checks.
- OpenCode for native plugin integration testing.

### Fork and Clone

1. Open the [QuotaWeave repository](https://github.com/djredflame/opencode-quotaweave).
2. Click **Fork** to create a copy under your own GitHub account.
3. Clone your fork, replacing `YOUR_USERNAME` with your GitHub username:

```bash
git clone https://github.com/YOUR_USERNAME/opencode-quotaweave.git
cd opencode-quotaweave
```

4. Add the original repository as `upstream`:

```bash
git remote add upstream https://github.com/djredflame/opencode-quotaweave.git
```

5. Fetch the upstream branches:

```bash
git fetch upstream
```

### Install and Build

```bash
pnpm install --frozen-lockfile
pnpm build:all
```

Run the complete local checks:

```bash
pnpm check:all
```

Package coverage is separate:

```bash
pnpm test:coverage
```

The repository contains three packages:

- `@opencode-quotaweave/core`
- `@opencode-quotaweave/opencode-plugin`
- `@opencode-quotaweave/mcp-server`

See [Architecture](docs/architecture.md) for package boundaries and public APIs.

## Contribution Workflow

All external contributions must follow this process.

### 1. Create a Feature Branch

Create your branch from the latest upstream `develop`:

```bash
git fetch upstream
git switch -c feature/description upstream/develop
```

Use a descriptive branch name, such as:

```text
feature/improve-routing
fix/model-filtering
docs/update-configuration
test/quota-manager
```

Do not develop directly on `main` or `develop`.

### 2. Implement Your Changes

Before substantial work:

1. Review relevant source, public APIs, and affected tests.
2. Follow existing architecture and strict TypeScript conventions.
3. Keep functions and modules focused.
4. Add meaningful tests for new behavior and bug fixes.
5. Update documentation when behavior changes.
6. Preserve security, quality, and coverage requirements.

Do not bypass validation or weaken existing checks.

Core routing can return a refusal with `selectedModel: null`. Callers must handle valid refusal outcomes rather than assuming every unsuccessful route throws an exception.

For documentation changes, follow [Development & AI Transparency](README.md#development--ai-transparency) and the [Documentation Skill](.agents/skills/documentation/SKILL.md).

### 3. Validate Your Changes

Run relevant package tests and quality checks.

```bash
pnpm quality:changed
pnpm agents:check
pnpm test:all
pnpm typecheck:tests
pnpm check:all
```

Run package coverage when applicable:

```bash
pnpm test:coverage
```

Core and MCP have configured numeric coverage thresholds. Plugin coverage enforcement remains a documented quality gap.

Do not lower thresholds or suppress diagnostics to obtain passing results.

See [Testing](docs/testing.md) and [Code Quality](docs/development/quality.md).

### 4. Commit and Push to Your Fork

Commit your changes locally:

```bash
git add .
git commit -m "feat(core): improve routing behavior"
```

Push the feature branch to your own fork:

```bash
git push -u origin feature/description
```

`origin` must point to your fork, not the upstream QuotaWeave repository.

Never push contribution branches directly to the upstream repository.

### 5. Open a Pull Request

Open a pull request on GitHub with:

- **Base repository:** `djredflame/opencode-quotaweave`
- **Base branch:** `develop`
- **Head repository:** your fork
- **Compare branch:** your feature branch

Include:

- A concise summary of the change.
- Its motivation or a related issue.
- Tests and validation performed.
- Relevant documentation updates.
- Known limitations or follow-up work.

Pull requests must pass applicable CI checks before they are eligible for merging.

### 6. Maintainer Review and Merge

The project maintainer reviews external contributions.

The maintainer may:

- Request changes.
- Discuss architectural or implementation decisions.
- Request additional tests.
- Approve the contribution.
- Merge or decline the pull request.

**Only the project maintainer performs merges into the upstream `develop` and `main` branches.**

Contributors must not merge their own pull requests into the upstream repository.

Approval and merge decisions remain at the maintainer's discretion.

## Keeping Your Fork Updated

To incorporate the latest upstream development changes into your fork:

```bash
git fetch upstream
git switch develop
git merge --ff-only upstream/develop
git push origin develop
```

This assumes that your fork already has a local `develop` branch tracking your own fork.

If you do not have a local `develop` branch, create it from upstream:

```bash
git fetch upstream
git switch -c develop upstream/develop
git push -u origin develop
```

For an existing feature branch, integrate updated development changes as appropriate before submitting or updating your pull request.

Avoid unnecessary history rewriting on branches shared with other contributors.

## GitFlow Workflow

QuotaWeave follows classical GitFlow.

| Branch | Purpose | Managed by |
|---|---|---|
| `main` | Stable source and release branch | Maintainer |
| `develop` | Development integration branch | Maintainer |
| `feature/*` | Features and ordinary contributions | Contributors in their forks |
| `release/vX.Y.Z` | Release stabilization | Maintainer |
| `hotfix/*` | Urgent production fixes | Maintainer |

### Features and Contributions

- Contributors create branches from upstream `develop`.
- Contributors push their work to their own forks.
- Pull requests target upstream `develop`.
- The maintainer reviews and merges accepted changes.

### Releases

Releases are managed exclusively by the maintainer.

1. Create `release/vX.Y.Z` from `develop`.
2. Stabilize and verify the release.
3. Merge the release branch into `main` through a pull request.
4. Create the version tag on the resulting `main` commit.
5. Merge `main` back into `develop`.
6. Remove the completed release branch when appropriate.

Normal releases must not merge `develop` directly into `main`.

### Hotfixes

Hotfixes are coordinated by the maintainer.

1. Create a hotfix branch from `main`.
2. Implement and validate the fix.
3. Merge the hotfix into `main`.
4. Tag a new version when appropriate.
5. Merge `main` back into `develop`.
6. Synchronize active release branches when necessary.

External contributors may propose urgent fixes through pull requests from their forks. The maintainer coordinates the final integration and release.

### Repository Permissions

External contributors are not granted direct write access to the upstream repository as part of the normal contribution process.

Direct pushes, force pushes, and deletion of upstream protected branches are prohibited by project policy.

Branch protection and rulesets should be configured to enforce appropriate permissions and checks where GitHub supports them.

GitHub Actions branch filters alone do not enforce allowed pull request source branches.

## Commit Messages

Use clear and descriptive commit messages.

Conventional Commit style is preferred:

```text
feat(core): add routing explanation
fix(plugin): correct simulation output
test(mcp): cover invalid tool requests
docs(root): update setup instructions
chore: update dependencies
```

## Release Preparation

QuotaWeave uses manual, maintainer-controlled release management.

There is no established Changesets workflow, automatic release script, or automatic npm publishing pipeline.

Before an official release, the maintainer:

1. Confirms the release scope and package versions.
2. Verifies public exports and fresh packed installations.
3. Runs full quality checks and coverage.
4. Tests native OpenCode integration.
5. Tests MCP interoperability with a real client.
6. Reviews GitHub Actions results.
7. Resolves or documents release limitations.
8. Finalizes [CHANGELOG.md](CHANGELOG.md).
9. Completes the GitFlow release procedure.
10. Creates tags and publishes artifacts when approved.

A public source repository does not automatically imply npm publication or verified native integrations.

The [Release Skill](.agents/skills/release/SKILL.md) provides assistant-facing release guidance.

## AI-Assisted Contributions

AI-assisted development is permitted.

Contributors remain responsible for understanding, reviewing, and validating their changes.

AI-generated content must follow the same engineering, testing, documentation, and security standards as other contributions.

[AGENTS.md](AGENTS.md) and the canonical project skills provide guidance for coding assistants.

The project's maintainer-only Git restriction applies to coding assistants working on the upstream repository. Human contributors may use Git in their own forks as described in this guide.

## Security and Community

Follow the [Code of Conduct](CODE_OF_CONDUCT.md).

Do not publish credentials, private configuration, or sensitive development data.

Security vulnerabilities must be reported privately according to [SECURITY.md](SECURITY.md).

For ordinary bugs and feature requests, open a GitHub issue when available. Include reproducible steps and relevant environment information.