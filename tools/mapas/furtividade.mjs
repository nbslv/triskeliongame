// Verifica se a furtividade de prologo_vila tem solução: busca em tempo × tiles (BFS) simulando as patrulhas
// do motor (mesmas regras de src/systems/stealth/Patrol.ts) e os cones de visão. Também testa com margem
// (alcance +8 px, abertura +10°) para garantir que a solução não exija precisão de pixel.
// Uso: node tools/mapas/furtividade.mjs [--margem]
import { carregar } from './validar.mjs';

const M = carregar('prologo_vila');
const { width: W, height: H } = M.m;
const props = (o) => Object.fromEntries((o.properties ?? []).map((p) => [p.name, p.value]));
const pt = (o) => ({ x: o.x, y: o.y });
const bloqPx = (x, y) => x < 0 || y < 0 || x >= W * 16 || y >= H * 16 || M.bloq[Math.floor(y / 16) * W + Math.floor(x / 16)] === 1;
const DIRA = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 };
const margem = process.argv.includes('--margem');
const RM = margem ? 8 : 0, AM = margem ? (10 * Math.PI) / 180 : 0;

// ---- inimigos
const inimigos = M.objs.filter((x) => x.t === 'inimigo').map((x) => {
  const p = x.p;
  const rota = p.route ? [...M.marcadores.entries()].filter(([n]) => new RegExp(`^${p.route}_p\\d+$`).test(n)).sort((a, b) => Number(a[0].split('_p')[1]) - Number(b[0].split('_p')[1])).map(([, m]) => ({ x: m.tx * 16 + 8, y: m.ty * 16 + 15 })) : [];
  const pos = rota[0] ?? { x: x.o.x, y: x.o.y };
  return { id: x.o.name, rota, mode: p.mode ?? 'pingpong', speed: p.speed ?? 40, wait: p.wait ?? 700, range: p.vision ?? 80, ang: p.angle ?? 70, turn: p.turn ?? 0, facing: p.facing ?? 'down', ...pos, target: rota.length > 1 ? 1 : 0, dir: 1, waitUntil: 0, nextTurn: 0 };
});
const DT = 0.0625;
function passo(e, t) {
  if (e.rota.length > 1) {
    if (t < e.waitUntil) return;
    const g = e.rota[e.target];
    const dx = g.x - e.x, dy = g.y - e.y, d = Math.hypot(dx, dy);
    if (d < 2) {
      e.x = g.x; e.y = g.y; e.waitUntil = t + e.wait / 1000;
      const n = e.rota.length;
      if (e.mode === 'loop') e.target = (e.target + 1) % n;
      else { if (e.target + e.dir >= n || e.target + e.dir < 0) e.dir *= -1; e.target += e.dir; }
      const nx = e.rota[e.target];
      const ddx = nx.x - e.x, ddy = nx.y - e.y;
      e.facing = Math.abs(ddx) > Math.abs(ddy) ? (ddx < 0 ? 'left' : 'right') : ddy < 0 ? 'up' : 'down';
      return;
    }
    const v = e.speed * DT;
    if (Math.abs(dx) >= Math.abs(dy)) { e.x += Math.sign(dx) * Math.min(v, Math.abs(dx)); e.facing = dx < 0 ? 'left' : 'right'; }
    else { e.y += Math.sign(dy) * Math.min(v, Math.abs(dy)); e.facing = dy < 0 ? 'up' : 'down'; }
  } else if (e.turn > 0 && t >= e.nextTurn) {
    e.nextTurn = t + e.turn / 1000;
    const o = ['down', 'left', 'up', 'right'];
    e.facing = o[(o.indexOf(e.facing) + 1) % 4];
  }
}
function ve(e, px, py) {
  const ex = e.x, ey = e.y - 6;
  const dx = px - ex, dy = py - ey, d = Math.hypot(dx, dy);
  if (d > e.range + RM) return false;
  if (d < 1) return true;
  const a = Math.atan2(dy, dx);
  let df = (a - DIRA[e.facing]) % (Math.PI * 2);
  if (df > Math.PI) df -= Math.PI * 2; if (df < -Math.PI) df += Math.PI * 2;
  if (Math.abs(df) > (e.ang * Math.PI) / 360 + AM) return false;
  for (let s = 4; s <= d; s += 4) if (bloqPx(ex + Math.cos(a) * s, ey + Math.sin(a) * s)) return s - 2 < d - 2 ? false : true;
  return true;
}
// ---- esconderijos (rects + tiles `hide`)
const hides = M.objs.filter((x) => x.t === 'esconderijo').map((x) => x.o);
const escondido = (tx, ty) => hides.some((o) => tx >= Math.floor(o.x / 16) && tx < Math.ceil((o.x + o.width) / 16) && ty >= Math.floor(o.y / 16) && ty < Math.ceil((o.y + o.height) / 16));
function visto(tx, ty) {
  if (escondido(tx, ty)) return false;
  const px = tx * 16 + 8, py = ty * 16 + 14;
  return inimigos.some((e) => Math.hypot(px - e.x, py - e.y) < 12 + RM || ve(e, px, py - 8) || ve(e, px, py - 2));
}

