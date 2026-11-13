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
  /**
   * Busca "fina" em ticks de 62,5 ms: andar um tile leva `passoTicks` ticks e o destino (e a origem) precisam estar fora
   * de qualquer cone em TODOS os ticks do trajeto; ficar parado leva 1 tick. Retorna a primeira ação: {mover:[x,y]} | {ficar:true} | null.
   */
  function planejar(vivos, de, alvos, { passoTicks = 3, horizonte = 12, rm = 0, am = 0, caixa = null, atraso = 0 } = {}) {
    const est = simular(vivos, horizonte, 1);
    const N = est.length;
    const alvoSet = new Set(alvos.map(([x, y]) => `${x},${y}`));
    if (alvoSet.has(`${de[0]},${de[1]}`)) return { chegou: true };
    const memo = new Map();
    const seguro = (t, x, y) => {
      const k = `${t}:${x},${y}`;
      let r = memo.get(k);
      if (r === undefined) { r = !visto(est[t], x, y, rm, am); memo.set(k, r); }
      return r;
    };
    const camadas = Array.from({ length: N + passoTicks + 1 }, () => new Map());
    // `atraso`: ticks entre ler o estado do jogo e a ação realmente começar (latência do robô); o jogador fica parado nesse intervalo
    for (let t = 0; t < atraso; t++) camadas[t].set(`${de[0]},${de[1]}`, t === 0 ? null : { de: `${de[0]},${de[1]}`, t: t - 1, mover: null });
    camadas[atraso].set(`${de[0]},${de[1]}`, atraso === 0 ? null : { de: `${de[0]},${de[1]}`, t: atraso - 1, mover: null });
    for (let t = atraso; t < N - 1; t++) {
      for (const [k] of camadas[t]) {
        const [x, y] = k.split(',').map(Number);
        // ficar
        if (seguro(t + 1, x, y)) { const nk = k; if (!camadas[t + 1].has(nk)) camadas[t + 1].set(nk, { de: k, t, mover: null }); }
        // mover
        if (t + passoTicks < N) {
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= W || ny >= H || bloq[ny * W + nx]) continue;
            if (caixa && (nx < caixa[0] || nx > caixa[2] || ny < caixa[1] || ny > caixa[3])) continue;
            let ok = true;
            for (let j = 1; j <= passoTicks && ok; j++) ok = seguro(t + j, nx, ny) && (j > passoTicks / 2 || seguro(t + j, x, y));
            const nk = `${nx},${ny}`;
            if (ok && !camadas[t + passoTicks].has(nk)) camadas[t + passoTicks].set(nk, { de: k, t, mover: [nx, ny] });
          }
        }
      }
      for (const [k] of camadas[t + 1]) {
        if (alvoSet.has(k)) {
          // reconstrói até a primeira ação
          let cur = k, tt = t + 1, ultima = null;
          for (;;) {
            const reg = camadas[tt].get(cur);
            if (!reg) break;
            ultima = reg;
            if (reg.t === atraso && reg.de === `${de[0]},${de[1]}`) break;
            cur = reg.de; tt = reg.t;
          }
          if (!ultima) return null;
          return ultima.mover ? { mover: ultima.mover } : { ficar: true };
        }
      }
      for (const [k] of camadas[t + passoTicks]) if (alvoSet.has(k) && t + passoTicks < N) { /* alcançado no futuro; tratado quando chegar a vez */ }
    }
    return null;
  }
  return { simular, visto, resolver, planejar, PASSO_S: PASSO * DT };
}
