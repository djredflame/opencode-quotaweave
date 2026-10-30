import type { WorkflowStep } from './types.js';

export function buildExecutionOrder(steps: WorkflowStep[]): WorkflowStep[] {
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const order: WorkflowStep[] = [];

  const stepMap = new Map(steps.map((s) => [s.id, s]));

  function visit(stepId: string): void {
    if (visiting.has(stepId)) {
      throw new Error(`Circular dependency detected: ${stepId}`);
    }
    if (visited.has(stepId)) {
      return;
    }

    visiting.add(stepId);
    const step = stepMap.get(stepId);
    if (!step) {
      throw new Error(`Step not found: ${stepId}`);
    }

    for (const dep of step.dependencies) {
      visit(dep);
    }

    visiting.delete(stepId);
    visited.add(stepId);
    order.push(step);
  }

  for (const step of steps) {
    visit(step.id);
  }

  return order;
}
