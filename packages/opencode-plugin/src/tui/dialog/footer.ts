/**
 * Contextual footer hints for the QuotaWeave dialog.
 */

import type { QuotaWeaveView } from '../types.js';

const BASE_HINTS = `esc close  tab focus  enter select`;

/** Build a compact one-line hint string for the active view. */
export function footerHints(view: QuotaWeaveView, hasResult: boolean): string {
  if (view === 'models') return `${BASE_HINTS}  up/down list`;
  if (view === 'simulate' && hasResult) return `${BASE_HINTS}  left/right sections`;
  if (view === 'simulate') return `${BASE_HINTS}  enter simulate`;
  if (view === 'overview') return `${BASE_HINTS}  up/down scroll`;
  return BASE_HINTS;
}
