// Biblioteca para montar mapas Tiled (JSON) do Prólogo por código.
// Os mapas finais ficam em content/maps/*.json (e abrem normalmente no Tiled).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DIR_TS = join(RAIZ, 'docs', 'arte', 'tilesets');
const S = 16;

const cacheTs = new Map();
export function carregarTileset(nome) {
  if (!cacheTs.has(nome)) {
    const json = JSON.parse(readFileSync(join(DIR_TS, `${nome}.json`), 'utf8'));
    let ind = {};
    try {
      ind = JSON.parse(readFileSync(join(DIR_TS, `${nome}.indices.json`), 'utf8'));
    } catch {
      /* tilesets de luz alternativa (_tarde/_noite) usam os índices do base */
    }
    cacheTs.set(nome, { json, ind });
  }
  return cacheTs.get(nome);
}

/** Índices por nome: tiles_exterior_noite usa os de tiles_exterior etc. */
export function indices(nome) {
  const base = nome.replace(/_(tarde|noite)$/, '');
  return carregarTileset(base).ind;
}

export const prop = (name, value) => ({
  name,
  type: typeof value === 'boolean' ? 'bool' : typeof value === 'number' ? (Number.isInteger(value) ? 'int' : 'float') : 'string',
  value,
});
const props = (o) => Object.entries(o ?? {}).map(([k, v]) => prop(k, v));

export const CAMADAS_TILES = ['chao', 'chao2', 'objetos', 'objetos2', 'acima'];

export class Mapa {
  /** @param tilesets nomes na ordem (o primeiro recebe firstgid 1) */
  constructor(id, w, h, tilesets, propriedades = {}) {
    this.id = id;
    this.w = w;
    this.h = h;
    this.nomes = tilesets;
    this.propriedades = propriedades;
    this.firstgid = {};
    this.tilesets = [];
    let fg = 1;
    for (const n of tilesets) {
      const { json } = carregarTileset(n);
      this.firstgid[n] = fg;
      this.tilesets.push({ firstgid: fg, ...JSON.parse(JSON.stringify(json)) });
      fg += json.tilecount;
    }
    this.dados = Object.fromEntries(CAMADAS_TILES.map((c) => [c, new Array(w * h).fill(0)]));
    this.entidades = [];
    this.marcadores = [];
    this.nextId = 1;
  }

  ind(ts, nome) {
    const v = indices(ts)[nome];
    if (v === undefined) throw new Error(`tile "${nome}" não existe em ${ts}`);
    return v;
  }

  dentro(x, y) {
    return x >= 0 && y >= 0 && x < this.w && y < this.h;
  }

