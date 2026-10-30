/**
 * Scroll offsets retained while switching between main tabs.
 *
 * Inactive views unmount with the fixed shell, so each scrollable region
 * reports its offset on disposal and restores it when the view returns.
 */

/** Scrollable regions whose offsets survive tab switches. */
export type ViewScrollKey =
  | 'overview'
  | 'modelList'
  | 'modelDetail'
  | 'routingList'
  | 'routingDetail'
  | 'simulationInput'
  | 'simulationResult'
  | 'policies'
  | 'system';

/** Offset for every persistent scroll region. */
export type ViewScrollState = Readonly<Record<ViewScrollKey, number>>;

/** Scroll offsets before a view has been scrolled. */
export const INITIAL_VIEW_SCROLL: ViewScrollState = {
  overview: 0,
  modelList: 0,
  modelDetail: 0,
  routingList: 0,
  routingDetail: 0,
  simulationInput: 0,
  simulationResult: 0,
  policies: 0,
  system: 0,
};

function normalizeOffset(offset: number): number {
  return Number.isFinite(offset) ? Math.max(0, Math.trunc(offset)) : 0;
}

/** Return a new scroll state when one region offset changes. */
export function rememberViewScroll(
  state: ViewScrollState,
  key: ViewScrollKey,
  offset: number,
): ViewScrollState {
  const value = normalizeOffset(offset);
  if (state[key] === value) return state;
  return { ...state, [key]: value };
}
