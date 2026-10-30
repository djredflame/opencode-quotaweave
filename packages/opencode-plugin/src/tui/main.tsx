/**
 * QuotaWeave TUI plugin entry point.
 */

import { define } from '@opencode/plugin/tui/plugin';
import { setupQuotaWeave } from './setup.js';

export default define({
  id: 'opencode-quotaweave-tui',
  setup: setupQuotaWeave,
});
