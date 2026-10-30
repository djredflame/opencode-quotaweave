/** Require fixture elements explicitly instead of asserting away unchecked indexed access. */
export function requiredItem<T>(items: readonly T[], index: number): T {
  const item = items[index];
  if (item === undefined) throw new Error(`Expected fixture item ${index}`);
  return item;
}

export function requiredValue<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Expected a fixture value');
  return value;
}
export function requiredRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Expected a record');
  return value as Record<string, unknown>;
}
