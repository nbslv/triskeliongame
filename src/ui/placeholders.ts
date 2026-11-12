import Phaser from 'phaser';
import { DIRECTIONS, DIRECTION_ROW, TILE_SIZE, type Direction } from '../config/constants';

/**
 * Texturas PROVISÓRIAS geradas por código, usadas até a sessão de arte entregar
 * os arquivos em assets/. Convenção de spritesheet de personagem (igual à arte final):
 *   quadros 16×24, 4 linhas (baixo, esquerda, direita, cima) × 3 colunas (parado, passo A, passo B).
 */
export const CHAR_W = 16;
export const CHAR_H = 24;
export const CHAR_COLS = 3;

interface CharStyle {
  skin: string;
  hair: string;
  shirt: string;
  pants: string;
  kind?: 'human' | 'pig';
}

const STYLES: Record<string, CharStyle> = {
  icaro: { skin: '#f1c9a0', hair: '#f2d16b', shirt: '#3a7bd5', pants: '#4a3a2a' },
  pai: { skin: '#e0b48c', hair: '#b8b8b8', shirt: '#7a5a3a', pants: '#3a3030' },
  caligosuin: { skin: '#8a8a94', hair: '#3a3440', shirt: '#4a2f4f', pants: '#2a242e', kind: 'pig' },
};

function hashColor(seed: string, s = 55, l = 50): string {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return `hsl(${h % 360}, ${s}%, ${l}%)`;
}

export function styleFor(key: string): CharStyle {
  if (STYLES[key]) return STYLES[key]!;
  if (/caligosuin|inimigo|enemy/i.test(key)) return STYLES.caligosuin!;
  return { skin: '#e8bf98', hair: hashColor(key + 'h', 35, 30), shirt: hashColor(key), pants: '#3c3a46' };
}

export function colorFor(key: string): string {
  return styleFor(key).shirt;
}

function drawChar(ctx: CanvasRenderingContext2D, ox: number, oy: number, dir: Direction, frame: number, st: CharStyle) {
  const px = (x: number, y: number, w: number, h: number, c: string) => {
    ctx.fillStyle = c;
    ctx.fillRect(ox + x, oy + y, w, h);
  };
  const outline = '#1a1420';
  // sombra
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(ox + 8, oy + 22.5, 6, 1.6, 0, 0, Math.PI * 2);
  ctx.fill();
  // pernas (alternam no passo)
  const lOff = frame === 1 ? -1 : frame === 2 ? 1 : 0;
  px(4, 18 + Math.max(0, lOff), 4, 5 - Math.abs(lOff), outline);
  px(8, 18 + Math.max(0, -lOff), 4, 5 - Math.abs(lOff), outline);
  px(5, 18 + Math.max(0, lOff), 2, 4 - Math.abs(lOff), st.pants);
  px(9, 18 + Math.max(0, -lOff), 2, 4 - Math.abs(lOff), st.pants);
  // corpo
  const bob = frame === 0 ? 0 : 1;
  px(2, 10 + bob, 12, 9, outline);
  px(3, 11 + bob, 10, 7, st.shirt);
  // braços
  if (dir === 'down' || dir === 'up') {
    px(1, 12 + bob, 2, 5, outline);
    px(13, 12 + bob, 2, 5, outline);
  }
  // cabeça
  px(2, 1 + bob, 12, 11, outline);
  px(3, 2 + bob, 10, 9, st.skin);
  if (st.kind === 'pig') {
    // orelhas, focinho e presas
    px(2, 0 + bob, 3, 3, outline);
    px(11, 0 + bob, 3, 3, outline);
    if (dir === 'down') {
      px(5, 7 + bob, 6, 3, '#c98a9a');
      px(6, 8 + bob, 1, 1, outline);
      px(9, 8 + bob, 1, 1, outline);
      px(4, 9 + bob, 1, 2, '#fffbe8');
      px(11, 9 + bob, 1, 2, '#fffbe8');
      px(5, 5 + bob, 1, 1, '#ff3a2a');
      px(10, 5 + bob, 1, 1, '#ff3a2a');
    } else if (dir === 'left' || dir === 'right') {
      const sx = dir === 'left' ? 1 : 12;
      px(sx, 7 + bob, 3, 3, '#c98a9a');
      px(dir === 'left' ? 4 : 11, 9 + bob, 1, 2, '#fffbe8');
      px(dir === 'left' ? 5 : 10, 5 + bob, 1, 1, '#ff3a2a');
    } else {
      px(3, 2 + bob, 10, 3, st.hair);
    }
    return;
  }
  // cabelo
  if (dir === 'up') {
    px(3, 2 + bob, 10, 8, st.hair);
  } else {
    px(3, 2 + bob, 10, 3, st.hair);
    if (dir === 'left') px(10, 2 + bob, 3, 6, st.hair);
    if (dir === 'right') px(3, 2 + bob, 3, 6, st.hair);
  }
  // olhos
  if (dir === 'down') {
    px(5, 6 + bob, 1, 2, outline);
    px(10, 6 + bob, 1, 2, outline);
  } else if (dir === 'left') {
    px(4, 6 + bob, 1, 2, outline);
  } else if (dir === 'right') {
    px(11, 6 + bob, 1, 2, outline);
  }
}

