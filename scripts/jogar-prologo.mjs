// Joga o Prólogo inteiro no Chromium (844×390, toque/teclado) com um "robô" que anda por BFS nos tiles.
// Uso:
//   npm run build && npx vite preview --port 4173 &
//   node scripts/jogar-prologo.mjs [url] [pasta_capturas]
// Variáveis: SENHA (se houver tela de senha), SEM_FURTIVIDADE=1 (desliga os cones, só para testar o resto).
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync } from 'node:fs';

import { criarSimulador } from '../tools/mapas/simulador.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const URL = process.argv[2] ?? 'http://localhost:4173/';
const OUT = process.argv[3] ?? 'docs/mapas/capturas';
const SENHA = process.env.SENHA ?? '';
const SEM_FURT = process.env.SEM_FURTIVIDADE === '1';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const CPU = Number(process.env.CPU ?? 1);
if (CPU > 1) { const c = await ctx.newCDPSession(page); await c.send('Emulation.setCPUThrottlingRate', { rate: CPU }); console.log(`CPU ${CPU}x mais lenta (CDP)`); }
const erros = [];
page.on('pageerror', (e) => erros.push(e.message));
page.on('console', (m) => {
  if (m.type() === 'error' || (m.type() === 'warning' && /\[(mundo|cutscene)\]/.test(m.text()))) erros.push(m.text());
});
const wait = (ms) => page.waitForTimeout(ms);
let falhas = 0;
const check = (c, msg) => { console.log(`${c ? '✔' : '✘'} ${msg}`); if (!c) falhas++; };
const t0 = Date.now();
const log = (m) => console.log(`[${((Date.now() - t0) / 1000).toFixed(0)}s] ${m}`);

const state = () => page.evaluate(() => window.__TRISKELION__.scene.getScene('Mundo').debugState());
const world = (fn, arg) => page.evaluate(([f, a]) => new Function('w', 'a', f)(window.__TRISKELION__.scene.getScene('Mundo'), a), [fn, arg]);
const flag = (n) => page.evaluate((k) => {
  window.dispatchEvent(new Event('pagehide'));
  const g = (c) => JSON.parse(localStorage.getItem(c) ?? 'null')?.flags?.[k];
  return g('triskelion.save.retomada') ?? g('triskelion.save.auto') ?? null;
}, n);
const shot = (nome) => page.screenshot({ path: `${OUT}/${nome}.png` });

// ---------------------------------------------------------------- mapas (para o BFS)
const cacheMapa = new Map();
function mapa(id) {
  if (cacheMapa.has(id)) return cacheMapa.get(id);
  const m = JSON.parse(readFileSync(`content/maps/${id}.json`, 'utf8'));
  const col = new Set();
  const hide = new Set();
  m.tilesets.forEach((ts) => (ts.tiles ?? []).forEach((t) => (t.properties ?? []).forEach((p) => {
    if (p.name === 'collides' && p.value) col.add(ts.firstgid + t.id);
    if (p.name === 'hide' && p.value) hide.add(ts.firstgid + t.id);
  })));
  const bloq = new Uint8Array(m.width * m.height);
  const ocultos = new Uint8Array(m.width * m.height);
  m.layers.filter((l) => l.type === 'tilelayer').forEach((l) => l.data.forEach((g, i) => { if (col.has(g)) bloq[i] = 1; if (hide.has(g)) ocultos[i] = 1; }));
  const objs = m.layers.filter((l) => l.type === 'objectgroup').flatMap((l) => l.objects.map((o) => ({ ...o, camada: l.name, p: Object.fromEntries((o.properties ?? []).map((q) => [q.name, q.value])) })));
  const r = { m, bloq, ocultos, objs, W: m.width, H: m.height };
  cacheMapa.set(id, r);
  return r;
}
const obj = (id, nome) => mapa(id).objs.find((o) => o.name === nome);
const tileDe = (o) => ({ x: Math.floor(o.x / 16), y: Math.floor((o.point ? o.y - 1 : o.y) / 16) });

// ---------------------------------------------------------------- entrada: teclado
const press = async (k, ms) => { await page.keyboard.down(k); await wait(ms); await page.keyboard.up(k); };
const SETAS = { '1,0': 'ArrowRight', '-1,0': 'ArrowLeft', '0,1': 'ArrowDown', '0,-1': 'ArrowUp' };
const tapA = () => page.keyboard.press('Enter');

