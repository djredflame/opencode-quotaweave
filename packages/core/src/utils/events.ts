/** Domain event subscriptions; observer failures must not interrupt the originating operation. */
export class EventBus<Event extends { type: string }> {
  private listeners = new Map<Event['type'], Set<(event: Event) => void>>();

  on(type: Event['type'], listener: (event: Event) => void): () => void {
    const listeners = this.listeners.get(type) ?? new Set<(event: Event) => void>();
    listeners.add(listener);
    this.listeners.set(type, listeners);
    return () => {
      this.listeners.get(type)?.delete(listener);
    };
  }

  emit(event: Event): void {
    for (const listener of this.listeners.get(event.type) ?? []) {
      try {
        listener(event);
      } catch {
        /* Observers cannot cancel domain operations. */
      }
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}
