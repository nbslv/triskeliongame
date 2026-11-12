import type { PositionData, SaveData, SlotId } from './save';
import { saves } from './save';
import { flags } from './flags';
import { bus } from './events';

/** Estado da partida em andamento (o que não é flag). */
export const session = {
  checkpoint: null as PositionData | null,
  position: null as PositionData | null,
  playtimeMs: 0,
  reset(): void {
    this.checkpoint = null;
    this.position = null;
    this.playtimeMs = 0;
    flags.reset();
  },
  loadFrom(data: SaveData): void {
    flags.load(data.flags);
    this.checkpoint = { ...data.checkpoint };
    this.position = { ...data.position };
    this.playtimeMs = data.playtimeMs;
  },
  save(slot: SlotId): SaveData | null {
    if (!this.position) return null;
    const written = saves.write(slot, {
      playtimeMs: Math.round(this.playtimeMs),
      position: { ...this.position },
      checkpoint: { ...(this.checkpoint ?? this.position) },
      flags: flags.toJSON(),
    });
    bus.emit('save:written', { slot });
    return written;
  },
};

export function formatPlaytime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}