// ---- simulação de todo o tempo (0..T) guardando o estado das patrulhas por passo
const T = 360; // s
const PASSO = 2; // um passo do jogador a cada 2 ticks (0,125 s ≈ 16 px a 130 px/s)
const estados = [];
for (let k = 0; k * DT < T; k++) {
  const t = k * DT;
  for (const e of inimigos) passo(e, t);
  if (k % PASSO === 0) estados.push(inimigos.map((e) => ({ ...e })));
}
function visto2(i, tx, ty) {
  if (escondido(tx, ty)) return false;
  const px = tx * 16 + 8, py = ty * 16 + 14;
  return estados[i].some((e) => Math.hypot(px - e.x, py - e.y) < 12 + RM || ve(e, px, py - 8) || ve(e, px, py - 2));
}
const zona = (nome) => { const o = M.objs.find((x) => x.o.name === nome).o; const r = []; for (let y = Math.floor(o.y / 16); y < Math.ceil((o.y + o.height) / 16); y++) for (let x = Math.floor(o.x / 16); x < Math.ceil((o.x + o.width) / 16); x++) r.push([x, y]); return r; };
const marca = (n) => { const m = M.marcadores.get(n); return [m.tx, m.ty]; };

function resolver(de, alvos, t0 = 0) {
  const N = estados.length;
  const alvoSet = new Set(alvos.map(([x, y]) => `${x},${y}`));
  let atual = new Map([[`${de[0]},${de[1]}`, null]]);
  const pais = [];
  for (let i = t0; i < N - 1; i++) {
    const prox = new Map();
    for (const k of atual.keys()) {
      const [x, y] = k.split(',').map(Number);
      for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H || M.bloq[ny * W + nx]) continue;
        const nk = `${nx},${ny}`;
        if (prox.has(nk)) continue;
        if (visto2(i + 1, nx, ny)) continue;
        prox.set(nk, k);
      }
    }
    pais.push(prox);
    for (const k of prox.keys()) if (alvoSet.has(k)) return { ok: true, tempo: ((i + 1 - t0) * PASSO * DT).toFixed(0), passos: i + 1 - t0 };
    atual = prox;
    if (!atual.size) return { ok: false, motivo: 'encurralado' };
  }
  return { ok: false, motivo: 'tempo esgotado' };
}

if (process.env.DEPURAR) {
  for (const i of [0, 8, 16, 40, 80, 160]) console.log((i * PASSO * DT).toFixed(1), estados[i].map((e) => `${e.id}:${Math.round(e.x / 16)},${Math.round(e.y / 16)}${e.facing[0]}`).join(' '));
}
if (process.env.DEPURAR) {
  for (const [nome, x0, y0, x1, y1] of [['rua A', 45, 10, 65, 12], ['praça', 30, 13, 42, 25], ['rua C', 6, 36, 36, 38]]) {
    let n = 0, v = 0;
    for (let i = 0; i < 200; i++) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { n++; if (visto2(i, x, y)) v++; }
    console.log(nome, 'fração vista:', (v / n).toFixed(2));
  }
}
const tre = [
  ['A: esconderijo_1 → checkpoint_praca', marca('marcador_vila_esconderijo_1'), zona('checkpoint_praca')],
  ['B: checkpoint_praca → checkpoint_beco', marca('marcador_vila_esconderijo_praca'), zona('checkpoint_beco')],
  ['C: checkpoint_beco → casa (gatilho_casa)', zona('checkpoint_beco')[1], zona('gatilho_casa')],
];
let falhou = false;
for (const [nome, de, para] of tre) {
  // sem esperar no início: a espera já é parte da busca (parado num esconderijo vale)
  const r = resolver(de, para);
  console.log(`${r.ok ? '✔' : '✘'} ${nome}${margem ? ' (com margem)' : ''}: ${r.ok ? `solução em ~${r.tempo} s` : r.motivo}`);
  if (!r.ok) falhou = true;
}
process.exit(falhou ? 1 : 0);
