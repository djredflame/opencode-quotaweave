/** Native Codex/Claude command-hook entry point; stdin JSON, exit 2 on rejection. */
import { readHookInput } from './hook-input.ts';
import { handleHook } from './hook-handler.ts';
import { projectRoot } from './workspace.ts';

try {
  const result = handleHook(projectRoot, await readHookInput());
  process.stdout.write(`${JSON.stringify(result)}\n`);
} catch {
  process.stderr.write(
    'QuotaWeave hook rejected malformed input or a prohibited workspace operation.\n',
  );
  process.exitCode = 2;
}
