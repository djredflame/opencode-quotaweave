import type { Workflow } from '../src/workflow/types.js';

export function createTestWorkflow(): Workflow {
  return {
    id: 'test-workflow',
    version: '1.0.0',
    name: 'Test Workflow',
    steps: [
      {
        id: 'route-step',
        name: 'Route Step',
        type: 'route',
        config: {},
        dependencies: [],
      },
      {
        id: 'policy-step',
        name: 'Policy Step',
        type: 'policy-check',
        config: {},
        dependencies: ['route-step'],
      },
    ],
  };
}
