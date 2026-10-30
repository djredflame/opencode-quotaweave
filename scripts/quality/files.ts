/** Discover authored code only; never traverse dependency stores, private paths or build output. */
import { readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { execFileSync } from 'node:child_process';
import { safePath } from '../agents/workspace.ts';

const omitted = new Set(['node_modules', 'dist', 'coverage', 'build', '.fixtures']);

function normalizePath(path: string): string {
  return path.replace(/\\/g, '/');
}

export function isSource(file: string): boolean {
  return /\.(?:ts|tsx|js|mjs)$/.test(file) && !/\.test\.d\.ts$|\.test\.js$/.test(file);
}

export function sourceFiles(root: string, directory = ''): string[] {
  const path = safePath(root, directory);
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name.startsWith('.') || omitted.has(entry.name)) return [];
    const name = normalizePath(join(directory, entry.name));
    if (entry.isSymbolicLink()) throw new Error('Authored source cannot be a symlink');
    if (entry.isDirectory()) return sourceFiles(root, name);
    return isSource(name) ? [name] : [];
  });
}

export function allSourceFiles(root: string): string[] {
  const directories = ['packages', 'scripts'].flatMap((directory) => sourceFiles(root, directory));
  const rootFiles = readdirSync(root).filter(isSource).map(normalizePath);
  return [...directories, ...rootFiles];
}

export function changedSourceFiles(root: string): string[] {
  const output = execFileSync(
    'git',
    ['ls-files', '--modified', '--others', '--exclude-standard', '-z'],
    {
      cwd: root,
      encoding: 'utf8',
      maxBuffer: 4 * 1024 * 1024,
    },
  );
  const staged = execFileSync(
    'git',
    ['diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z'],
    {
      cwd: root,
      encoding: 'utf8',
      maxBuffer: 4 * 1024 * 1024,
    },
  );
  const allowed = new Set(allSourceFiles(root));
  return [...new Set(`${output}\0${staged}`.split('\0'))].filter((file) => allowed.has(file));
}

export function explicitSourceFiles(root: string, files: string[]): string[] {
  const allowed = new Set(allSourceFiles(root));
  return files.map((file) => {
    const normalized = relative(root, safePath(root, file)).replace(/\\/g, '/');
    if (!allowed.has(normalized)) throw new Error('Expected an existing authored source file');
    return normalized;
  });
}
