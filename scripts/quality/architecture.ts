/** Verify runtime dependency direction, declared exports and local module cycles. */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import ts from 'typescript';
import { safePath } from '../agents/workspace.ts';

export interface ArchitectureIssue {
  file: string;
  message: string;
}
const packageName = (file: string) =>
  file.replaceAll('\\', '/').match(/^packages\/([^/]+)\/src\//)?.[1];

export function architecture(root: string, files: string[]): ArchitectureIssue[] {
  const issues: ArchitectureIssue[] = [];
  const edges = new Map<string, string[]>();
  for (const file of files.filter((name) => packageName(name))) {
    const source = ts.createSourceFile(
      file,
      readFileSync(safePath(root, file), 'utf8'),
      ts.ScriptTarget.Latest,
      true,
    );
    const dependencies: string[] = [];
    for (const statement of source.statements) {
      const specifier = moduleSpecifier(statement);
      if (!specifier) continue;
      checkBoundary(root, file, specifier, issues);
      if (typeOnly(statement)) continue;
      const target = localTarget(root, file, specifier);
      if (target) dependencies.push(target);
    }
    edges.set(file, dependencies);
  }
  detectCycles(edges, issues);
  return issues;
}

function moduleSpecifier(node: ts.Statement): string | undefined {
  if ((!ts.isImportDeclaration(node) && !ts.isExportDeclaration(node)) || !node.moduleSpecifier)
    return;
  return ts.isStringLiteral(node.moduleSpecifier) ? node.moduleSpecifier.text : undefined;
}

function typeOnly(node: ts.Statement): boolean {
  if (ts.isExportDeclaration(node))
    return (
      node.isTypeOnly ||
      (!!node.exportClause &&
        ts.isNamedExports(node.exportClause) &&
        node.exportClause.elements.every((entry) => entry.isTypeOnly))
    );
  if (!ts.isImportDeclaration(node)) return false;
  const clause = node.importClause;
  if (clause?.isTypeOnly) return true;
  return (
    !!clause?.namedBindings &&
    ts.isNamedImports(clause.namedBindings) &&
    !clause.name &&
    clause.namedBindings.elements.every((entry) => entry.isTypeOnly)
  );
}

function checkBoundary(
  root: string,
  file: string,
  specifier: string,
  issues: ArchitectureIssue[],
): void {
  const source = packageName(file);
  if (source === 'core' && !specifier.startsWith('.')) {
    issues.push({ file, message: `Core cannot depend on runtime integration ${specifier}` });
  }
  const match = specifier.match(/^@opencode-quotaweave\/([^/]+)(\/.*)?$/);
  const target = match?.[1];
  if (target && target !== source && (source === 'core' || target !== 'core')) {
    issues.push({ file, message: `Forbidden package dependency ${source} → ${target}` });
  }
  if (target && match?.[2]) {
    const manifest = JSON.parse(
      readFileSync(safePath(root, `packages/${target}/package.json`), 'utf8'),
    ) as { exports: Record<string, unknown> };
    if (!Object.hasOwn(manifest.exports, `.${match[2]}`))
      issues.push({ file, message: `Non-public package import ${specifier}` });
  }
  const local = localTarget(root, file, specifier);
  if (local && packageName(local) !== source)
    issues.push({ file, message: `Cross-package relative import ${specifier}` });
}

function localTarget(root: string, file: string, specifier: string): string | undefined {
  if (!specifier.startsWith('.')) return;
  const base = relative(root, resolve(root, dirname(file), specifier));
  const target = [
    base.replace(/\.js$/, '.ts'),
    base.replace(/\.js$/, '.tsx'),
    join(base, 'index.ts'),
  ].find((candidate) => existsSync(safePath(root, candidate)));
  return target;
}

function detectCycles(edges: Map<string, string[]>, issues: ArchitectureIssue[]): void {
  const finished = new Set<string>();
  const active = new Set<string>();
  const visit = (file: string, trail: string[]): void => {
    if (active.has(file)) {
      issues.push({ file, message: `Runtime module cycle: ${[...trail, file].join(' → ')}` });
      return;
    }
    if (finished.has(file)) return;
    active.add(file);
    for (const next of edges.get(file) ?? []) visit(next, [...trail, file]);
    active.delete(file);
    finished.add(file);
  };
  for (const file of edges.keys()) visit(file, []);
}
