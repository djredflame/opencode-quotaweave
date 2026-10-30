/** Shared bounded JSON input for command-hook adapters. */
export async function readHookInput(): Promise<unknown> {
  let data = '';
  for await (const chunk of process.stdin) {
    data += String(chunk);
    if (data.length > 1_048_576) throw new Error('Hook payload exceeds limit');
  }
  return JSON.parse(data) as unknown;
}
