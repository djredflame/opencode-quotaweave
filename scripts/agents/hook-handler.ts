/** Minimal hook handler for command-hook adapters (Codex, Claude). */
import { guard } from './guard.ts';
import { projectRoot, record, safePath } from './workspace.ts';

export const SUPPORTED_EVENTS = [
  'SessionStart',
  'PreToolUse',
  'PostToolUse',
  'PreCompact',
  'Stop',
  'SessionEnd',
] as const;

export type SupportedEvent = (typeof SUPPORTED_EVENTS)[number];

const SESSION_START_MESSAGE = `Read AGENTS.md and docs/development/agent-infrastructure.md. CodeGraph unavailable in workspace; use rg and connected semantic tools; report fallback. opencode-mem unavailable in workspace; use active project Serena memory if connected, otherwise docs/development/memory.md.`;

const PRE_COMPACT_MESSAGE =
  'Preserve objective, verified decisions, changed files, failures, next actions, and actual graph/MEM references in the handoff. Do not store transcripts.';

const STOP_MESSAGE =
  'Before completion: run pnpm quality:changed for the edit batch, then report targeted and full checks, affected files, graph freshness, durable knowledge updates and limitations. Batch knowledge maintenance once per meaningful task; never claim unperformed updates.';

export function contextFor(event: SupportedEvent): string {
  switch (event) {
    case 'SessionStart':
      return SESSION_START_MESSAGE;
    case 'PreCompact':
      return PRE_COMPACT_MESSAGE;
    case 'Stop':
      return STOP_MESSAGE;
    default:
      return '';
  }
}

export function handleHook(root: string, payload: unknown): Record<string, unknown> {
  const input = record(payload);
  const event = input.hook_event_name;
  if (!SUPPORTED_EVENTS.includes(event as SupportedEvent))
    throw new Error('Unsupported hook event');
  if (typeof input.cwd !== 'string') throw new Error('Hook input requires cwd');
  safePath(root, input.cwd);

  if (event === 'PreToolUse') {
    guard(root, input);
    return {};
  }
  if (event === 'SessionEnd' || event === 'PostToolUse') return {};
  if (event === 'Stop' && input.stop_hook_active === true) return {};

  const message = contextFor(event as SupportedEvent);
  return event === 'SessionStart'
    ? { hookSpecificOutput: { hookEventName: event, additionalContext: message } }
    : { systemMessage: message };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  void import('./hook-input.ts').then(({ readHookInput }) => {
    readHookInput()
      .then((payload) => handleHook(projectRoot, payload))
      .then((result) => process.stdout.write(`${JSON.stringify(result)}\n`))
      .catch(() => {
        process.stderr.write(
          'QuotaWeave hook rejected malformed input or a prohibited workspace operation.\n',
        );
        process.exitCode = 2;
      });
  });
}
