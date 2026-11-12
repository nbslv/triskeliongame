import type { FlagValue } from './events';
import type { Direction } from '../config/constants';

/**
 * Salvamento em localStorage.
 * Espaços: "1", "2", "3" (manuais), "auto" (autosave) e "retomada" (gravado ao sair/ocultar a aba).
 * - Escrita ATÔMICA: grava em `<chave>.tmp`, confere, guarda a versão anterior em `<chave>.bak`
 *   e só então substitui a principal. Se a aba fechar no meio, sobra uma cópia válida.
 * - Leitura tolerante: principal → .tmp → .bak; registro corrompido cai para o último válido.
 * - `version` + MIGRATIONS para converter saves antigos.
 */
export const SAVE_VERSION = 3;
export const SAVE_PREFIX = 'triskelion.save.';
export const MANUAL_SLOTS = ['1', '2', '3'] as const;
export const AUTO_SLOT = 'auto';
export const RESUME_SLOT = 'retomada';
export type SlotId = (typeof MANUAL_SLOTS)[number] | typeof AUTO_SLOT | typeof RESUME_SLOT;
export const ALL_SLOTS: readonly SlotId[] = [RESUME_SLOT, AUTO_SLOT, ...MANUAL_SLOTS];

/** Dificuldades previstas. Versão inicial: só "tranquila" (sem opção na tela). */
export type Difficulty = 'tranquila' | 'aventura' | 'desafio';
export const DIFFICULTIES: readonly Difficulty[] = ['tranquila', 'aventura', 'desafio'];

export interface PositionData {
  map: string;
  x: number;
  y: number;
  facing: Direction;
}

/** Estado de progresso que não é flag (pronto para lojas, treinos e batalha). */
export interface PlayerState {
  difficulty: Difficulty;
  coins: number;
  /** id do item → quantidade. */
  inventory: Record<string, number>;
  /** Atributos evoluídos por treino/batalha, ex.: { forca: 1, magia: 2 }. */
  attributes: Record<string, number>;
}

export interface SaveData {
  version: number;
  savedAt: number; // epoch ms
  playtimeMs: number;
  position: PositionData;
  checkpoint: PositionData;
  /** Onde voltar ao sair por uma porta com `return: true` (interiores). */
  returnPoint?: PositionData;
  flags: Record<string, FlagValue>;
  state: PlayerState;
  /** Se gravado no meio de uma cutscene: id do roteiro a recomeçar ao carregar. */
  resumeDialogue?: string;
}

export function defaultPlayerState(): PlayerState {
  return { difficulty: 'tranquila', coins: 0, inventory: {}, attributes: { forca: 1, magia: 1 } };
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
 * v2: posição/checkpoint/flags/tempo
 * v3: + state (dificuldade, moedas, inventário, atributos), returnPoint, resumeDialogue
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
  2: (old) => ({ ...old, version: 3, state: defaultPlayerState() }),
};

export function migrate(raw: Record<string, unknown>): SaveData {
  let data = raw;
  let v = Number(data.version ?? 1);
  if (!Number.isInteger(v) || v < 1) throw new Error('Save sem versão válida');
  if (v > SAVE_VERSION) throw new Error(`Save de versão futura (${v}); atualize o jogo.`);
  while (v < SAVE_VERSION) {
    const step = MIGRATIONS[v];
    if (!step) throw new Error(`Sem migração do save v${v}`);
    data = step(data);
    v = Number(data.version);
  }
  return validateSave(data);
}

const DIRS = ['down', 'left', 'right', 'up'];

function asPosition(p: unknown): PositionData | null {
  if (!p || typeof p !== 'object') return null;
  const o = p as Record<string, unknown>;
  if (typeof o.map !== 'string' || !o.map || !Number.isFinite(o.x) || !Number.isFinite(o.y)) return null;
  return {
    map: o.map,
    x: o.x as number,
    y: o.y as number,
    facing: DIRS.includes(o.facing as string) ? (o.facing as Direction) : 'down',
  };
}

function numRecord(r: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (r && typeof r === 'object') {
    for (const [k, v] of Object.entries(r)) if (typeof v === 'number' && Number.isFinite(v)) out[k] = v;
  }
  return out;
}

function validateSave(d: Record<string, unknown>): SaveData {
  const position = asPosition(d.position);
  if (!position) throw new Error('Save corrompido: posição inválida');
  const st = (d.state ?? {}) as Record<string, unknown>;
  const def = defaultPlayerState();
  const flags: Record<string, FlagValue> = {};
  if (d.flags && typeof d.flags === 'object') {
    for (const [k, v] of Object.entries(d.flags)) {
      if (typeof v === 'boolean' || typeof v === 'number' || typeof v === 'string') flags[k] = v;
    }
  }
  const out: SaveData = {
    version: SAVE_VERSION,
    savedAt: Number(d.savedAt ?? 0) || 0,
    playtimeMs: Number(d.playtimeMs ?? 0) || 0,
    position,
    checkpoint: asPosition(d.checkpoint) ?? { ...position },
    flags,
    state: {
      difficulty: DIFFICULTIES.includes(st.difficulty as Difficulty) ? (st.difficulty as Difficulty) : def.difficulty,
      coins: Number.isFinite(st.coins) ? (st.coins as number) : def.coins,
      inventory: numRecord(st.inventory),
      attributes: { ...def.attributes, ...numRecord(st.attributes) },
    },
  };
  const rp = asPosition(d.returnPoint);
  if (rp) out.returnPoint = rp;
  if (typeof d.resumeDialogue === 'string' && d.resumeDialogue) out.resumeDialogue = d.resumeDialogue;
  return out;
}

