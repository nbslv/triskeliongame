// Gera content/maps/teste_arte.json: mapa de TESTE do motor com os tilesets reais da arte
// (docs/arte/tilesets/*.json embutidos) para conferir carregamento, `collides`, `hide` e tiles animados.
// Uso: node scripts/gerar-mapa-teste-arte.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const load = (n) => JSON.parse(readFileSync(`docs/arte/tilesets/${n}.json`, 'utf8'));
const idx = (n) => JSON.parse(readFileSync(`docs/arte/tilesets/${n.replace(/_noite$|_tarde$/, '')}.indices.json`, 'utf8'));

/**
 * Animações no formato padrão do Tiled (o que a arte deve preencher no tileset, ver MAPAS.md):
 * tiles: [{ id: <primeiro quadro>, animation: [{ tileid, duration }, ...] }]
 */
const FOGO_ANIMS = [
  [0, 1, 2], // fogo
  [3, 4, 5], [15, 16, 17], // labareda alta (topo, base)
  [24, 25, 26], // fogo negro
  [27, 28, 29], [39, 40, 41], // labareda negra alta
  [48, 49, 50], [60, 61, 62], // fumaça preta
  [51, 52, 53], // cinzas caindo
];
function withAnimations(ts, anims, ms = 160) {
  const tiles = new Map((ts.tiles ?? []).map((t) => [t.id, { ...t }]));
  for (const frames of anims) {
    const t = tiles.get(frames[0]) ?? { id: frames[0] };
    t.animation = frames.map((tileid) => ({ tileid, duration: ms }));
    tiles.set(frames[0], t);
  }
  return { ...ts, tiles: [...tiles.values()].sort((a, b) => a.id - b.id) };
}

const ext = { ...load('tiles_exterior_noite'), firstgid: 1 };
const fogo = { ...withAnimations(load('tiles_fogo'), FOGO_ANIMS), firstgid: 1 + ext.tilecount };
const E = idx('tiles_exterior');
const F = { fogo: 0, fogo_alto_topo: 3, fogo_alto_base: 15, negro: 24, negro_alto_topo: 27, negro_alto_base: 39, fumaca_topo: 48, fumaca_base: 60, cinzas: 51, brasas: 6 };

const W = 30;
const H = 18;
const layer = () => new Array(W * H).fill(0);
const chao = layer();
const objetos = layer();
const acima = layer();
const put = (arr, x, y, gid) => {
  if (x >= 0 && y >= 0 && x < W && y < H) arr[y * W + x] = gid;
};
const e = (id) => ext.firstgid + id;
const f = (id) => fogo.firstgid + id;

for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) put(chao, x, y, e((x * 7 + y * 3) % 5 === 0 ? E.grama_2 : E.grama_1));
for (let x = 0; x < W; x++) for (const y of [8, 9]) put(chao, x, y, e(E.terra_1));
// árvores (2×3) nas bordas
const tree = E.arvore_1;
for (const [tx, ty] of [[1, 1], [6, 1], [22, 12], [26, 1]]) {
  tree.forEach((row, dy) => row.forEach((id, dx) => put(dy === 0 ? acima : objetos, tx + dx, ty + dy, e(id))));
}
// arbustos (hide) e cerca (collides)
for (const x of [10, 11, 12]) put(objetos, x, 7, e(E.arbusto));
for (let x = 14; x < 20; x++) put(objetos, x, 11, e(E.cerca_h));
// fogo animado: baixo, alto (topo na camada acima), negro, fumaça e cinzas
for (const x of [16, 18, 20]) put(objetos, x, 5, f(F.fogo));
for (const x of [22, 24]) {
  put(acima, x, 4, f(F.fogo_alto_topo));
  put(objetos, x, 5, f(F.fogo_alto_base));
}
for (const x of [16, 18]) put(objetos, x, 13, f(F.negro));
put(acima, 20, 12, f(F.negro_alto_topo));
put(objetos, 20, 13, f(F.negro_alto_base));
put(acima, 25, 13, f(F.fumaca_topo));
put(acima, 25, 14, f(F.fumaca_base));
for (const [x, y] of [[4, 4], [9, 12], [13, 3], [27, 8]]) put(acima, x, y, f(F.cinzas));
put(objetos, 15, 6, f(F.brasas)); // brasas são transparentes (camada acima do chão)

const point = (id, name, tx, ty) => ({ id, name, type: '', point: true, x: tx * 16 + 8, y: ty * 16 + 15, width: 0, height: 0, rotation: 0, visible: true });
const map = {
  type: 'map', version: '1.10', tiledversion: '1.10.2', orientation: 'orthogonal', renderorder: 'right-down',
  width: W, height: H, tilewidth: 16, tileheight: 16, infinite: false, compressionlevel: -1,
  nextlayerid: 6, nextobjectid: 4,
  properties: [{ name: 'nome', type: 'string', value: 'Teste da arte (vila à noite)' }],
  tilesets: [ext, fogo],
  layers: [
    { id: 1, name: 'chao', type: 'tilelayer', width: W, height: H, x: 0, y: 0, opacity: 1, visible: true, data: chao },
    { id: 2, name: 'objetos', type: 'tilelayer', width: W, height: H, x: 0, y: 0, opacity: 1, visible: true, data: objetos },
    { id: 3, name: 'acima', type: 'tilelayer', width: W, height: H, x: 0, y: 0, opacity: 1, visible: true, data: acima },
    { id: 4, name: 'markers', type: 'objectgroup', draworder: 'topdown', x: 0, y: 0, opacity: 1, visible: true,
      objects: [point(1, 'inicio', 8, 9), point(2, 'arbusto', 11, 7), point(3, 'perto_fogo', 18, 7)] },
  ],
};
writeFileSync('content/maps/teste_arte.json', JSON.stringify(map) + '\n');
console.log(`ok: content/maps/teste_arte.json (${fogo.tiles.filter((t) => t.animation).length} tiles animados)`);