async function avancar(max = 120) {
  // avança falas até o jogo ficar "calmo" (sem roteiro por ~1,2 s): cenas longas têm pausas entre os passos
  let calmo = 0;
  for (let i = 0; i < max * 4; i++) {
    const s = await state().catch(() => null);
    if (s && !s.cutscene) { if (++calmo >= 5) return true; } else { calmo = 0; await page.mouse.click(422, 200); await page.keyboard.press('Enter'); }
    await wait(200);
  }
  return false;
}

/** BFS de (x,y) ao conjunto de alvos; npcs e `evitar` são bloqueados. */
function bfs(id, de, alvos, bloqueios = new Set()) {
  const { bloq, W, H } = mapa(id);
  const dist = new Map([[`${de.x},${de.y}`, null]]);
  const fila = [de];
  const alvoSet = new Set(alvos.map((a) => `${a.x},${a.y}`));
  while (fila.length) {
    const c = fila.shift();
    if (alvoSet.has(`${c.x},${c.y}`)) {
      const path = [];
      let k = `${c.x},${c.y}`;
      while (dist.get(k)) { const [x, y] = k.split(',').map(Number); path.unshift({ x, y }); k = dist.get(k); }
      return path;
    }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const x = c.x + dx, y = c.y + dy;
      const k = `${x},${y}`;
      if (x < 0 || y < 0 || x >= W || y >= H || dist.has(k) || bloq[y * W + x] || bloqueios.has(k)) continue;
      dist.set(k, `${c.x},${c.y}`);
      fila.push({ x, y });
    }
  }
  return null;
}

const pos = async () => { const s = await state(); return { ...s.player, tx: Math.floor(s.player.x / 16), ty: Math.floor((s.player.y - 1) / 16), s }; };

async function irParaTile(t, { correr = false, parar = () => false } = {}) {
  const cx = t.x * 16 + 8, cy = t.y * 16 + 12;
  let guarda = 0;
  let travado = 0;
  let ult = null;
  for (;;) {
    const p = await pos();
    if (ult && Math.hypot(p.x - ult.x, p.y - ult.y) < 0.8) travado++; else travado = 0;
    ult = { x: p.x, y: p.y };
    if (p.s.cutscene || p.s.caught || p.s.map !== currentMap) { if (process.env.DEPURAR) console.log('  [int]', p.s.cutscene, p.s.caught, p.s.map, currentMap); return 'interrompido'; }
    const dx = cx - p.x, dy = cy - p.y;
    if (Math.abs(dx) <= 2.5 && Math.abs(dy) <= 5) return 'ok';
    if (Math.abs(dx) > 40 || Math.abs(dy) > 40) { await wait(700); const q = await pos(); if (Math.abs(cx - q.x) > 40 || Math.abs(cy - q.y) > 40) { if (process.env.DEPURAR) console.log('  [salto]', cx, cy, q.x, q.y); return 'interrompido'; } continue; } // teleporte (porta/zona)
    if (parar(p)) return 'parou';
    if (guarda++ > 120) { if (process.env.DEPURAR) console.log('  [preso]', t, p.x, p.y); return 'preso'; }
    let horiz = Math.abs(dx) > 2.5 && (Math.abs(dx) >= Math.abs(dy) || Math.abs(dy) <= 5);
    if (travado > 0 && Math.abs(dx) > 2.5 && Math.abs(dy) > 1) horiz = travado % 2 === 0; // encostou em quina: alterna o eixo
    else if (travado > 0 && Math.abs(dy) > 1 && Math.abs(dx) <= 2.5) horiz = false;
    const k = horiz ? SETAS[`${Math.sign(dx)},0`] : SETAS[`0,${Math.sign(dy)}`];
    if (correr) await page.keyboard.down('x');
    await press(k, Math.max(40, Math.min(260, (horiz ? Math.abs(dx) : Math.abs(dy)) * (correr ? 7 : 11))));
    if (correr) await page.keyboard.up('x');
  }
}
let currentMap = '';

