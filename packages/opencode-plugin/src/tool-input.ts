/** Validated simulation input shared by both native adapters. */
import type { SimulationRequest } from '@opencode-quotaweave/core';
import { z } from 'zod';

export const simulationShape = {
  task: z.string().describe('Task description for routing'),
  category: z.string().optional().describe('Explicit category, or infer from the task'),
  requiredCapabilities: z.array(z.string()).optional(),
  preferredProviders: z.array(z.string()).optional(),
  excludedProviders: z.array(z.string()).optional(),
  maxCost: z.number().optional(),
  maxLatencyMs: z.number().optional(),
};
const simulationSchema = z.object(simulationShape);

export function parseSimulationRequest(input: unknown): SimulationRequest {
  const args = simulationSchema.parse(input);
  const request: SimulationRequest = { task: args.task };
  if (args.category !== undefined) request.category = args.category;
  if (args.requiredCapabilities !== undefined)
    request.requiredCapabilities = args.requiredCapabilities;
  if (args.preferredProviders !== undefined) request.preferredProviders = args.preferredProviders;
  if (args.excludedProviders !== undefined) request.excludedProviders = args.excludedProviders;
  if (args.maxCost !== undefined) request.maxCost = args.maxCost;
  if (args.maxLatencyMs !== undefined) request.maxLatencyMs = args.maxLatencyMs;
  return request;
}
