/** Conservative checks for known local tool inputs; host sandbox remains required. */
import { safePath, record } from './workspace.ts';
import { resolve } from 'node:path';

function commandCheck(command: string): void {
  if (/(?:^|[\s/;|&()])(?:git|gh)["']?(?:\s|$)/i.test(command)) {
    const readOnly =
      /^git (?:status|diff|log|show|ls-files|rev-parse|blame|describe)(?: [\w./:=,@{}~^+-]+)*$/;
    if (
      !readOnly.test(command) ||
      /--(?:output|ext-diff|textconv|exec-path|git-dir|work-tree)/.test(command)
    ) {
      throw new Error('Git/GitHub command requires a plain audited read-only invocation');
    }
  }
  if (/\b(?:sudo|curl|wget)\b|\b(?:npm|pnpm)\s+publish\b/.test(command)) {
    throw new Error('External mutation or unaudited download is prohibited');
  }
  if (
    /(?:^|[\s"'/])(?:\.git|\.ssh|\.aws|\.env\b|dev\.route\.json)|(?:^|\s)cd\s+\.\./.test(command)
  ) {
    throw new Error('Command references a protected path or leaves the workspace');
  }
}

function patchPaths(patch: string): string[] {
  return [...patch.matchAll(/^\*\*\* (?:Add File|Update File|Delete File|Move to): (.+)$/gm)].map(
    (match) => match[1] ?? '',
  );
}

export function guard(root: string, payload: unknown): void {
  const input = record(payload);
  if (typeof input.cwd !== 'string') throw new Error('Hook input requires cwd');
  safePath(root, input.cwd);
  const args = typeof input.tool_input === 'string' ? {} : record(input.tool_input ?? {});
  for (const key of ['file_path', 'filePath', 'path', 'cwd']) {
    if (typeof args[key] === 'string') safePath(root, resolve(input.cwd, args[key]));
  }
  const command = args.command ?? args.cmd;
  if (typeof command === 'string') commandCheck(command);
  const patch =
    typeof input.tool_input === 'string'
      ? input.tool_input
      : (args.patch ?? args.input ?? args.patchText);
  if (typeof patch === 'string') {
    for (const path of patchPaths(patch)) safePath(root, resolve(input.cwd, path));
  }
}