async function andarPara(id, alvos, opts = {}) {
  currentMap = id;
  const npcs = new Set(mapa(id).objs.filter((o) => o.type === 'npc').map((o) => { const t = tileDe(o); return `${t.x},${t.y}`; }));
  for (let tentativa = 0; tentativa < 6; tentativa++) {
    const p = await pos();
    if (p.s.map !== id) return 'mapa';
    const path = bfs(id, { x: p.tx, y: p.ty }, alvos, npcs);
    if (!path) return 'sem-caminho';
    if (process.env.DEPURAR) console.log('  [path]', id, p.tx, p.ty, '->', JSON.stringify(alvos.slice(0,3)), JSON.stringify(path.slice(0,6)), path.length);
    if (!path.length) return 'ok';
    for (const t of path) {
      const r = await irParaTile(t, opts);
      if (r !== 'ok') { if (r === 'interrompido' || r === 'parou') return r; break; }
    }
    const q = await pos();
    if (alvos.some((a) => a.x === q.tx && a.y === q.ty)) return 'ok';
  }
  return 'falhou';
}

/** Chega ao lado de um objeto (rect/ponto), vira para ele e aperta A. */
async function interagir(id, nome) {
  const o = obj(id, nome);
  const r = o.point ? { x0: tileDe(o).x, y0: tileDe(o).y, x1: tileDe(o).x, y1: tileDe(o).y } : { x0: Math.floor(o.x / 16), y0: Math.floor(o.y / 16), x1: Math.ceil((o.x + o.width) / 16) - 1, y1: Math.ceil((o.y + o.height) / 16) - 1 };
  const { bloq, W } = mapa(id);
  const cand = [];
  for (let y = r.y0 - 1; y <= r.y1 + 1; y++) for (let x = r.x0 - 1; x <= r.x1 + 1; x++) {
    const dentro = x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1;
    const adj = (x >= r.x0 && x <= r.x1) !== (y >= r.y0 && y <= r.y1) || dentro;
    if (!adj || bloq[y * W + x]) continue;
    if (dentro && o.type !== 'examinar') continue;
    if (dentro && bloq[y * W + x]) continue;
    cand.push({ x, y, dentro });
  }
  const res = await andarPara(id, cand.filter((c) => !c.dentro).concat(cand.filter((c) => c.dentro)));
  if (res !== 'ok') return res;
  const p = await pos();
  const ex = (r.x0 + r.x1) / 2, ey = (r.y0 + r.y1) / 2;
  const dx = ex - p.tx, dy = ey - p.ty;
  const k = Math.abs(dx) > Math.abs(dy) ? SETAS[`${Math.sign(dx)},0`] : SETAS[`0,${Math.sign(dy) || 1}`];
  await press(k, 90); // vira (a parede/NPC impede de andar)
  await wait(120);
  await tapA();
  await wait(300);
  return 'ok';
}

async function entrarNaZona(id, nome) {
  const o = obj(id, nome);
  const r = { x0: Math.floor(o.x / 16), y0: Math.floor(o.y / 16), x1: Math.ceil((o.x + o.width) / 16) - 1, y1: Math.ceil((o.y + o.height) / 16) - 1 };
  const alvos = [];
  for (let y = r.y0; y <= r.y1; y++) for (let x = r.x0; x <= r.x1; x++) alvos.push({ x, y });
  const antes = await pos();
  let res = await andarPara(id, alvos);
  // saídas (portas): espera a troca de mapa/posição terminar, tentando de novo uma vez se não aconteceu
  if (o.type === 'saida') {
    const destino = o.p.map ?? antes.s.map;
    for (let tentativa = 0; tentativa < 2; tentativa++) {
      for (let i = 0; i < 40; i++) {
        const q = await pos().catch(() => null);
        if (q && (q.s.map !== antes.s.map || Math.hypot(q.x - antes.x, q.y - antes.y) > 40)) { await wait(700); currentMap = destino; return res; }
        await wait(150);
      }
      res = await andarPara(id, alvos);
    }
  }
  return res;
}

// ---------------------------------------------------------------- início
const cenasAtivas = () => page.evaluate(() => window.__TRISKELION__?.scene.getScenes(true).map((c) => c.scene.key) ?? []).catch(() => []);
async function esperarCena(nome, ms = 120000) {
  const t = Date.now();
  while (Date.now() - t < ms) { if ((await cenasAtivas()).includes(nome)) return true; await wait(200); }
  return false;
}
async function passarSenha() {
  if (SENHA && (await page.$('.senha-form'))) { await page.fill('.senha-form input', SENHA); await page.click('.senha-form button'); }
}
await page.goto(URL);
await wait(1000);
await passarSenha();
await page.evaluate(() => { for (const k of Object.keys(localStorage)) if (k.startsWith('triskelion.save')) localStorage.removeItem(k); });
await page.reload();
await wait(1000);
await passarSenha();
// "Novo jogo": primeiro item do título (espera o título de verdade, sem tempo fixo: vale para máquinas lentas)
await esperarCena('Titulo');
await wait(800);
await page.keyboard.press('Enter');
await esperarCena('Mundo');
for (let i = 0; i < 300; i++) { const s0 = await state().catch(() => null); if (s0?.map === 'prologo_casa_icaro') break; await wait(200); }
await wait(800);
const wallStart = Date.now();

