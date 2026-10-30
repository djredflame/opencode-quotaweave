/** Workspace checks shared by infrastructure commands and hook adapters. */
import { lstatSync, realpathSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const projectRoot = realpathSync(fileURLToPath(new URL('../../', import.meta.url)));

export function assertInside(root: string, target: string): string {
  const absolute = resolve(root, target);
  const rel = relative(root, absolute);
  if (isAbsolute(rel) || rel === '..' || rel.startsWith(`..${sep}`)) {
    throw new Error('Path is outside the approved workspace');
  }
  return absolute;
}

export function safePath(root: string, target: string): string {
  const absolute = assertInside(root, target);
  let ancestor = absolute;
  while (!lstatSync(ancestor, { throwIfNoEntry: false })) ancestor = dirname(ancestor);
  const canonical = assertInside(root, realpathSync(ancestor));
  const parts = [
    ...relative(root, absolute).split(/[\\/]/),
    ...relative(root, canonical).split(/[\\/]/),
  ];
  if (parts.some(isPrivate)) throw new Error('Protected project path');
  return absolute;
}

function isPrivate(part: string): boolean {
  return (
    /^(?:\.git|\.ssh|\.aws|\.gnupg|secrets|credentials|dev\.route\.json)$/i.test(part) ||
    /^\.env(?:\.|$)/i.test(part) ||
    /\.(?:pem|key)$/i.test(part) ||
    /^(?:project|settings)\.local\.(?:yml|json)$/i.test(part)
  );
}

export function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Expected a JSON object');
  }
  return value as Record<string, unknown>;
}
