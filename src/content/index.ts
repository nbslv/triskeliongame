import { validateDialogue } from '../systems/dialogue/schema';
import type { DialogueScript } from '../systems/dialogue/types';

/**
 * Carrega os DADOS de content/ e lista os arquivos de assets/ em tempo de build (import.meta.glob).
 * Nada aqui contém história: só leitura e validação.
 */

const dialogueModules = import.meta.glob('/content/dialogues/*.json', { eager: true, import: 'default' });
const mapModules = import.meta.glob('/content/maps/*.json', { eager: true, import: 'default' });
const characterModules = import.meta.glob('/content/characters.json', { eager: true, import: 'default' });
const gameModules = import.meta.glob('/content/jogo.json', { eager: true, import: 'default' });

const baseName = (path: string) => path.split('/').pop()!.replace(/\.[^.]+$/, '');

export interface GameConfig {
  /** Mapa inicial do "Novo jogo". */
  startMap: string;
  /** Marcador (camada markers) onde o jogador nasce. */
  startMarker: string;
  /** Roteiro executado logo ao começar (opcional). */
  startDialogue?: string;
  /** id do ator controlado pelo jogador nos roteiros. */
  playerId: string;
  /** Spritesheet do jogador. */
  playerSprite: string;
}

const DEFAULT_GAME: GameConfig = {
  startMap: 'teste',
  startMarker: 'inicio',
  playerId: 'icaro',
  playerSprite: 'icaro',
};

export const gameConfig: GameConfig = {
  ...DEFAULT_GAME,
  ...((Object.values(gameModules)[0] as Partial<GameConfig> | undefined) ?? {}),
};

// ---------- diálogos ----------

export const dialogues = new Map<string, DialogueScript>();
export const dialogueErrors: string[] = [];

{
  const ids = new Set(Object.keys(dialogueModules).map(baseName));
  for (const [path, json] of Object.entries(dialogueModules)) {
    const res = validateDialogue(json, ids);
    if (res.ok && res.script) {
      if (res.script.id !== baseName(path)) {
        console.warn(`[conteúdo] ${path}: id "${res.script.id}" difere do nome do arquivo`);
      }
      dialogues.set(baseName(path), res.script);
    } else {
      const msg = `${path}:\n  ${res.errors.join('\n  ')}`;
      dialogueErrors.push(msg);
      console.error('[conteúdo] roteiro inválido', msg);
    }
  }
}

export function getDialogue(id: string): DialogueScript | undefined {
  return dialogues.get(id);
}

// ---------- mapas ----------

export const maps = new Map<string, unknown>();
for (const [path, json] of Object.entries(mapModules)) maps.set(baseName(path), json);

// ---------- personagens ----------

interface CharacterInfo {
  id: string;
  name: string;
  sprite?: string;
  color?: string;
  /** Bip de fala (assets/audio/sfx/fala_<voz>.ogg): grave, media, aguda, ronco... */
  voice?: string;
}

const characters = new Map<string, CharacterInfo>();
{
  const raw = Object.values(characterModules)[0] as unknown;
  const add = (id: string, c: Record<string, unknown>) => {
    const name = (c.name ?? c.nome ?? c.displayName) as string | undefined;
    characters.set(id, {
      id,
      name: name ?? id,
      sprite: (c.sprite ?? c.spritesheet) as string | undefined,
      color: (c.color ?? c.cor) as string | undefined,
      voice: (c.voice ?? c.voz) as string | undefined,
    });
  };
  // Aceita { "personagens": [...] }, [...] ou { "<id>": {...} }.
  const list = Array.isArray(raw)
    ? raw
    : raw && typeof raw === 'object' && Array.isArray((raw as Record<string, unknown>).personagens)
      ? ((raw as Record<string, unknown>).personagens as unknown[])
      : raw && typeof raw === 'object' && Array.isArray((raw as Record<string, unknown>).characters)
        ? ((raw as Record<string, unknown>).characters as unknown[])
        : null;
  if (list) {
    for (const c of list) if (c && typeof c === 'object' && 'id' in c) add(String((c as { id: unknown }).id), c as Record<string, unknown>);
  } else if (raw && typeof raw === 'object') {
    for (const [id, c] of Object.entries(raw)) if (c && typeof c === 'object') add(id, c as Record<string, unknown>);
  }
}

/** Nomes definidos pelo mapa (propriedade `nome` de um NPC) — valem só em jogo. */
const runtimeNames = new Map<string, string>();
export function setRuntimeName(id: string, name: string): void {
  runtimeNames.set(id, name);
}

export function characterName(id: string | undefined): string {
  if (!id) return '';
  const rt = runtimeNames.get(id);
  if (rt) return rt;
  const c = characters.get(id);
  if (c) return c.name;
  if (id === 'narrador' || id === 'narrator') return '';
  if (id === 'tutorial') return 'Dica';
  return id.charAt(0).toUpperCase() + id.slice(1).replace(/_/g, ' ');
}

/**
 * Efeito sonoro do bip de digitação para um falante: `voz` em characters.json, senão
 * pai/toucim → grave, nina → aguda, Caligosuins → ronco, demais → média; narrador/tutorial → "texto".
 */