const START = process.env.START ?? '';
if (START === 'vila') {
  await avancar();
  await world("w.changeMap('prologo_vila', 'marcador_vila_entrada')");
  await wait(2500);
} else {
// ---- Cena 0: casa de Ícaro
currentMap = 'prologo_casa_icaro';
check((await state()).map === 'prologo_casa_icaro', 'começa na casa de Ícaro');
await avancar();
await wait(500);
await shot('01-casa-icaro');
// porta trancada antes do café
{
  const r = await entrarNaZona('prologo_casa_icaro', 'saida_porta_frente');
  await wait(600);
  const s = await state();
  check(s.map === 'prologo_casa_icaro', `porta da frente trancada antes do café (${r})`);
  await avancar();
}
log('café com o pai');
check((await interagir('prologo_casa_icaro', 'pai')) === 'ok', 'chegou ao pai');
await avancar();
check((await flag('prologo.cafe_com_pai')) === true, 'flag cafe_com_pai');
// examina o retrato (opcional) e o fogão
await interagir('prologo_casa_icaro', 'exame_casa_retrato'); await avancar();
await interagir('prologo_casa_icaro', 'exame_casa_alcapao').catch(() => {});
// terreiro: atravessa a porta dos fundos e volta
{
  const r = await entrarNaZona('prologo_casa_icaro', 'saida_porta_fundos');
  await wait(900);
  currentMap = 'prologo_casa_icaro';
  const s = await state();
  check(s.player.y < 8 * 16, `porta dos fundos leva ao terreiro (${r})`);
  await shot('02-terreiro');
  await interagir('prologo_casa_icaro', 'exame_casa_alcapao'); await avancar();
  log('terreiro: ' + JSON.stringify((await state()).player) + ' ' + await entrarNaZona('prologo_casa_icaro', 'saida_terreiro_para_casa'));
  await wait(900);
  log('após terreiro: ' + JSON.stringify((await state()).player));
}
// sai pela porta da frente
log('porta frente: ' + await entrarNaZona('prologo_casa_icaro', 'saida_porta_frente'));
await wait(1200);
log('estado: ' + JSON.stringify(await state()));
check((await state()).map === 'prologo_vila_manha', 'saiu para a vila de manhã');
await shot('03-vila-manha');

// visita rápida às três casas (porta e volta)
for (const [casa, sala] of [['saida_padaria', 'prologo_padaria'], ['saida_custodia', 'prologo_casa_custodia'], ['saida_biblioteca', 'prologo_biblioteca']]) {
  const r = await entrarNaZona('prologo_vila_manha', casa);
  await wait(1200);
  const s = await state();
  check(s.map === sala, `entrou em ${sala} (${r})`);
  if (s.map === sala) {
    await shot(`04-${sala.replace('prologo_', '')}`);
    currentMap = sala;
    await entrarNaZona(sala, 'saida_porta');
    await wait(1200);
    check((await state()).map === 'prologo_vila_manha', `voltou da ${sala}`);
  }
}
// portão da vila → cafezal
log('portão');
await entrarNaZona('prologo_vila_manha', 'gatilho_portao_vila');
await wait(600);
await avancar(); // primeira opção: ir para o cafezal
await wait(1500);
check((await state()).map === 'prologo_cafezal', 'foi para o cafezal');

// ---- Cena 1: cafezal
currentMap = 'prologo_cafezal';
await avancar();
await shot('05-cafezal');
check((await flag('prologo.abertura_vista')) === true, 'cafezal: flag abertura_vista (cena de abertura rodou)');
await interagir('prologo_cafezal', 'tonho'); await avancar();
for (let i = 1; i <= 5; i++) {
  const r = await interagir('prologo_cafezal', `pe_cafe_maduro_${i}`);
  await avancar();
  if (r !== 'ok') console.log('  pé', i, r);
}
check((await flag('prologo.colheita_completa')) === true, 'colheita completa (5 pés)');
await interagir('prologo_cafezal', 'zefa');
await avancar();
await wait(1500);
check((await state()).map === 'prologo_estrada', 'cafezal → estrada (fumaça)');
log('estrada');

// ---- Cena 2: estrada
currentMap = 'prologo_estrada';
await avancar();
await shot('06-estrada');
await entrarNaZona('prologo_estrada', 'gatilho_estrada_fugitivos').catch(() => {});
await avancar();
check((await flag('prologo.tonho_separou')) === true, 'estrada: encontro com os fugitivos');
await entrarNaZona('prologo_estrada', 'saida_estrada_vila');
await wait(1500);
check((await state()).map === 'prologo_vila', 'estrada → vila em chamas');

}
// ---- Cena 3: vila em chamas (furtividade)
currentMap = 'prologo_vila';
await avancar();
await shot('07-vila-entrada');
if (SEM_FURT) await world('w.patrols.forEach((p) => { p.cfg.range = 0; }); w.onSpotted = () => {};');
const resVila = await furtividade();
log(`furtividade: ${resVila}`);
await shot('08-vila-casa');
await avancar(400);
await wait(2000);
await avancar(200);
await wait(1500);
check((await state()).map === 'prologo_tunel' || (await flag('prologo.pai_despedida')) === true, 'cena do pai → túnel');

