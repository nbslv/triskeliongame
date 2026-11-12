import type { FlagValue } from './events';
import type { Direction } from '../config/constants';

/**
 * Salvamento em localStorage: 3 espaços manuais ("1", "2", "3") + "auto".
 * Cada registro tem `version`; registros antigos passam por `MIGRATIONS` ao carregar.
 */
export const SAVE_VERSION = 2;
export const SAVE_PREFIX = 'triskelion.save.';
export const MANUAL_SLOTS = ['1', '2', '3'] as const;
export const AUTO_SLOT = 'auto';
export type SlotId = (typeof MANUAL_SLOTS)[number] | typeof AUTO_SLOT;
export const ALL_SLOTS: readonly SlotId[] = [AUTO_SLOT, ...MANUAL_SLOTS];

export interface PositionData {
  map: string;
  x: number;
  y: number;
  facing: Direction;
}

export interface SaveData {
  version: number;
  savedAt: number; // epoch ms
  playtimeMs: number;
  position: PositionData;
  checkpoint: PositionData;
  flags: Record<string, FlagValue>;
}

/** Subconjunto de Storage usado (permite testes com armazenamento em memória). */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

type Migration = (old: Record<string, unknown>) => Record<string, unknown>;

/**
 * MIGRATIONS[n] converte um registro da versão n para n+1.
 * v1 (protótipo): { version:1, map, x, y, facing, flags, time }
 */
export const MIGRATIONS: Record<number, Migration> = {
  1: (old) => {
    const pos = {
      map: String(old.map ?? ''),
      x: Number(old.x ?? 0),
      y: Number(old.y ?? 0),
      facing: (old.facing as Direction) ?? 'down',
    };
    return {
      version: 2,
      savedAt: Number(old.time ?? Date.now()),
      playtimeMs: 0,
      position: pos,
      checkpoint: { ...pos },
      flags: (old.flags as Record<string, FlagValue>) ?? {},
    };
  },
};

export function migrate(raw: Record<string, unknown>): SaveData {
  let data = raw;
  let v = Number(data.version ?? 1);
  if (v > SAVE_VERSION) throw new Error(`Save de versão futura (${v}); atualize o jogo.`);
  while (v < SAVE_VERSION) {
    const step = MIGRATIONS[v];
    if (!step) throw new Error(`Sem migração do save v${v}`);
    data = step(data);
    v = Number(data.version);
  }
  return validateSave(data);
}

function isPosition(p: unknown): p is PositionData {
  if (!p || typeof p !== 'object') return false;
  const o = p as Record<string, unknown>;
  return typeof o.map === 'string' && Number.isFinite(o.x) && Number.isFinite(o.y);
}

function validateSave(d: Record<string, unknown>): SaveData {
  if (!isPosition(d.position)) throw new Error('Save corrompido: posição inválida');
  const checkpoint = isPosition(d.checkpoint) ? d.checkpoint : d.position;
  return {
    version: SAVE_VERSION,
    savedAt: Number(d.savedAt ?? 0),
    playtimeMs: Number(d.playtimeMs ?? 0),
    position: { ...d.position, facing: d.position.facing ?? 'down' },
    checkpoint: { ...checkpoint, facing: checkpoint.facing ?? 'down' },
    flags: (d.flags && typeof d.flags === 'object' ? d.flags : {}) as Record<string, FlagValue>,
  };
}

function safeStorage(): StorageLike {
  try {
    const s = globalThis.localStorage;
    const k = '__triskelion_test__';
    s.setItem(k, '1');
    s.removeItem(k);
    return s;
  } catch {
    // Navegação privada / bloqueado: guarda só em memória.
    return createMemoryStorage();
  }
}

export function createMemoryStorage(): StorageLike {
  const m = new Map<string, string>();
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => void m.set(k, v),
    removeItem: (k) => void m.delete(k),
  };
}

export class SaveManager {
  private storage: StorageLike | undefined;

  constructor(storage?: StorageLike) {
    this.storage = storage;
  }

  private get store(): StorageLike {
    return (this.storage ??= safeStorage());
  }

  write(slot: SlotId, data: Omit<SaveData, 'version' | 'savedAt'> & { savedAt?: number }): SaveData {
    const full: SaveData = { ...data, version: SAVE_VERSION, savedAt: data.savedAt ?? Date.now() };
    this.store.setItem(SAVE_PREFIX + slot, JSON.stringify(full));
    return full;
  }

  /** Lê e migra um espaço. Retorna null se vazio ou corrompido. */
  read(slot: SlotId): SaveData | null {
    const raw = this.store.getItem(SAVE_PREFIX + slot);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const data = migrate(parsed);
      if (Number(parsed.version) !== SAVE_VERSION) {
        this.store.setItem(SAVE_PREFIX + slot, JSON.stringify(data));
      }
      return data;
    } catch (e) {
      console.warn(`[save] espaço ${slot} ilegível:`, e);
      return null;
    }
  }

  delete(slot: SlotId): void {
    this.store.removeItem(SAVE_PREFIX + slot);
  }

  list(): { slot: SlotId; data: SaveData | null }[] {
    return ALL_SLOTS.map((slot) => ({ slot, data: this.read(slot) }));
  }

  /** Save mais recente entre todos os espaços (para "Continuar"). */
  latest(): { slot: SlotId; data: SaveData } | null {
    let best: { slot: SlotId; data: SaveData } | null = null;
    for (const { slot, data } of this.list()) {
      if (data && (!best || data.savedAt > best.data.savedAt)) best = { slot, data };
    }
    return best;
  }

  hasAny(): boolean {
    return this.latest() !== null;
  }
}

export const saves = new SaveManager();