/** Garante uma textura de personagem com a chave dada (gera placeholder se não existir). */
export function ensureCharacterTexture(scene: Phaser.Scene, key: string): string {
  if (scene.textures.exists(key)) return key;
  const tex = scene.textures.createCanvas(key, CHAR_W * CHAR_COLS, CHAR_H * 4);
  if (!tex) return key;
  const ctx = tex.getContext();
  const st = styleFor(key);
  for (const dir of DIRECTIONS) {
    for (let f = 0; f < CHAR_COLS; f++) {
      drawChar(ctx, f * CHAR_W, DIRECTION_ROW[dir] * CHAR_H, dir, f, st);
    }
  }
  tex.refresh();
  let i = 0;
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < CHAR_COLS; col++) tex.add(i++, 0, col * CHAR_W, row * CHAR_H, CHAR_W, CHAR_H);
  }
  return key;
}

/** Cria as animações de caminhada `<chave>:walk-<dir>` e `<chave>:idle-<dir>`. */
export function ensureCharacterAnims(scene: Phaser.Scene, key: string): void {
  if (scene.anims.exists(`${key}:walk-down`)) return;
  const tex = scene.textures.get(key);
  const total = tex.frameTotal - 1; // exclui __BASE
  const cols = Math.max(1, Math.floor(total / 4));
  for (const dir of DIRECTIONS) {
    const row = DIRECTION_ROW[dir];
    const base = row * cols;
    const walk = cols >= 4 ? [base + 1, base + 2, base + 3, base] : cols === 3 ? [base + 1, base, base + 2, base] : [base];
    scene.anims.create({
      key: `${key}:walk-${dir}`,
      frames: walk.map((frame) => ({ key, frame })),
      frameRate: 8,
      repeat: -1,
    });
    scene.anims.create({ key: `${key}:idle-${dir}`, frames: [{ key, frame: base }], frameRate: 1 });
  }
}

/** Índices do tileset provisório (gid no Tiled = firstgid + índice). */
export const PLACEHOLDER_TILES = {
  grama: 0,
  terra: 1,
  muro: 2,
  agua: 3,
  madeira: 4,
  arbusto: 5,
  barril: 6,
  arvore: 7,
  telhado: 8,
  parede: 9,
  porta: 10,
  flores: 11,
  cerca: 12,
  fogo: 13,
  cinzas: 14,
  escuro: 15,
} as const;

export const PLACEHOLDER_TILESET_KEY = 'tileset:placeholder';
export const PLACEHOLDER_TILESET_COLS = 8;

