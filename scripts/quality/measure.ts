/** Count exactly the nonblank, non-comment-only lines used by ESLint max-lines. */
import { Linter, SourceCode } from 'eslint';
import tseslint from 'typescript-eslint';

export function countCodeLines(source: SourceCode): number {
  const excluded = new Set<number>();
  for (const comment of source.getAllComments()) {
    if (!comment.loc) continue;
    let { line: start } = comment.loc.start;
    let { line: end } = comment.loc.end;
    const before = source.getTokenBefore(comment);
    const after = source.getTokenAfter(comment);
    if (before?.loc?.end.line === start) start++;
    if (after?.loc?.start.line === end) end--;
    for (let line = start; line <= end; line++) excluded.add(line);
  }
  return source.lines.filter((text, index) => text.trim() !== '' && !excluded.has(index + 1))
    .length;
}

export function measure(source: string, filename = 'source.ts') {
  const result = { codeLines: 0, explicitAny: false };
  const messages = new Linter().verify(
    source,
    [
      {
        files: ['**/*.{ts,tsx,js,mjs}'],
        languageOptions: { parser: tseslint.parser },
        plugins: {
          quality: {
            rules: {
              measure: {
                meta: { schema: [] },
                create(context) {
                  return {
                    TSAnyKeyword() {
                      result.explicitAny = true;
                    },
                    'Program:exit'() {
                      if (!(context.sourceCode instanceof SourceCode))
                        throw new Error('Expected JavaScript source');
                      result.codeLines = countCodeLines(context.sourceCode);
                    },
                  };
                },
              },
            },
          },
        },
        rules: { 'quality/measure': 'error' },
      },
    ],
    { filename },
  );
  if (messages.some((message) => message.fatal)) throw new Error(`Cannot parse ${filename}`);
  return result;
}
