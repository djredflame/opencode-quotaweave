/**
 * Unit tests for scroll offsets retained across main-tab switches.
 */
import { describe, expect, it } from 'vitest';
import {
  INITIAL_VIEW_SCROLL,
  rememberViewScroll,
  type ViewScrollState,
} from '../src/tui/view-scroll.js';
describe('view scroll memory', describeViewScrollMemory0);
function itKeepsIndependentOffsetsForExistingViews1() {
  const withList = rememberViewScroll(INITIAL_VIEW_SCROLL, 'modelList', 12);
  const withDetail = rememberViewScroll(withList, 'modelDetail', 4);
  const withOverview = rememberViewScroll(withDetail, 'overview', 7);
  const withRoutingList = rememberViewScroll(withOverview, 'routingList', 3);
  const withRoutingDetail = rememberViewScroll(withRoutingList, 'routingDetail', 5);
  expect(withRoutingDetail).toEqual<ViewScrollState>({
    ...INITIAL_VIEW_SCROLL,
    modelList: 12,
    modelDetail: 4,
    overview: 7,
    routingList: 3,
    routingDetail: 5,
  });
  expect(INITIAL_VIEW_SCROLL.modelList).toBe(0);
  expect(withRoutingList.routingDetail).toBe(0);
}
function itNormalizesInvalidOffsetsAndPreservesStateWhen2() {
  const scrolled = rememberViewScroll(INITIAL_VIEW_SCROLL, 'simulationInput', 9);
  expect(rememberViewScroll(scrolled, 'simulationInput', 9)).toBe(scrolled);
  expect(rememberViewScroll(scrolled, 'simulationInput', -5).simulationInput).toBe(0);
  expect(rememberViewScroll(scrolled, 'simulationInput', 3.8).simulationInput).toBe(3);
  expect(rememberViewScroll(scrolled, 'simulationInput', Number.NaN).simulationInput).toBe(0);
}
function describeViewScrollMemory0() {
  it('keeps independent offsets for existing views', itKeepsIndependentOffsetsForExistingViews1);
  it(
    'normalizes invalid offsets and preserves state when unchanged',
    itNormalizesInvalidOffsetsAndPreservesStateWhen2,
  );
}
