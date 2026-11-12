/**
 * Barramento de eventos tipado, independente do Phaser.
 * Use `bus.on('evento', handler)` / `bus.emit('evento', payload)`.
 */
export type FlagValue = boolean | number | string;

export interface GameEvents {
  'flag:changed': { key: string; value: FlagValue | undefined };
  'map:ready': { map: string };
  'map:leave': { map: string };
  'dialogue:start': { id: string };
  'dialogue:end': { id: string };
  'stealth:spotted': { enemy: string };
  'stealth:respawn': { map: string };
  'checkpoint:set': { map: string; x: number; y: number };
  'save:written': { slot: string };
  'settings:changed': Record<string, never>;
}

type Handler<T> = (payload: T) => void;

export class EventBus<E extends object> {
  private handlers = new Map<keyof E, Set<Handler<never>>>();

  on<K extends keyof E>(event: K, handler: Handler<E[K]>): () => void {
    let set = this.handlers.get(event);
    if (!set) {
      set = new Set();
      this.handlers.set(event, set);
    }
    set.add(handler as Handler<never>);
    return () => this.off(event, handler);
  }

  once<K extends keyof E>(event: K, handler: Handler<E[K]>): () => void {
    const off = this.on(event, (p) => {
      off();
      handler(p);
    });
    return off;
  }

  off<K extends keyof E>(event: K, handler: Handler<E[K]>): void {
    this.handlers.get(event)?.delete(handler as Handler<never>);
  }

  emit<K extends keyof E>(event: K, payload: E[K]): void {
    const set = this.handlers.get(event);
    if (!set) return;
    for (const h of [...set]) (h as Handler<E[K]>)(payload);
  }

  clear(): void {
    this.handlers.clear();
  }
}

export const bus = new EventBus<GameEvents>();
