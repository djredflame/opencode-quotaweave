# Security Policy

## Supported Versions

QuotaWeave is an independently maintained open-source project.

Security fixes are considered for the current maintained version according to severity, technical impact, and maintainer availability.

| Version | Status |
|---|---|
| 0.1.x | Initial development series; security issues reviewed as maintenance permits |
| Earlier versions | Not supported |

Public source availability does not imply continuous monitoring, guaranteed security updates, or fixed support periods.

## Reporting a Vulnerability

**Do not report security vulnerabilities through public GitHub issues.**

If you discover a potential vulnerability, contact the maintainer privately using the contact information available on their [GitHub profile](https://github.com/djredflame).

If GitHub Private Vulnerability Reporting is enabled, you may use that option instead.

Include the following information where possible:

- A description of the vulnerability.
- Affected versions or components.
- Reproduction steps.
- Potential security impact.
- Relevant logs or examples with sensitive information removed.
- A suggested remediation, if available.

Please avoid publicly disclosing exploit details before the maintainer has had a reasonable opportunity to investigate.

## Security Response

Security reports will be reviewed according to severity, impact, and maintainer availability.

The project does not guarantee fixed acknowledgment, investigation, remediation, or publication timelines.

A report may lead to a fix, additional investigation, documentation changes, or a decision that the reported behavior is outside the supported scope.

Coordinated disclosure is encouraged.

## Security Practices

QuotaWeave includes development practices intended to reduce risk.

These measures do not guarantee that the software is free from vulnerabilities.

### Secrets and Configuration

- Never commit credentials, API keys, tokens, or private routing configuration.
- Keep example configuration files free of real secrets.
- Use the project's Git ignore rules for known private paths and generated artifacts.
- Remember that `.gitignore` does not protect secrets already committed to Git history.
- Review configuration overrides as trusted input until restrictive-only enforcement is fully implemented.

### Dependency Management

- Use a pnpm lockfile for reproducible installations.
- Review dependency additions and updates.
- Use configured dependency audit checks.
- Keep production dependencies limited to necessary functionality.
- Evaluate reported vulnerabilities according to actual exposure and severity.

### Input Validation

- Use strict TypeScript types and runtime validation at relevant boundaries.
- Validate routing configuration and external tool arguments.
- Treat provider responses and other external data as untrusted.
- Do not assume that compile-time types guarantee runtime safety.

### Development Agent Permissions

The repository contains development-agent instructions, command guards, and configuration intended to restrict sensitive operations.

These include controls for:

- Known private files and directories.
- Git and GitHub mutations.
- Selected dangerous shell commands.
- External workspace paths.
- Editing and command approval boundaries.

Local validators check declared rules and recognized inputs. Native host behavior depends on the supported configuration schema, installed host version, and actual execution environment.

**These controls are defense-in-depth measures, not a complete operating-system sandbox.**

Do not rely on coding-agent instructions or command scanners as the sole protection for secrets or production environments.

See [Shared Agent Infrastructure](docs/development/agent-infrastructure.md) for supported behavior and verification boundaries.

## Security Severity

Reports are evaluated individually.

| Severity | Example impact |
|---|---|
| High | Remote code execution, credential exposure, privilege escalation |
| Medium | Significant information disclosure, denial of service, validation bypass |
| Low | Limited-impact information leakage or security-related logic errors |

These examples are guidelines rather than automatic classifications.

## Contributor Responsibilities

Contributors should:

1. Keep credentials and private configuration out of commits.
2. Validate untrusted inputs.
3. Minimize dependencies.
4. Avoid exposing sensitive information in errors and logs.
5. Follow least-privilege principles.
6. Add tests for security-sensitive behavior.
7. Run relevant quality and security checks.
8. Never weaken security checks merely to obtain passing results.

## Acknowledgments

Security researchers who responsibly report vulnerabilities may be acknowledged in project release notes or security advisories with their consent.

## Policy Scope

This document describes project security practices and the intended disclosure process.

It is not a guarantee of vulnerability-free software, continuous security monitoring, or fixed response times.