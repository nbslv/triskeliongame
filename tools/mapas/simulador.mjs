// Simulador de furtividade a partir do ESTADO VIVO das patrulhas (usado pelo robô de playtest).
// Mesmas regras de src/systems/stealth/Patrol.ts: andar por eixos, pausa nos pontos, giro de sentinela e cone de visão.
const DIRA = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 };
const DT = 0.0625;
const PASSO = 2; // 1 passo do jogador = 2 ticks = 0,125 s (≈ 16 px a 130 px/s)

export function criarSimulador({ W, H, bloq, escondido }) {
  const bloqPx = (x, y) => x < 0 || y < 0 || x >= W * 16 || y >= H * 16 || bloq[Math.floor(y / 16) * W + Math.floor(x / 16)] === 1;
  const ve = (e, px, py, rm, am) => {
    const ex = e.x, ey = e.y - 6;
    const dx = px - ex, dy = py - ey, d = Math.hypot(dx, dy);
    if (d > e.range + rm) return false;
    if (d < 1) return true;
    const a = Math.atan2(dy, dx);
    let df = (a - DIRA[e.facing]) % (Math.PI * 2);
    if (df > Math.PI) df -= Math.PI * 2; if (df < -Math.PI) df += Math.PI * 2;
    if (Math.abs(df) > (e.ang * Math.PI) / 360 + am) return false;
    for (let s = 4; s <= d; s += 4) if (bloqPx(ex + Math.cos(a) * s, ey + Math.sin(a) * s)) return false;
    return true;
  };
  function passo(e, t) {
    if (e.rota.length > 1) {
      if (t < e.waitUntil) return;
      const g = e.rota[e.target];
      const dx = g.x - e.x, dy = g.y - e.y, d = Math.hypot(dx, dy);
      if (d < 2) {
        e.x = g.x; e.y = g.y; e.waitUntil = t + e.wait;
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
      e.nextTurn = t + e.turn;
      const o = ['down', 'left', 'up', 'right'];
      e.facing = o[(o.indexOf(e.facing) + 1) % 4];
    }
  }
  /** `vivos`: [{x,y,facing,target,dir,waitLeft,turnLeft,rota:[{x,y}],mode,speed,wait(s),range,ang,turn(s)}] → estados por passo do jogador. */
  function simular(vivos, horizonte = 40, passoTicks = PASSO) {
    const es = vivos.map((v) => ({ ...v, waitUntil: v.waitLeft ?? 0, nextTurn: v.turnLeft ?? 0 }));
    const estados = [];
    for (let k = 0; k * DT < horizonte; k++) {
      const t = k * DT;
      for (const e of es) passo(e, t);
      if (k % passoTicks === 0) estados.push(es.map((e) => ({ x: e.x, y: e.y, facing: e.facing, range: e.range, ang: e.ang })));
    }
    return estados;
  }
  function visto(estado, tx, ty, rm = 0, am = 0) {
    if (escondido(tx, ty)) return false;
    const px = tx * 16 + 8, py = ty * 16 + 14;
    return estado.some((e) => Math.hypot(px - e.x, py - e.y) < 12 + rm || ve(e, px, py - 8, rm, am) || ve(e, px, py - 2, rm, am));
  }
  /** Busca em tempo × tiles. Retorna a lista de tiles por passo (inclui "ficar parado") até tocar um alvo, ou null. */
  function resolver(estados, de, alvos, rm = 0, am = 0, caixa = null) {
    const alvoSet = new Set(alvos.map(([x, y]) => `${x},${y}`));
    if (alvoSet.has(`${de[0]},${de[1]}`)) return [];
    let atual = new Map([[`${de[0]},${de[1]}`, null]]);
    const camadas = [];
    const memo = new Map();
    const vistoM = (i, nx, ny) => { const k = `${i}:${nx},${ny}`; let r = memo.get(k); if (r === undefined) { r = visto(estados[i], nx, ny, rm, am); memo.set(k, r); } return r; };
    for (let i = 0; i < estados.length - 1; i++) {
      const prox = new Map();
      for (const k of atual.keys()) {
        const [x, y] = k.split(',').map(Number);
        for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= W || ny >= H || bloq[ny * W + nx]) continue;
          if (caixa && (nx < caixa[0] || nx > caixa[2] || ny < caixa[1] || ny > caixa[3])) continue;
          const nk = `${nx},${ny}`;
          if (prox.has(nk) || vistoM(i + 1, nx, ny)) continue;
          prox.set(nk, k);
        }
      }
      camadas.push(prox);
      for (const k of prox.keys()) {
        if (alvoSet.has(k)) {
          const rota = [];
          let kk = k;
          for (let j = camadas.length - 1; j >= 0; j--) { rota.unshift(kk.split(',').map(Number)); kk = camadas[j].get(kk); }
          return rota;
        }
      }
      atual = prox;
      if (!atual.size) return null;
    }
    return null;
  }
  return { simular, visto, resolver, PASSO_S: PASSO * DT };
}
