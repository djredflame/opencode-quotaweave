/** Nonblocking source-size feedback; no subprocesses, transcript storage or automatic rewrites. */
import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { measure } from '../quality/measure.ts';
import { limits } from '../quality/limits.ts';
import { record, safePath } from './workspace.ts';

export function postEditFeedback(root: string, payload: unknown): Record<string, unknown> {
  const input = record(payload);
  if (typeof input.cwd !== 'string') throw new Error('Hook input requires cwd');
  safePath(root, input.cwd);
  const args = typeof input.tool_input === 'string' ? {} : record(input.tool_input ?? {});
  const direct = [args.file_path, args.filePath, args.path].filter(
    (value): value is string => typeof value === 'string',
  );
  const patch =
    typeof input.tool_input === 'string'
      ? input.tool_input
      : (args.patch ?? args.input ?? args.patchText);
  const paths =
    typeof patch === 'string'
      ? [...patch.matchAll(/^\*\*\* (?:Add File|Update File|Move to): (.+)$/gm)].map(
          (match) => match[1] ?? '',
        )
      : [];
  const files = [...new Set([...direct, ...paths])].slice(0, 20);
  const messages: string[] = [];
  for (const file of files) {
    const path = safePath(root, resolve(input.cwd, file));
    if (!/\.(?:ts|tsx|js|mjs)$/.test(file) || !existsSync(path)) continue;
    if (!statSync(path).isFile() || statSync(path).size > 1_048_576) continue;
    const { codeLines } = measure(readFileSync(path, 'utf8'), path);
    messages.push(
      `${file}: ${codeLines}/${limits.file} code lines${codeLines > limits.file ? '; split this file before completion' : codeLines >= limits.review ? '; consider splitting before extending' : ''}`,
    );
  }
  return messages.length
    ? {
        systemMessage: `${messages.join('\n')}\nRun pnpm quality:changed after this edit batch; full checks remain required. This feedback does not block or revert completed edits.`,
      }
    : {};
}
