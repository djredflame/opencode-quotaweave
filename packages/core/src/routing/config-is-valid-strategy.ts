/**
 * Configuration loader and validator for QuotaWeave routing configuration
 *
 * Handles loading, validation, and merging of global and project-specific configurations.
 */
import { type RoutingStrategyType } from './config.js';
export function isValidStrategy(value: unknown): value is RoutingStrategyType {
  return (
    typeof value === 'string' &&
    [
      'capability-match',
      'cost-optimize',
      'latency-optimize',
      'quota-aware',
      'priority-based',
      'round-robin',
      'custom',
    ].includes(value)
  );
}