/** Converte JSON (texto ou objeto) em SaveData válido, ou lança erro. */
export function parseSave(raw: string | Record<string, unknown>): SaveData {
  const obj = typeof raw === 'string' ? (JSON.parse(raw) as unknown) : raw;
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) throw new Error('Save não é um objeto');
  return migrate(obj as Record<string, unknown>);
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

export type SaveInput = Omit<SaveData, 'version' | 'savedAt'> & { savedAt?: number };

export const EXPORT_FORMAT = 'triskelion-saves';

export class SaveManager {
  private storage: StorageLike | undefined;

  constructor(storage?: StorageLike) {
    this.storage = storage;
  }

  private get store(): StorageLike {
    return (this.storage ??= safeStorage());
  }

  /** Gravação atômica. Retorna o registro gravado ou null se o armazenamento falhar (cheio/bloqueado). */
  write(slot: SlotId, data: SaveInput): SaveData | null {
    const full: SaveData = { ...data, version: SAVE_VERSION, savedAt: data.savedAt ?? Date.now() };
    const key = SAVE_PREFIX + slot;
    const json = JSON.stringify(full);
    try {
      this.store.setItem(key + '.tmp', json);
      if (this.store.getItem(key + '.tmp') !== json) throw new Error('verificação da cópia temporária falhou');
      const prev = this.store.getItem(key);
      if (prev && this.tryParse(prev)) this.store.setItem(key + '.bak', prev);
      this.store.setItem(key, json);
      this.store.removeItem(key + '.tmp');
      return full;
    } catch (e) {
      console.error(`[save] falha ao gravar espaço ${slot}:`, e);
      return null;
    }
  }

  private tryParse(raw: string | null): SaveData | null {
    if (!raw) return null;
    try {
      return parseSave(raw);
    } catch {
      return null;
    }
  }

  /** Lê e migra um espaço (principal → .tmp → .bak). Null se vazio ou tudo corrompido. */
  read(slot: SlotId): SaveData | null {
    const key = SAVE_PREFIX + slot;
    const main = this.store.getItem(key);
    const parsed = this.tryParse(main);
    if (parsed) {
      if (main && (JSON.parse(main) as { version?: number }).version !== SAVE_VERSION) {
        try {
          this.store.setItem(key, JSON.stringify(parsed));
        } catch {
          /* ignora */
        }
      }
      return parsed;
    }
    if (main) console.warn(`[save] espaço ${slot} corrompido; tentando cópia de segurança`);
    const fallback = this.tryParse(this.store.getItem(key + '.tmp')) ?? this.tryParse(this.store.getItem(key + '.bak'));
    if (fallback && main) {
      // Restaura a cópia válida como principal.
      try {
        this.store.setItem(key, JSON.stringify(fallback));
      } catch {
        /* ignora */
      }
    }
    return fallback;
  }

  delete(slot: SlotId): void {
    const key = SAVE_PREFIX + slot;
    for (const k of [key, key + '.tmp', key + '.bak']) this.store.removeItem(k);
  }

  list(): { slot: SlotId; data: SaveData | null }[] {
    return ALL_SLOTS.map((slot) => ({ slot, data: this.read(slot) }));
  }

  /** Save mais recente entre todos os espaços (para "Continuar"/"Retomar"). */
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

  /** Todos os saves num texto JSON (para baixar como arquivo ou copiar). */
  exportAll(): string {
    const saves: Record<string, SaveData> = {};
    for (const { slot, data } of this.list()) if (data) saves[slot] = data;
    return JSON.stringify({ format: EXPORT_FORMAT, version: SAVE_VERSION, exportedAt: Date.now(), saves }, null, 1);
  }

  /**
   * Importa um texto de exportação (ou um save avulso, que vai para o espaço 1).
   * Valida tudo antes de gravar. Retorna os espaços importados.
   */
  importAll(text: string): SlotId[] {
    const obj = JSON.parse(text) as Record<string, unknown>;
    const entries: [SlotId, SaveData][] = [];
    if (obj && obj.format === EXPORT_FORMAT && obj.saves && typeof obj.saves === 'object') {
      for (const [slot, data] of Object.entries(obj.saves as Record<string, unknown>)) {
        if (!ALL_SLOTS.includes(slot as SlotId)) continue;
        entries.push([slot as SlotId, parseSave(data as Record<string, unknown>)]);
      }
    } else {
      entries.push(['1', parseSave(obj)]);
    }
    if (entries.length === 0) throw new Error('Nenhum save encontrado no texto');
    for (const [slot, data] of entries) {
      if (!this.write(slot, data)) throw new Error(`Não foi possível gravar o espaço ${slot}`);
    }
    return entries.map(([s]) => s);
  }
}

export const saves = new SaveManager();
