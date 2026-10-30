import type { Workflow, WorkflowStep } from './types.js';

export function validateWorkflow(workflow: Workflow): void {
  if (!workflow.id || typeof workflow.id !== 'string') {
    throw new Error('Workflow must have a valid id');
  }
  if (!workflow.version || typeof workflow.version !== 'string') {
    throw new Error('Workflow must have a valid version');
  }
  if (!workflow.name || typeof workflow.name !== 'string') {
    throw new Error('Workflow must have a valid name');
  }
  if (!Array.isArray(workflow.steps)) {
    throw new Error('Workflow must have a steps array');
  }

  for (const step of workflow.steps) {
    validateStep(step, workflow.steps);
  }
}

export function validateStep(step: WorkflowStep, allSteps: WorkflowStep[]): void {
  if (!step.id || typeof step.id !== 'string') {
    throw new Error('Step must have a valid id');
  }
  if (!step.name || typeof step.name !== 'string') {
    throw new Error('Step must have a valid name');
  }
  if (
    ![
      'route',
      'policy-check',
      'quota-allocate',
      'quota-release',
      'model-invoke',
      'transform',
      'condition',
      'parallel',
      'sequential',
      'custom',
    ].includes(step.type)
  ) {
    throw new Error(`Invalid step type: ${step.type}`);
  }
  if (!step.config || typeof step.config !== 'object') {
    throw new Error('Step must have a config object');
  }
  if (!Array.isArray(step.dependencies)) {
    throw new Error('Step must have a dependencies array');
  }
  // Check dependencies exist
  for (const dep of step.dependencies) {
    if (!allSteps.some((s) => s.id === dep)) {
      throw new Error(`Step ${step.id} depends on non-existent step: ${dep}`);
    }
  }
}
