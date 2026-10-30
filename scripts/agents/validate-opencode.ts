/** OpenCode permissions validation for the array-based permissions format. */
import { readFileSync } from 'node:fs';
import { record, safePath } from './workspace.ts';

export function checkOpenCode(root: string): void {
  const config = loadOpenCodeConfig(root);
  const rules = validatePermissionsStructure(config);
  const matcher = createRuleMatcher(rules);

  validateExternalDirectory(matcher);
  validatePrivateReads(matcher);
  validatePrivateEdits(matcher);
  validateBasePermissions(matcher);
  validateShellPermissions(matcher);
  validateGitAuditCommands(matcher);
  validateDangerousCommands(matcher);
  validateWebAccess(matcher);
  validateRuleOrdering(rules);
}

function loadOpenCodeConfig(root: string): Record<string, unknown> {
  return record(JSON.parse(readFileSync(safePath(root, 'opencode.json'), 'utf8')));
}

function validatePermissionsStructure(config: Record<string, unknown>): Array<{
  action: string;
  resource: string;
  effect: 'allow' | 'deny' | 'ask';
}> {
  for (const key of ['plugins', 'memory', 'policies']) {
    if (key in config) throw new Error(`Unverified/obsolete OpenCode config key: ${key}`);
  }
  if (!Array.isArray(config.permissions)) {
    throw new Error('OpenCode "permissions" must be an array of rules');
  }
  return config.permissions as Array<{
    action: string;
    resource: string;
    effect: 'allow' | 'deny' | 'ask';
  }>;
}

function createRuleMatcher(
  rules: Array<{
    action: string;
    resource: string;
    effect: 'allow' | 'deny' | 'ask';
  }>,
): (action: string, resource: string) => string | null {
  return (action: string, resource: string): string | null => {
    let effect: string | null = null;
    for (const rule of rules) {
      if (rule.action === action && matchResource(rule.resource, resource)) {
        effect = rule.effect;
      }
    }
    return effect;
  };
}

function globToRegex(pattern: string): string {
  if (pattern === '*') return '.*';
  if (pattern === '**') return '.*';

  let regex = '';
  let i = 0;
  while (i < pattern.length) {
    const ch = pattern[i];
    if (ch !== '*') {
      regex += ch === '.' ? '\\.' : ch;
      i += 1;
      continue;
    }
    if (i + 1 < pattern.length && pattern[i + 1] === '*') {
      if (i + 2 < pattern.length && pattern[i + 2] === '/') {
        regex += '(?:[^/]+/)*';
        i += 3;
      } else {
        regex += '.*';
        i += 2;
      }
    } else {
      regex += '[^/]*';
      i += 1;
    }
  }
  return '^' + regex + '$';
}

function matchResource(pattern: string, resource: string): boolean {
  if (pattern === '*') return true;
  if (pattern === resource) return true;
  const regex = new RegExp(globToRegex(pattern));
  return regex.test(resource);
}

function validateExternalDirectory(
  matcher: (action: string, resource: string) => string | null,
): void {
  if (matcher('external_directory', '*') !== 'deny') {
    throw new Error('External workspace access allowed (missing external_directory deny)');
  }
}

function validatePrivateReads(matcher: (action: string, resource: string) => string | null): void {
  const privatePatterns = [
    '**/.git/**',
    '**/.env*',
    '**/.ssh/**',
    '**/.aws/**',
    '**/*.pem',
    '**/*.key',
    '**/dev.route.json',
    '**/*.local.*',
  ];
  for (const pattern of privatePatterns) {
    if (matcher('read', pattern) !== 'deny') {
      throw new Error(`Private read not denied for pattern: ${pattern}`);
    }
  }
}

function validatePrivateEdits(matcher: (action: string, resource: string) => string | null): void {
  const privatePatterns = [
    '**/.git/**',
    '**/.env*',
    '**/.ssh/**',
    '**/.aws/**',
    '**/*.pem',
    '**/*.key',
    '**/dev.route.json',
    '**/*.local.*',
  ];
  for (const pattern of privatePatterns) {
    if (matcher('edit', pattern) !== 'deny') {
      throw new Error(`Private edit not denied for pattern: ${pattern}`);
    }
  }
}