  /** Coloca um tile (índice ou nome) numa camada. */
  put(camada, x, y, ts, idx) {
    if (!this.dentro(x, y)) return;
    const i = typeof idx === 'string' ? this.ind(ts, idx) : idx;
    if (idx !== null && !Number.isInteger(i)) throw new Error(`${this.id}: tile inválido em put(${camada},${x},${y},${ts},${JSON.stringify(idx)}) — use bloco() para blocos`);
    this.dados[camada][y * this.w + x] = idx === null ? 0 : this.firstgid[ts] + i;
  }
  limpar(camada, x, y) {
    if (this.dentro(x, y)) this.dados[camada][y * this.w + x] = 0;
  }
  /** Bloco (matriz de índices; null = pula). `nome` pode ser o nome do bloco no .indices.json. */
  bloco(camada, x, y, ts, m) {
    const mat = typeof m === 'string' ? this.ind(ts, m) : m;
    const linhas = Array.isArray(mat) ? (Array.isArray(mat[0]) ? mat : [mat]) : [[mat]];
    linhas.forEach((l, j) => l.forEach((v, i) => v !== null && this.put(camada, x + i, y + j, ts, v)));
  }
  /** Preenche retângulo. `v` pode ser função (x,y)=>índice|nome. */
  encher(camada, x0, y0, w, h, ts, v) {
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) this.put(camada, x, y, ts, typeof v === 'function' ? v(x, y) : v);
  }
  /** Retângulo de contorno. */
  contorno(camada, x0, y0, w, h, ts, v) {
    for (let x = x0; x < x0 + w; x++) {
      this.put(camada, x, y0, ts, v);
      this.put(camada, x, y0 + h - 1, ts, v);
    }
    for (let y = y0; y < y0 + h; y++) {
      this.put(camada, x0, y, ts, v);
      this.put(camada, x0 + w - 1, y, ts, v);
    }
  }
  /** Mancha 3x3 esticada (cantos/lados/centro) cobrindo o retângulo. Matriz 3x3 de índices. */
  mancha(camada, x0, y0, w, h, ts, nomeBloco) {
    const m = this.ind(ts, nomeBloco);
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) {
        const r = j === 0 ? 0 : j === h - 1 ? 2 : 1;
        const c = i === 0 ? 0 : i === w - 1 ? 2 : 1;
        this.put(camada, x0 + i, y0 + j, ts, m[r][c]);
      }
    }
  }

  /** Bloco com a(s) linha(s) de cima na camada `acima` (cobrem o jogador) e o resto em `objetos`. */
  blocoAlto(x, y, ts, nome, linhasAcima, camadaBase = 'objetos') {
    const mat = this.ind(ts, nome);
    mat.forEach((l, j) => l.forEach((v, i) => v !== null && this.put(j < linhasAcima ? 'acima' : camadaBase, x + i, y + j, ts, v)));
  }

  /** Autotile de manchas (borda_* + borda_*_int) sobre o conjunto de células `cel` (Set "x,y"). */
  autotile(camada, ts, bordaNome, cel, tipoDe = () => bordaNome, presenca = cel) {
    const tem = (x, y) => presenca.has(`${x},${y}`);
    for (const k of cel) {
      const [x, y] = k.split(',').map(Number);
      const b = tipoDe(x, y);
      const m3 = this.ind(ts, b);
      const m2 = this.ind(ts, `${b}_int`);
      const n = tem(x, y - 1), s = tem(x, y + 1), e = tem(x + 1, y), w = tem(x - 1, y);
      let t;
      if (n && s && e && w) {
        if (!tem(x + 1, y - 1)) t = m2[1][0];
        else if (!tem(x - 1, y - 1)) t = m2[1][1];
        else if (!tem(x + 1, y + 1)) t = m2[0][1];
        else if (!tem(x - 1, y + 1)) t = m2[0][0];
        else t = m3[1][1];
      } else {
        t = m3[!n ? 0 : !s ? 2 : 1][!w ? 0 : !e ? 2 : 1];
      }
      this.put(camada, x, y, ts, t);
    }
  }

  // --------------------------------------------------------------- objetos
  centroPx(tx, ty) {
    return { x: tx * S + 8, y: ty * S + 15 };
  }
  marcador(nome, tx, ty) {
    if (this.marcadores.some((m) => m.name === nome)) throw new Error(`${this.id}: marcador duplicado ${nome}`);
    this.marcadores.push({ id: this.nextId++, name: nome, type: '', point: true, ...this.centroPx(tx, ty), width: 0, height: 0, rotation: 0, visible: true });
  }
  entidade(o) {
    this.entidades.push({ id: this.nextId++, rotation: 0, visible: true, width: 0, height: 0, ...o });
  }
  zona(nome, tipo, tx, ty, tw, th, p = {}) {
    this.entidade({ name: nome, type: tipo, x: tx * S, y: ty * S, width: tw * S, height: th * S, properties: props(p) });
  }
  npc(nome, tx, ty, p = {}) {
    this.entidade({ name: nome, type: 'npc', point: true, ...this.centroPx(tx, ty), properties: props(p) });
  }
  /** Examinável de 1 ponto (tile) ou retângulo. */
  examinar(nome, tx, ty, p = {}, tw = 1, th = 1) {
    this.zona(nome, 'examinar', tx, ty, tw, th, p);
  }
  inimigo(nome, tx, ty, p = {}) {
    this.entidade({ name: nome, type: 'inimigo', point: true, ...this.centroPx(tx, ty), properties: props(p) });
  }
  /** Rota por marcadores: gera <rota>_p1..pN. */
  rota(nome, pontos) {
    pontos.forEach(([x, y], i) => this.marcador(`${nome}_p${i + 1}`, x, y));
  }

  construir() {
    const camadas = [];
    let id = 1;
    for (const c of CAMADAS_TILES) {
      camadas.push({ id: id++, name: c, type: 'tilelayer', width: this.w, height: this.h, x: 0, y: 0, opacity: 1, visible: true, data: this.dados[c] });
    }
    camadas.push({ id: id++, name: 'entidades', type: 'objectgroup', draworder: 'topdown', x: 0, y: 0, opacity: 1, visible: true, objects: this.entidades });
    camadas.push({ id: id++, name: 'markers', type: 'objectgroup', draworder: 'topdown', x: 0, y: 0, opacity: 1, visible: true, objects: this.marcadores });
    return {
      type: 'map', version: '1.10', tiledversion: '1.10.2', orientation: 'orthogonal', renderorder: 'right-down',
      width: this.w, height: this.h, tilewidth: S, tileheight: S, infinite: false, compressionlevel: -1,
      nextlayerid: id, nextobjectid: this.nextId,
      properties: props(this.propriedades),
      tilesets: this.tilesets,
      layers: camadas,
    };
  }

  salvar() {
    const dir = join(RAIZ, 'content', 'maps');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, `${this.id}.json`), JSON.stringify(this.construir()) + '\n');
  }
}

/** Gerador pseudoaleatório determinístico. */
export function rng(semente) {
  let s = semente >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}
