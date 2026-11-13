// Valida os mapas do Prólogo: referências dos roteiros, portas, esconderijos/rotas/checkpoints e
// caminho transitável (BFS) da entrada até cada saída/objeto obrigatório.
// Uso: node tools/mapas/validar.mjs   (também roda em `npm test`, via tests/mapas.test.ts)
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const ler = (p) => JSON.parse(readFileSync(join(RAIZ, p), 'utf8'));
const MAPAS = readdirSync(join(RAIZ, 'content/maps')).filter((f) => f.startsWith('prologo_') && f.endsWith('.json')).map((f) => f.replace('.json', ''));
const DIALOGOS = new Map(readdirSync(join(RAIZ, 'content/dialogues')).filter((f) => f.endsWith('.json')).map((f) => [f.replace('.json', ''), ler(`content/dialogues/${f}`)]));

/** Marcador de entrada de cada mapa (de onde o jogador começa/chega). */
export const ENTRADAS = {
  prologo_casa_icaro: ['marcador_casa_cama', 'marcador_casa_terreiro'],
  prologo_vila_manha: ['marcador_vila_manha_porta_icaro'],
  prologo_casa_custodia: ['marcador_custodia_entrada'],
  prologo_padaria: ['marcador_padaria_entrada'],
  prologo_biblioteca: ['marcador_biblioteca_entrada'],
  prologo_cafezal: ['marcador_cafezal_inicio'],
  prologo_estrada: ['marcador_estrada_inicio'],
  prologo_vila: ['marcador_vila_entrada'],
  prologo_tunel: ['marcador_tunel_inicio'],
  prologo_bambuzal: ['marcador_bambuzal_entrada'],
};

/** Movimentos que atravessam sólidos de propósito (ex.: o pai empurra Ícaro). Formato mapa:roteiro:ator. */
const ISENTOS = new Set([]);
const props = (o) => Object.fromEntries((o.properties ?? []).map((p) => [p.name, p.value]));
const tipo = (o, camada) => ((o.type || o.class || '') || (camada === 'markers' ? 'marcador' : '')).toLowerCase();

export function carregar(id) {
  const m = ler(`content/maps/${id}.json`);
  const colide = new Set();
  m.tilesets.forEach((ts) => {
    for (const t of ts.tiles ?? []) if ((t.properties ?? []).some((p) => (p.name === 'collides' || p.name === 'colisao') && p.value)) colide.add(ts.firstgid + t.id);
  });
  const bloq = new Uint8Array(m.width * m.height);
  for (const l of m.layers) if (l.type === 'tilelayer') l.data.forEach((g, i) => { if (g && colide.has(g)) bloq[i] = 1; });
  const objs = m.layers.filter((l) => l.type === 'objectgroup').flatMap((l) => l.objects.map((o) => ({ o, t: tipo(o, l.name), p: props(o) })));
  const marcadores = new Map(objs.filter((x) => x.t === 'marcador').map((x) => [x.o.name, { tx: Math.floor(x.o.x / 16), ty: Math.floor((x.o.y - 1) / 16) }]));
  return { id, m, bloq, objs, marcadores };
}

/** Todas as células alcançáveis a partir de (tx,ty), andando em 4 direções por tiles livres. */
function alcancaveis(M, tx, ty) {
  const { width: W, height: H } = M.m;
  const vis = new Uint8Array(W * H);
  const fila = [[tx, ty]];
  vis[ty * W + tx] = 1;
  while (fila.length) {
    const [x, y] = fila.shift();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H || vis[ny * W + nx] || M.bloq[ny * W + nx]) continue;
      vis[ny * W + nx] = 1;
      fila.push([nx, ny]);
    }
  }
  return vis;
}

function rectTiles(o, folga = 0) {
  const w = o.width || 0, h = o.height || 0;
  const x0 = Math.floor(o.x / 16) - folga, y0 = Math.floor((o.point ? o.y - 1 : o.y) / 16) - folga;
  const x1 = o.point ? x0 + 2 * folga : Math.ceil((o.x + w) / 16) - 1 + folga;
  const y1 = o.point ? y0 + 2 * folga : Math.ceil((o.y + h) / 16) - 1 + folga;
  return { x0, y0, x1, y1 };
}

