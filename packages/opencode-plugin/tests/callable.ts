/** Narrow unknown renderer callbacks to an explicit callable signature. */
export function isCallable(value: unknown): value is (...args: unknown[]) => unknown {
  return typeof value === 'function';
}
