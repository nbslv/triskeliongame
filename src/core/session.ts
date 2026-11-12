import { defaultPlayerState, saves, type PlayerState, type PositionData, type SaveData, type SlotId } from './save';
import { flags } from './flags';
import { bus, type FlagValue } from './events';

/** Foto do estado no início de uma cutscene (é o que se grava se a página fechar no meio dela). */
export interface CutsceneSnapshot {
  /** Roteiro(s) a recomeçar ao carregar; vazio = só restaura o estado (ex.: conversa com NPC). */
  resumeDialogue?: string;
  position: PositionData;
  flags: Record<string, FlagValue>;
  state: PlayerState;
  playtimeMs: number;
}

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

/** Estado da partida em andamento (o que não é flag). */
export const session = {
  checkpoint: null as PositionData | null,
  position: null as PositionData | null,
  returnPoint: null as PositionData | null,
  playtimeMs: 0,
  state: defaultPlayerState(),
  /** Preenchido enquanto uma cutscene roda. */
  cutscene: null as CutsceneSnapshot | null,
  /** Há partida em andamento (o Mundo já foi aberto)? */
  active: false,

  reset(): void {
    this.checkpoint = null;
    this.position = null;
    this.returnPoint = null;
    this.playtimeMs = 0;
    this.state = defaultPlayerState();
    this.cutscene = null;
    this.active = false;
    flags.reset();
  },

  loadFrom(data: SaveData): void {
    flags.load(data.flags);
    this.checkpoint = { ...data.checkpoint };
    this.position = { ...data.position };
    this.returnPoint = data.returnPoint ? { ...data.returnPoint } : null;
    this.playtimeMs = data.playtimeMs;
    this.state = clone(data.state);
    this.cutscene = null;
  },

  beginCutscene(resumeDialogue?: string): void {
    if (!this.position) return;
    this.cutscene = {
      resumeDialogue,
      position: { ...this.position },
      flags: flags.toJSON(),
      state: clone(this.state),
      playtimeMs: this.playtimeMs,
    };
  },

  endCutscene(): void {
    this.cutscene = null;
  },

  /** Monta o registro de save. Durante cutscene, usa a foto do início dela. */
  snapshot(): Omit<SaveData, 'version' | 'savedAt'> | null {
    const cs = this.cutscene;
    const position = cs ? cs.position : this.position;
    if (!position) return null;
    const data: Omit<SaveData, 'version' | 'savedAt'> = {
      playtimeMs: Math.round(cs ? cs.playtimeMs : this.playtimeMs),
      position: { ...position },
      checkpoint: { ...(this.checkpoint ?? position) },
      flags: cs ? { ...cs.flags } : flags.toJSON(),
      state: clone(cs ? cs.state : this.state),
    };
    if (this.returnPoint) data.returnPoint = { ...this.returnPoint };
    if (cs?.resumeDialogue) data.resumeDialogue = cs.resumeDialogue;
    return data;
  },

  save(slot: SlotId): SaveData | null {
    const data = this.snapshot();
    if (!data) return null;
    const written = saves.write(slot, data);
    if (written) bus.emit('save:written', { slot });
    return written;
  },

  // ---- inventário / moedas / atributos (sem interface ainda) ----

  addItem(id: string, qty = 1): number {
    const n = Math.max(0, (this.state.inventory[id] ?? 0) + qty);
    if (n === 0) delete this.state.inventory[id];
    else this.state.inventory[id] = n;
    return n;
  },
  itemCount(id: string): number {
    return this.state.inventory[id] ?? 0;
  },
  addCoins(delta: number): number {
    this.state.coins = Math.max(0, this.state.coins + delta);
    return this.state.coins;
  },
  addAttribute(id: string, delta: number): number {
    this.state.attributes[id] = (this.state.attributes[id] ?? 0) + delta;
    return this.state.attributes[id]!;
  },
};

export function formatPlaytime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export function formatDate(ts: number): string {
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