export function speakerVoice(id: string | undefined): string {
  if (!id || id === 'narrador' || id === 'narrator' || id === 'tutorial') return 'texto';
  const v = characters.get(id)?.voice;
  if (v) return v.startsWith('fala_') || v === 'texto' ? v : `fala_${v}`;
  if (/^cali_|^caligosuin|^toucim/.test(id)) return 'fala_ronco';
  if (id === 'pai') return 'fala_grave';
  if (id === 'nina') return 'fala_aguda';
  return 'fala_media';
}

/** Sprites equivalentes (a arte desenhou `cali_soldado`; `caligosuin` é a chave padrão dos inimigos). */
export const SPRITE_ALIASES: Record<string, string[]> = {
  caligosuin: ['cali_soldado'],
  cali_soldado: ['caligosuin'],
};

export function characterSprite(id: string): string | undefined {
  const s = characters.get(id)?.sprite;
  if (s) return s;
  // Soldados Caligosuins numerados (cali_1…cali_N) usam o sprite genérico.
  if (/^cali_\d+$/.test(id) || id === 'cali_soldado') return 'cali_soldado';
  return undefined;
}

// ---------- assets (arte/áudio da sessão de arte) ----------

const imageUrls = import.meta.glob('/assets/images/**/*.png', { eager: true, query: '?url', import: 'default' });
const portraitUrls = import.meta.glob('/assets/portraits/**/*.png', { eager: true, query: '?url', import: 'default' });
const tilesetUrls = import.meta.glob('/assets/tilesets/**/*.png', { eager: true, query: '?url', import: 'default' });
const spriteUrls = import.meta.glob('/assets/sprites/**/*.png', { eager: true, query: '?url', import: 'default' });
const spriteMeta = import.meta.glob('/assets/sprites/**/*.json', { eager: true, import: 'default' });
const musicFileUrls = import.meta.glob('/assets/audio/music/**/*.{ogg,mp3,m4a,wav}', { eager: true, query: '?url', import: 'default' });
const musicManifestModules = import.meta.glob('/assets/audio/music/manifest.json', { eager: true, import: 'default' });
const sfxUrls = import.meta.glob('/assets/audio/sfx/**/*.{ogg,mp3,m4a,wav}', { eager: true, query: '?url', import: 'default' });

export interface AssetEntry {
  key: string;
  url: string;
}
export interface PoseAnim {
  frames: number[];
  frameRate?: number;
  repeat?: number;
}
export interface SpriteEntry extends AssetEntry {
  frameWidth: number;
  frameHeight: number;
  /** Folhas de pose: ator/sprite alvo das animações (`<alvo>:<anim>`). */
  alvo?: string;
  anims?: Record<string, PoseAnim>;
}

const toEntries = (rec: Record<string, unknown>, prefix = ''): AssetEntry[] =>
  Object.entries(rec).map(([path, url]) => ({ key: prefix + baseName(path), url: url as string }));

/** Agrupa formatos alternativos do mesmo áudio (ex.: tema.ogg + tema.mp3). */
const toAudioEntries = (rec: Record<string, unknown>, prefix: string): { key: string; urls: string[] }[] => {
  const byKey = new Map<string, string[]>();
  for (const [path, url] of Object.entries(rec)) {
    const k = prefix + baseName(path);
    byKey.set(k, [...(byKey.get(k) ?? []), url as string]);
  }
  return [...byKey].map(([key, urls]) => ({ key, urls }));
};

export const assetManifest = {
  images: toEntries(imageUrls),
  portraits: toEntries(portraitUrls, 'portrait:'),
  tilesets: toEntries(tilesetUrls, 'tileset:'),
  sprites: Object.entries(spriteUrls).map(([path, url]): SpriteEntry => {
    const meta = (spriteMeta[path.replace(/\.png$/, '.json')] ?? {}) as Partial<SpriteEntry>;
    return {
      key: baseName(path),
      url: url as string,
      frameWidth: meta.frameWidth ?? 16,
      frameHeight: meta.frameHeight ?? 24,
      alvo: meta.alvo,
      anims: meta.anims,
    };
  }),
  music: toAudioEntries(musicFileUrls, 'music:'),
  sfx: toAudioEntries(sfxUrls, 'sfx:'),
};

/** Metadados das músicas (assets/audio/music/manifest.json, da sessão de áudio). */
export interface MusicMeta {
  /** false = toca uma vez só (ex.: tema_lenda, tema_mae). Padrão true. */
  loop: boolean;
  /** Trecho em laço, em segundos (padrão: o arquivo inteiro). */
  loopStart?: number;
  loopEnd?: number;
}

export const musicMeta = new Map<string, MusicMeta>();
{
  const raw = Object.values(musicManifestModules)[0] as unknown;
  const list = Array.isArray(raw) ? raw : raw && typeof raw === 'object' ? Object.entries(raw).map(([id, v]) => ({ id, ...(v as object) })) : [];
  for (const e of list as Record<string, unknown>[]) {
    if (typeof e.id !== 'string') continue;
    musicMeta.set(e.id, {
      loop: e.loop !== false,
      loopStart: typeof e.loopStart === 'number' ? e.loopStart : undefined,
      loopEnd: typeof e.loopEnd === 'number' ? e.loopEnd : undefined,
    });
  }
}

/** URLs de uma música (ogg/mp3...) para carregar sob demanda. */
export function musicUrls(id: string): string[] {
  return assetManifest.music.find((m) => m.key === `music:${id}`)?.urls ?? [];
}