// ---- Cena 5: túnel
currentMap = 'prologo_tunel';
await avancar();
await shot('09-tunel');
await interagir('prologo_tunel', 'exame_brinquedo'); await avancar();
await entrarNaZona('prologo_tunel', 'saida_tunel');
await wait(1500);
check((await state()).map === 'prologo_bambuzal', 'túnel → bambuzal');

// ---- Cena 6: bambuzal
currentMap = 'prologo_bambuzal';
await wait(1500);
await shot('10-bambuzal');
await avancar(300);
await wait(2000);
check((await flag('prologo.concluido')) === true, 'prólogo concluído');
await shot('11-fim');

const total = ((Date.now() - wallStart) / 1000).toFixed(0);
log(`tempo de robô: ${total}s`);
console.log(`erros de console: ${erros.length}`);
erros.slice(0, 15).forEach((e) => console.log('  -', e.slice(0, 200)));
await browser.close();
process.exit(falhas ? 1 : 0);

// ---------------------------------------------------------------- furtividade (3 trechos)
async function furtividade() {
  // Robô de furtividade com horizonte deslizante: a cada passo lê o ESTADO REAL das patrulhas (posição, direção,
  // alvo, pausas e relógio do jogo), simula as regras do motor (tools/mapas/simulador.mjs), procura um caminho
  // sem ser visto até o próximo esconderijo e dá só o primeiro passo. Esperas medidas no relógio do jogo,
  // não em milissegundos reais: por isso funciona igual em máquinas rápidas e lentas.
  currentMap = 'prologo_vila';
  const id = 'prologo_vila';
  const M = mapa(id);
  const zonaTiles = (nome) => { const o = obj(id, nome); const r = []; for (let y = Math.floor(o.y / 16); y < Math.ceil((o.y + o.height) / 16); y++) for (let x = Math.floor(o.x / 16); x < Math.ceil((o.x + o.width) / 16); x++) r.push([x, y]); return r; };
  if (SEM_FURT) {
    const alvos = zonaTiles('gatilho_casa').map(([x, y]) => ({ x, y })).filter((t) => t.y === zonaTiles('gatilho_casa')[0][1]);
    for (let k = 0; k < 4; k++) { const r = await andarPara(id, alvos, { correr: true }); if (r === 'interrompido') { const q = await state(); if (q.cutscene) { await avancar(); } } if ((await state()).cutscene || (await state()).map !== id) break; }
    return 'direto (sem cones)';
  }
  const hideRects = M.objs.filter((o) => o.type === 'esconderijo');
  const escondido = (tx, ty) => M.ocultos[ty * M.W + tx] === 1 || hideRects.some((o) => tx >= Math.floor(o.x / 16) && tx < Math.ceil((o.x + o.width) / 16) && ty >= Math.floor(o.y / 16) && ty < Math.ceil((o.y + o.height) / 16));
  const sim = criarSimulador({ W: M.W, H: M.H, bloq: M.bloq, escondido });
  const vivo = () => world(`const now = w.time.now; return { now, ps: w.patrols.map((p) => ({ x: p.actor.x, y: p.actor.y, facing: p.actor.facing, target: p.target, dir: p.dirSign,
      waitLeft: Math.max(0, (p.waitUntil - now) / 1000), turnLeft: Math.max(0, (p.nextTurn - now) / 1000),
      rota: p.cfg.route.map((r) => ({ x: r.x, y: r.y })), mode: p.cfg.mode, speed: p.cfg.speed, wait: p.cfg.waitMs / 1000,
      range: p.cfg.range, ang: p.cfg.angleDeg, turn: p.cfg.turnMs / 1000 })) };`);
  const pausa = (on) => world(on ? 'w.scene.pause()' : 'w.scene.resume()');
  const agora = () => world('return w.time.now');
  const esperarJogo = async (ms) => { const t0 = await agora(); for (let i = 0; i < 400; i++) { if ((await agora()) - t0 >= ms) return; await wait(10); } };
  let capturas = 0;
  let ultimoPos = null;
  let latencia = 0.08; // s de jogo entre ler o estado e agir (medido)
  let porPasso = 0.2; // s de jogo por tile andando (medido; começa conservador)
  const metas = [
    'esconderijo_carroca_1', 'esconderijo_sacas_1', 'esconderijo_barril_1', 'esconderijo_praca',
    'esconderijo_carroca_praca', 'esconderijo_sacas_praca', 'checkpoint_beco',
    'esconderijo_barril_custodia', 'esconderijo_sacas_c1', 'esconderijo_carroca_c', 'esconderijo_sacas_c2', 'gatilho_casa',
  ];
  for (const nome of metas) {
    const alvos = zonaTiles(nome);
    let sem = 0;
    let esperas = 0;
    for (let passos = 0; passos < 6000; passos++) {
      await pausa(true).catch(() => {}); // congela o jogo para ler o estado e planejar sem latência (vale em qualquer máquina)
      const s = await state();
      if (s.map !== id) { await pausa(false).catch(() => {}); return 'saiu-do-mapa'; }
      if (s.cutscene) { await pausa(false); await avancar(); continue; }
      if (s.caught) { await pausa(false); await wait(1500); await avancar(10); continue; }
      const p = await pos();
      if (ultimoPos && Math.hypot(p.x - ultimoPos.x, p.y - ultimoPos.y) > 80) { capturas++; log(`  furtividade: fui visto (${capturas}) — voltei ao checkpoint`); }
      ultimoPos = { x: p.x, y: p.y };
      if (alvos.some(([x, y]) => x === p.tx && y === p.ty)) { log(`  furtividade: ${nome} ok (${capturas} capturas, ${passos} passos)`); await pausa(false); break; }
      const v = await vivo();
      const xs = [p.tx, ...alvos.map((a) => a[0])], ys = [p.ty, ...alvos.map((a) => a[1])];
      const caixa = [Math.min(...xs) - 4, Math.min(...ys) - 4, Math.max(...xs) + 4, Math.max(...ys) + 4];
      const pt = Math.max(2, Math.ceil(porPasso / 0.0625));
      const t0 = Date.now();
      const atraso = 0; // jogo pausado durante a leitura: sem latência
      const acao = sim.planejar(v.ps, [p.tx, p.ty], alvos, { passoTicks: pt, horizonte: 14, rm: 10, am: 0.15, caixa, atraso }) ?? sim.planejar(v.ps, [p.tx, p.ty], alvos, { passoTicks: pt, horizonte: 14, rm: 6, am: 0.12, caixa, atraso }) ?? sim.planejar(v.ps, [p.tx, p.ty], alvos, { passoTicks: pt, horizonte: 14, rm: 0, am: 0, caixa, atraso });
      latencia = 0.7 * latencia + 0.3 * Math.max(0, ((await agora()) - v.now) / 1000);
      if (process.env.DEPURAR && passos % 20 === 0) log(`  plano ${Date.now() - t0} ms: ${JSON.stringify(acao)}`);
      if (!acao) { if (++sem % 50 === 1) log(`  sem plano seguro em (${p.tx},${p.ty}) rumo a ${nome}`); await pausa(false); await esperarJogo(125); continue; }
      if (acao.chegou) { await pausa(false); break; }
      if (acao.ficar) { esperas++; await pausa(false); await esperarJogo(60); continue; }
      await pausa(false);
      const prox = acao.mover;
      const ta = await agora();
      await irParaTile({ x: prox[0], y: prox[1] }, { correr: true });
      porPasso = 0.7 * porPasso + 0.3 * Math.max(0.125, ((await agora()) - ta) / 1000);
    }
  }
  await pausa(false).catch(() => {});
  return `${capturas} captura(s)`;
}
