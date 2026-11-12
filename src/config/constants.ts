/** Constantes globais do motor. Nada de conteúdo de história aqui. */
export const GAME_WIDTH = 640;
export const GAME_HEIGHT = 360;
export const TILE_SIZE = 16;

export const FONT_FAMILY = 'VT323, monospace';

export const COLORS = {
  bg: 0x0b0a12,
  panel: 0x1c1a2b,
  panelBorder: 0xf4ecd8,
  text: '#f4ecd8',
  textDim: '#9a93a8',
  accent: '#e8b04a',
  accentNum: 0xe8b04a,
  danger: 0xd8463c,
  vision: 0xffd75a,
  visionAlert: 0xff4a3a,
} as const;

/** Profundidades (depth) de renderização. Atores usam depth = y (ordenação por altura). */
export const DEPTH = {
  ground: 0,
  vision: 5,
  actorsBase: 10,
  above: 100000,
  emote: 100100,
  overlay: 200000,
} as const;

export const PLAYER_SPEED = 80;
export const PLAYER_RUN_SPEED = 130;
export const NPC_SPEED = 60;

export const SCENES = {
  boot: 'Boot',
  preload: 'Preload',
  senha: 'Senha',
  titulo: 'Titulo',
  opcoes: 'Opcoes',
  espacos: 'Espacos',
  mundo: 'Mundo',
  dialogo: 'Dialogo',
  menu: 'Menu',
  controles: 'Controles',
} as const;

export type Direction = 'down' | 'left' | 'right' | 'up';
export const DIRECTIONS: readonly Direction[] = ['down', 'left', 'right', 'up'];

/** Linha do spritesheet de personagem para cada direção (convenção do motor). */
export const DIRECTION_ROW: Record<Direction, number> = { down: 0, left: 1, right: 2, up: 3 };
