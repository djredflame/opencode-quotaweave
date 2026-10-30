/** Dedicated entry point keeps parser startup out of pre-tool and session hooks. */
import { readHookInput } from './hook-input.ts';
import { postEditFeedback } from './post-edit-feedback.ts';
import { projectRoot } from './workspace.ts';
try {
  process.stdout.write(`${JSON.stringify(postEditFeedback(projectRoot, await readHookInput()))}\n`);
} catch {
  process.stdout.write(
    `${JSON.stringify({ systemMessage: 'Source-size feedback unavailable; run pnpm quality:changed explicitly.' })}\n`,
  );
}