function drawTile(ctx: CanvasRenderingContext2D, ox: number, oy: number, idx: number) {
  const T = TILE_SIZE;
  const px = (x: number, y: number, w: number, h: number, c: string) => {
    ctx.fillStyle = c;
    ctx.fillRect(ox + x, oy + y, w, h);
  };
  const speckle = (c: string, seed: number, n = 6) => {
    let s = seed;
    for (let i = 0; i < n; i++) {
      s = (s * 1103515245 + 12345) >>> 0;
      px(s % T, (s >> 8) % T, 1, 1, c);
    }
  };
  switch (idx) {
    case 0: px(0, 0, T, T, '#4f8a3c'); speckle('#6aa84f', 3, 8); speckle('#3e7030', 9, 5); break;
    case 1: px(0, 0, T, T, '#a07a4a'); speckle('#8a6a3e', 5, 8); speckle('#b88d58', 7, 5); break;
    case 2:
      px(0, 0, T, T, '#6b6b78');
      px(0, 7, T, 1, '#4a4a55'); px(0, 15, T, 1, '#4a4a55');
      px(7, 0, 1, 7, '#4a4a55'); px(3, 8, 1, 7, '#4a4a55'); px(11, 8, 1, 7, '#4a4a55');
      break;
    case 3: px(0, 0, T, T, '#2f5f9a'); px(2, 4, 5, 1, '#5a8acb'); px(9, 10, 5, 1, '#5a8acb'); break;
    case 4: px(0, 0, T, T, '#8a5a32'); for (let y = 3; y < T; y += 4) px(0, y, T, 1, '#6a4224'); break;
    case 5:
      px(0, 0, T, T, '#4f8a3c');
      ctx.fillStyle = '#2e5e26'; ctx.beginPath(); ctx.arc(ox + 8, oy + 9, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#3f7a32'; ctx.beginPath(); ctx.arc(ox + 6, oy + 7, 4, 0, Math.PI * 2); ctx.fill();
      px(9, 5, 2, 2, '#5a9a48');
      break;
    case 6:
      px(0, 0, T, T, '#a07a4a');
      px(3, 2, 10, 13, '#1a1420'); px(4, 3, 8, 11, '#9a6a3a');
      px(4, 5, 8, 1, '#5a5a62'); px(4, 11, 8, 1, '#5a5a62');
      break;
    case 7:
      px(0, 0, T, T, '#4f8a3c');
      ctx.fillStyle = '#25502a'; ctx.beginPath(); ctx.arc(ox + 8, oy + 7, 7, 0, Math.PI * 2); ctx.fill();
      px(6, 11, 4, 5, '#5a3a22');
      break;
    case 8: px(0, 0, T, T, '#9a3a32'); for (let y = 2; y < T; y += 4) px(0, y, T, 1, '#6e2622'); break;
    case 9: px(0, 0, T, T, '#d8c8a0'); px(0, 0, T, 2, '#8a6a4a'); px(0, 14, T, 2, '#8a6a4a'); break;
    case 10: px(0, 0, T, T, '#d8c8a0'); px(3, 2, 10, 14, '#5a3a22'); px(10, 9, 1, 1, '#e8b04a'); break;
    case 11: px(0, 0, T, T, '#4f8a3c'); speckle('#e8d04a', 11, 4); speckle('#e86a8a', 13, 4); break;
    case 12: px(0, 0, T, T, '#4f8a3c'); px(0, 5, T, 2, '#8a6a3a'); px(0, 10, T, 2, '#8a6a3a'); px(2, 3, 2, 11, '#6a4a2a'); px(12, 3, 2, 11, '#6a4a2a'); break;
    case 13:
      px(0, 0, T, T, '#3a2a2a');
      ctx.fillStyle = '#e85a1a'; ctx.beginPath(); ctx.moveTo(ox + 2, oy + 16); ctx.lineTo(ox + 8, oy + 1); ctx.lineTo(ox + 14, oy + 16); ctx.fill();
      ctx.fillStyle = '#f8c84a'; ctx.beginPath(); ctx.moveTo(ox + 5, oy + 16); ctx.lineTo(ox + 8, oy + 6); ctx.lineTo(ox + 11, oy + 16); ctx.fill();
      break;
    case 14: px(0, 0, T, T, '#3a3438'); speckle('#5a5058', 17, 8); speckle('#1e1a1e', 19, 6); break;
    default: px(0, 0, T, T, '#0b0a12');
  }
}

export function ensurePlaceholderTileset(scene: Phaser.Scene): void {
  if (scene.textures.exists(PLACEHOLDER_TILESET_KEY)) return;
  const tex = scene.textures.createCanvas(PLACEHOLDER_TILESET_KEY, PLACEHOLDER_TILESET_COLS * TILE_SIZE, 2 * TILE_SIZE);
  if (!tex) return;
  const ctx = tex.getContext();
  for (let i = 0; i < 16; i++) {
    drawTile(ctx, (i % PLACEHOLDER_TILESET_COLS) * TILE_SIZE, Math.floor(i / PLACEHOLDER_TILESET_COLS) * TILE_SIZE, i);
  }
  tex.refresh();
}

/** Retrato provisório 64×64 com a inicial do personagem. */
export function ensurePortrait(scene: Phaser.Scene, key: string, label: string): string {
  const texKey = `portrait:${key}`;
  if (scene.textures.exists(texKey)) return texKey;
  const tex = scene.textures.createCanvas(texKey, 64, 64);
  if (!tex) return texKey;
  const ctx = tex.getContext();
  ctx.fillStyle = '#1a1420';
  ctx.fillRect(0, 0, 64, 64);
  ctx.fillStyle = colorFor(key.split('_')[0] ?? key);
  ctx.fillRect(2, 2, 60, 60);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(2, 40, 60, 22);
  ctx.fillStyle = '#f4ecd8';
  ctx.font = '40px VT323, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText((label || key).charAt(0).toUpperCase(), 32, 30);
  tex.refresh();
  return texKey;
}