const alvoId = (t) => (typeof t === 'string' ? t : null);

/** Primeiro tile sólido ao longo do segmento (amostra a cada 3 px; ignora os últimos 5 px: o destino pode ser um móvel). */
function primeiroSolido(M, a, b) {
  const d = Math.hypot(b.x - a.x, b.y - a.y);
  for (let t = 0; t <= Math.max(0, d - 5); t += 3) {
    const x = a.x + ((b.x - a.x) * t) / (d || 1), y = a.y + ((b.y - a.y) * t) / (d || 1) - 2;
    const tx = Math.floor(x / 16), ty = Math.floor(y / 16);
    if (tx < 0 || ty < 0 || tx >= M.m.width || ty >= M.m.height) return { tx, ty };
    if (M.bloq[ty * M.m.width + tx]) return { tx, ty };
  }
  return null;
}

/** Percorre os passos (inclusive aninhados) chamando f(passo). Segue `call`. */
function percorrer(steps, f, vistos = new Set()) {
  for (const s of steps ?? []) {
    f(s);
    if (s.type === 'choice') for (const op of s.options ?? []) percorrer(op.steps, f, vistos);
    if (s.type === 'if') { percorrer(s.then, f, vistos); if (Array.isArray(s.else)) percorrer(s.else, f, vistos); }
    if (s.type === 'call' && DIALOGOS.has(s.id) && !vistos.has(s.id)) { vistos.add(s.id); percorrer(DIALOGOS.get(s.id).steps, f, vistos); }
  }
}