function validateBasePermissions(
  matcher: (action: string, resource: string) => string | null,
): void {
  if (matcher('read', '*') !== 'allow') {
    throw new Error('Base read permission not allowed');
  }
  if (matcher('edit', '*') !== 'allow') {
    throw new Error('Base edit permission not allowed');
  }
}

function validateShellPermissions(
  matcher: (action: string, resource: string) => string | null,
): void {
  if (matcher('shell', '*') !== 'ask') {
    throw new Error('Shell commands must require approval (ask)');
  }
  if (matcher('shell', 'git *') !== 'deny') {
    throw new Error('Git write operations not denied');
  }
  if (matcher('shell', 'gh *') !== 'deny') {
    throw new Error('GitHub operations not denied');
  }
}

function validateGitAuditCommands(
  matcher: (action: string, resource: string) => string | null,
): void {
  const allowedGitCommands = [
    'git status',
    'git status --short',
    'git ls-files --others --exclude-standard',
    'git ls-files --cached',
    'git check-ignore -v --no-index .codegraph/',
    'git check-ignore -v --no-index .serena/',
    'git check-ignore -v --no-index .pnpmrc',
  ];
  for (const cmd of allowedGitCommands) {
    if (matcher('shell', cmd) !== 'allow') {
      throw new Error(`Required read-only Git command not allowed: ${cmd}`);
    }
  }
}

function validateDangerousCommands(
  matcher: (action: string, resource: string) => string | null,
): void {
  if (matcher('shell', 'sudo *') !== 'deny') {
    throw new Error('sudo commands not denied');
  }
  if (matcher('shell', 'npm publish*') !== 'deny') {
    throw new Error('npm publish not denied');
  }
  if (matcher('shell', 'pnpm publish*') !== 'deny') {
    throw new Error('pnpm publish not denied');
  }
}

function validateWebAccess(matcher: (action: string, resource: string) => string | null): void {
  if (matcher('webfetch', '*') !== 'deny') {
    throw new Error('webfetch not denied');
  }
  if (matcher('websearch', '*') !== 'deny') {
    throw new Error('websearch not denied');
  }
}

function validateRuleOrdering(
  rules: Array<{ action: string; resource: string; effect: 'allow' | 'deny' | 'ask' }>,
): void {
  const privatePatterns = [
    '**/.git/**',
    '**/.env*',
    '**/.ssh/**',
    '**/.aws/**',
    '**/*.pem',
    '**/*.key',
    '**/dev.route.json',
    '**/*.local.*',
  ];

  let sawBaseReadAllow = false;
  let sawBaseEditAllow = false;
  let sawBaseShellAsk = false;

  for (const rule of rules) {
    if (rule.action === 'read' && rule.resource === '*' && rule.effect === 'allow') {
      sawBaseReadAllow = true;
    }
    if (rule.action === 'edit' && rule.resource === '*' && rule.effect === 'allow') {
      sawBaseEditAllow = true;
    }
    if (rule.action === 'shell' && rule.resource === '*' && rule.effect === 'ask') {
      sawBaseShellAsk = true;
    }

    const isPrivateDeny =
      rule.effect === 'deny' && privatePatterns.some((p) => matchResource(p, rule.resource));

    if (isPrivateDeny) {
      if (rule.action === 'read' && !sawBaseReadAllow) {
        throw new Error('Private read deny appears before base read allow (ordering violation)');
      }
      if (rule.action === 'edit' && !sawBaseEditAllow) {
        throw new Error('Private edit deny appears before base edit allow (ordering violation)');
      }
    }
    if (rule.action === 'shell' && rule.effect === 'deny' && !sawBaseShellAsk) {
      throw new Error('Shell deny appears before base shell ask (ordering violation)');
    }
  }
}
