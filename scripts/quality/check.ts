/** Read-only quality feedback. Native hooks provide reminders rather than spawning this per edit. */
import { readFileSync } from 'node:fs';
import { ESLint } from 'eslint';
import { architecture } from './architecture.ts';
import { allSourceFiles, changedSourceFiles, explicitSourceFiles } from './files.ts';
import { limits } from './limits.ts';
import { syntaxCheck } from './syntax.ts';
import { measure } from './measure.ts';
import { projectRoot, safePath } from '../agents/workspace.ts';

async function main(): Promise<void> {
  const args = process.argv.slice(2).filter((arg) => arg !== '--');
  if (args.some((arg) => arg.startsWith('--') && arg !== '--all'))
    throw new Error('Only --all or explicit source paths are supported');
  if (args.includes('--all') && args.length > 1)
    throw new Error('--all cannot be combined with source paths');
  const files = args.includes('--all')
    ? allSourceFiles(projectRoot)
    : args.length
      ? explicitSourceFiles(projectRoot, args)
      : changedSourceFiles(projectRoot);
  const eslint = new ESLint({ cwd: projectRoot });
  const lintable: string[] = [];
  let failures = 0;
  for (const file of files) {
    const result = measure(readFileSync(safePath(projectRoot, file), 'utf8'), file);
    if (await eslint.isPathIgnored(file)) {
      const messages = syntaxCheck(readFileSync(safePath(projectRoot, file), 'utf8'), file);
      failures += messages.filter((message) => message.severity === 2).length;
      for (const message of messages)
        process.stderr.write(`${file}:${message.line}:${message.column} ${message.message}\n`);
    } else lintable.push(file);
    if (result.codeLines >= limits.review)
      process.stdout.write(
        `${file}: ${result.codeLines}/${limits.file} code lines${result.codeLines > limits.file ? ' — LIMIT EXCEEDED' : ' — consider splitting before extending'}\n`,
      );
  }
  for (const issue of architecture(projectRoot, allSourceFiles(projectRoot))) {
    failures++;
    process.stderr.write(`${issue.file}: ${issue.message}\n`);
  }
  const results = lintable.length ? await eslint.lintFiles(lintable) : [];
  failures += results.reduce((sum, result) => sum + result.errorCount, 0);
  if (results.some((result) => result.errorCount))
    process.stdout.write(await (await eslint.loadFormatter('stylish')).format(results));
  process.stdout.write(
    `Checked ${files.length} authored files; ${failures} quality errors. Architecture checked across all package sources.\n`,
  );
  if (failures) process.exitCode = 1;
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : 'Quality check failed'}\n`);
  process.exitCode = 2;
});