export function validar() {
  const erros = [];
  const avisos = [];
  const mapas = new Map(MAPAS.map((id) => [id, carregar(id)]));

  for (const M of mapas.values()) {
    const ctx = (o) => `${M.id}: "${o.o.name}"`;
    const nomes = new Set();
    for (const x of M.objs) {
      if (x.o.name && x.t !== 'rota' && ['marcador', 'npc', 'inimigo', 'examinar', 'gatilho', 'saida', 'esconderijo', 'checkpoint'].includes(x.t)) {
        const k = `${x.t === 'marcador' ? 'm' : 'o'}:${x.o.name}`;
        if (nomes.has(k)) erros.push(`${ctx(x)} duplicado`);
        nomes.add(k);
      }
      const dentro = x.o.x >= 0 && x.o.y >= 0 && x.o.x <= M.m.width * 16 && x.o.y <= M.m.height * 16 + 1;
      if (!dentro) erros.push(`${ctx(x)} fora do mapa`);
      // diálogos citados existem
      for (const k of ['dialogue', 'alt_dialogue', 'locked_dialogue']) if (x.p[k]) for (const d of String(x.p[k]).split(',')) if (!DIALOGOS.has(d.trim())) erros.push(`${ctx(x)}: diálogo "${d}" não existe`);
      // portas
      if (x.t === 'saida') {
        if (x.p.map && !mapas.has(x.p.map)) erros.push(`${ctx(x)}: destino "${x.p.map}" não existe`);
        const dest = mapas.get(x.p.map);
        if (x.p.entry && dest && !dest.marcadores.has(x.p.entry)) erros.push(`${ctx(x)}: marcador "${x.p.entry}" não existe em ${x.p.map}`);
        if (!x.p.map && !x.p.return) erros.push(`${ctx(x)}: saída sem destino`);
        if (x.p.return && !x.p.map) erros.push(`${ctx(x)}: return sem map/entry de reserva`);
      }
      // esconderijo / checkpoint: retângulo
      if ((x.t === 'esconderijo' || x.t === 'checkpoint') && !(x.o.width > 0 && x.o.height > 0)) erros.push(`${ctx(x)}: precisa ser retângulo`);
      // rotas dos inimigos (por marcadores <rota>_pN)
      if (x.t === 'inimigo') {
        const r = x.p.route;
        if (r) {
          const pts = [...M.marcadores.keys()].filter((n) => n.startsWith(`${r}_p`));
          if (pts.length < 2) erros.push(`${ctx(x)}: rota "${r}" precisa de ≥ 2 marcadores`);
        } else if (!x.p.turn) erros.push(`${ctx(x)}: inimigo sem rota nem "turn"`);
      }
    }
  }

  // ---- roteiros × mapas (marcadores, atores, saídas de cena)
  for (const M of mapas.values()) {
    const fontes = M.objs.filter((x) => ['npc', 'gatilho', 'examinar', 'saida'].includes(x.t));
    for (const x of fontes) {
      for (const k of ['dialogue', 'alt_dialogue', 'locked_dialogue']) {
        if (!x.p[k]) continue;
        let mapa = M;
        const atores = new Set(['icaro', 'player', 'jogador', 'self', ...M.objs.filter((y) => y.t === 'npc' || y.t === 'inimigo').map((y) => y.o.name)]);
        for (const d of String(x.p[k]).split(',').map((s) => s.trim())) {
          if (!DIALOGOS.has(d)) continue;
          const alvo = (t, quem) => {
            const n = alvoId(t);
            if (n && !mapa.marcadores.has(n) && !atores.has(n)) erros.push(`${M.id} → ${d}: ${quem} "${n}" não existe em ${mapa.id}`);
          };
          // posições conhecidas para checar os `move` em linha reta (o motor anda em linha reta, sem desviar de nada)
          const px = (t) => (Array.isArray(t) ? { x: t[0] * 16 + 8, y: t[1] * 16 + 15 } : mapa.marcadores.has(t) ? { x: mapa.marcadores.get(t).tx * 16 + 8, y: mapa.marcadores.get(t).ty * 16 + 15 } : null);
          const posicoes = new Map();
          for (const y of mapa.objs) if ((y.t === 'npc' || y.t === 'inimigo') && y.o.name) posicoes.set(y.o.name, { x: y.o.x, y: y.o.y });
          {
            const ent = ENTRADAS[mapa.id]?.[0];
            const mk = ent && mapa.marcadores.get(ent);
            const centro = x.t === 'npc' ? { x: x.o.x, y: x.o.y + 16 } : x.o.width ? { x: x.o.x + x.o.width / 2, y: x.o.y + x.o.height - 1 } : { x: x.o.x, y: x.o.y };
            posicoes.set('icaro', x.t === 'gatilho' && x.p.activation === 'load' && mk ? { x: mk.tx * 16 + 8, y: mk.ty * 16 + 15 } : centro);
            // diálogo de NPC/examinável: Ícaro está em algum tile livre ao lado; a primeira etapa vale se existir ao menos um lado livre
            if (x.t === 'npc' || x.t === 'examinar') {
              const r = rectTiles(x.o, 0);
              const lados = [];
              for (let ty = r.y0 - 1; ty <= r.y1 + 1; ty++) for (let tx = r.x0 - 1; tx <= r.x1 + 1; tx++) {
                const dentro = tx >= r.x0 && tx <= r.x1 && ty >= r.y0 && ty <= r.y1;
                if (dentro || (tx !== r.x0 - 1 && tx !== r.x1 + 1 && ty !== r.y0 - 1 && ty !== r.y1 + 1)) continue;
                if (tx < 0 || ty < 0 || tx >= mapa.m.width || ty >= mapa.m.height || mapa.bloq[ty * mapa.m.width + tx]) continue;
                lados.push({ x: tx * 16 + 8, y: ty * 16 + 15 });
              }
              if (lados.length) posicoes.set('icaro', { lados });
            }
          }
          percorrer(DIALOGOS.get(d).steps, (s) => {
            if (s.type === 'spawn') { alvo(s.at, 'marcador'); atores.add(s.actor); const q = px(s.at); if (q) posicoes.set(s.actor, q); return; }
            if (s.type === 'move' && s.actor) {
              let de = posicoes.get(s.actor);
              const para = px(s.to);
              if (de && de.lados && para) de = de.lados.find((l) => !primeiroSolido(mapa, l, para)) ?? de.lados[0]; // melhor lado
              if (de && de.lados) de = null;
              if (de && para) {
                const hit = primeiroSolido(mapa, de, para);
                if (hit && !(ISENTOS.has(`${mapa.id}:${d}:${s.actor}`))) erros.push(`${mapa.id} → ${d}: ${s.actor} atravessa tile sólido (${hit.tx},${hit.ty}) andando em linha reta até "${s.to}"; acrescente um marcador intermediário ou mude a posição`);
              }
              if (para) posicoes.set(s.actor, para);
            }
            if (s.type === 'scene' && s.map) { posicoes.clear(); }
            if (['move', 'face', 'emote', 'anim', 'despawn'].includes(s.type) && s.actor && !atores.has(s.actor) && !['caixa_costura', 'barril_custodia'].includes(s.actor)) erros.push(`${M.id} → ${d}: ator "${s.actor}" não existe em ${mapa.id}`);
            if (s.type === 'move') alvo(s.to, 'marcador');
            if (s.type === 'camera') alvo(s.to, 'marcador');
            if (s.type === 'scene' && s.map) {
              const dest = mapas.get(s.map);
              if (!dest) { erros.push(`${M.id} → ${d}: mapa "${s.map}" não existe`); return; }
              const ponto = s.spawn ?? s.at;
              if (ponto && !dest.marcadores.has(ponto)) erros.push(`${M.id} → ${d}: spawn "${ponto}" não existe em ${s.map}`);
              mapa = dest;
              atores.clear();
              ['icaro', 'player', 'jogador', 'self', ...dest.objs.filter((y) => y.t === 'npc' || y.t === 'inimigo').map((y) => y.o.name)].forEach((a) => atores.add(a));
            }
          });
        }
      }
    }
  }

  // ---- caminhos (BFS)
  const infoCaminho = [];
  for (const M of mapas.values()) {
    const entradas = ENTRADAS[M.id];
    if (!entradas) { erros.push(`${M.id}: sem entrada definida em ENTRADAS`); continue; }
    const vis = [];
    for (const e of entradas) {
      const mk = M.marcadores.get(e);
      if (!mk) { erros.push(`${M.id}: marcador de entrada "${e}" não existe`); continue; }
      if (M.bloq[mk.ty * M.m.width + mk.tx]) erros.push(`${M.id}: entrada "${e}" está sobre tile sólido`);
      vis.push(alcancaveis(M, mk.tx, mk.ty));
    }
    const W = M.m.width;
    const ok = (x, y) => vis.some((v) => x >= 0 && y >= 0 && x < W && y < M.m.height && v[y * W + x]);
    for (const x of M.objs) {
      if (!['saida', 'gatilho', 'checkpoint', 'examinar', 'npc', 'esconderijo', 'porta_trancada'].includes(x.t)) continue;
      if (x.t === 'gatilho' && x.p.activation === 'load') continue;
      // portas/gatilhos/checkpoints: pisar; npc/examinar: ficar ao lado (folga 1)
      const folga = x.t === 'npc' || x.t === 'examinar' ? 1 : 0;
      const r = rectTiles(x.o, folga);
      let alcanca = false;
      for (let y = r.y0; y <= r.y1 && !alcanca; y++) for (let xx = r.x0; xx <= r.x1; xx++) if (ok(xx, y) && (folga || !M.bloq[y * W + xx])) { alcanca = true; break; }
      if (!alcanca) erros.push(`${M.id}: "${x.o.name}" (${x.t}) inalcançável a partir da entrada`);
    }
    infoCaminho.push(M.id);
  }
  return { erros, avisos, mapas: MAPAS };
}

if (process.argv[1] && process.argv[1].endsWith('validar.mjs')) {
  const { erros, avisos, mapas } = validar();
  avisos.forEach((a) => console.warn('aviso:', a));
  if (erros.length) { console.error(erros.map((e) => ` - ${e}`).join('\n')); console.error(`\n${erros.length} problema(s) em ${mapas.length} mapas`); process.exit(1); }
  console.log(`ok: ${mapas.length} mapas validados`);
}
