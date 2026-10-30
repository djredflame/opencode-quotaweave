import { expect, it, vi } from 'vitest';
import { EventBus } from '../src/utils/events.js';

it('keeps event delivery working when an observer fails', () => {
  const bus = new EventBus<{ type: 'allocated'; units: number }>();
  const observer = vi.fn();
  bus.on('allocated', () => {
    throw new Error('Observer failure');
  });
  bus.on('allocated', observer);
  expect(() => bus.emit({ type: 'allocated', units: 3 })).not.toThrow();
  expect(observer).toHaveBeenCalledWith({ type: 'allocated', units: 3 });
});
it('supports idempotent unsubscription and clears all listeners on shutdown', () => {
  const bus = new EventBus<{ type: 'allocated' | 'released' }>();
  const observer = vi.fn();
  const unsubscribe = bus.on('allocated', observer);
  unsubscribe();
  unsubscribe();
  bus.emit({ type: 'allocated' });
  expect(observer).not.toHaveBeenCalled();
  bus.on('released', observer);
  bus.clear();
  bus.emit({ type: 'released' });
  expect(observer).not.toHaveBeenCalled();
});
