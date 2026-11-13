// Joga o Prólogo inteiro no Chromium (844×390, toque/teclado) com um "robô" que anda por BFS nos tiles.
// Uso:
//   npm run build && npx vite preview --port 4173 &
//   node scripts/jogar-prologo.mjs [url] [pasta_capturas]
// Variáveis: SENHA (se houver tela de senha), SEM_FURTIVIDADE=1 (desliga os cones, só para testar o resto).
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync } from 'node:fs';

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
  m.layers.filter((l) => l.type === 'tilelayer').forEach((l) => l.data.forEach((g, i) => { if (col.has(g)) bloq[i] = 1; }));
  const objs = m.layers.filter((l) => l.type === 'objectgroup').flatMap((l) => l.objects.map((o) => ({ ...o, camada: l.name, p: Object.fromEntries((o.properties ?? []).map((q) => [q.name, q.value])) })));
  const r = { m, bloq, objs, W: m.width, H: m.height };
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
  for (;;) {
    const p = await pos();
    if (p.s.cutscene || p.s.caught || p.s.map !== currentMap) { if (process.env.DEPURAR) console.log('  [int]', p.s.cutscene, p.s.caught, p.s.map, currentMap); return 'interrompido'; }
    const dx = cx - p.x, dy = cy - p.y;
    if (Math.abs(dx) <= 2.5 && Math.abs(dy) <= 5) return 'ok';
    if (Math.abs(dx) > 40 || Math.abs(dy) > 40) { await wait(700); const q = await pos(); if (Math.abs(cx - q.x) > 40 || Math.abs(cy - q.y) > 40) { if (process.env.DEPURAR) console.log('  [salto]', cx, cy, q.x, q.y); return 'interrompido'; } continue; } // teleporte (porta/zona)
    if (parar(p)) return 'parou';
    if (guarda++ > 120) return 'preso';
    const horiz = Math.abs(dx) > 2.5 && (Math.abs(dx) >= Math.abs(dy) || Math.abs(dy) <= 5);
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
  return andarPara(id, alvos);
}

// ---------------------------------------------------------------- início
await page.goto(URL);
await wait(1500);
if (SENHA && (await page.$('.senha-form'))) { await page.fill('.senha-form input', SENHA); await page.click('.senha-form button'); await wait(1000); }
await page.evaluate(() => { for (const k of Object.keys(localStorage)) if (k.startsWith('triskelion.save')) localStorage.removeItem(k); });
await page.reload();
await wait(1500);
if (SENHA && (await page.$('.senha-form'))) { await page.fill('.senha-form input', SENHA); await page.click('.senha-form button'); await wait(1000); }
// "Novo jogo": primeiro item do título
await page.keyboard.press('Enter');
await wait(1500);
const wallStart = Date.now();

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
  currentMap = 'prologo_vila';
  const id = 'prologo_vila';
  const hides = mapa(id).objs.filter((o) => o.type === 'esconderijo');
  const tilesHide = (o) => {
    const r = [];
    for (let y = Math.floor(o.y / 16); y < Math.ceil((o.y + o.height) / 16); y++) for (let x = Math.floor(o.x / 16); x < Math.ceil((o.x + o.width) / 16); x++) r.push({ x, y });
    return r;
  };
  if (SEM_FURT) {
    const z = obj(id, 'gatilho_casa');
    const alvos = [];
    for (let x = Math.floor(z.x / 16); x < Math.ceil((z.x + z.width) / 16); x++) alvos.push({ x, y: Math.floor(z.y / 16) });
    for (let k = 0; k < 4; k++) { const r = await andarPara(id, alvos, { correr: true }); if (r === 'interrompido') { const q = await state(); if (q.cutscene) { await avancar(); } } if ((await state()).cutscene || (await state()).map !== id) break; }
    return 'direto (sem cones)';
  }
  const rota = [
    'esconderijo_carroca_1', 'esconderijo_sacas_1', 'esconderijo_barril_1', 'esconderijo_praca',
    'esconderijo_carroca_praca', 'esconderijo_sacas_praca', 'checkpoint_beco',
    'esconderijo_barril_custodia', 'esconderijo_sacas_c1', 'esconderijo_carroca_c', 'esconderijo_sacas_c2', 'esconderijo_barril_c', 'gatilho_casa',
  ];
  let capturas = 0;
  const veMais = (s, x, y, margem) => s.enemies.some((e) => {
    const dx = x - e.x, dy = y - e.y - 0;
    const d = Math.hypot(dx, dy);
    const range = { cali_a1: 64, cali_b1: 56, cali_b2: 56, toucim_posto: 64, cali_c1: 64, cali_c2: 64 }[e.id] ?? 64;
    if (d > range + margem) return false;
    const ang = Math.atan2(dy, dx);
    const fa = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 }[e.facing];
    let diff = Math.abs(((ang - fa + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
    diff = Math.PI - diff;
    return d < 24 + margem / 2 || diff < (30 * Math.PI) / 180 + 0.5;
  });
  for (const nome of rota) {
    const o = obj(id, nome);
    const alvos = nome.startsWith('esconderijo') || o.type === 'esconderijo' ? tilesHide(o) : [tileDe({ ...o, point: false })];
    if (o.type === 'gatilho') { alvos.length = 0; for (let x = Math.floor(o.x / 16); x < Math.ceil((o.x + o.width) / 16); x++) alvos.push({ x, y: Math.floor(o.y / 16) }); }
    if (o.type === 'checkpoint') { alvos.length = 0; for (let x = Math.floor(o.x / 16); x < Math.ceil((o.x + o.width) / 16); x++) alvos.push({ x, y: Math.floor(o.y / 16) }); }
    for (let tent = 0; tent < 25; tent++) {
      const p = await pos();
      if (p.s.map !== id) return 'saiu-do-mapa';
      if (p.s.cutscene) { await avancar(); continue; }
      const path = bfs(id, { x: p.tx, y: p.ty }, alvos);
      if (!path) return `sem caminho até ${nome}`;
      if (!path.length) break;
      // espera uma janela segura: nenhum ponto do trecho perto de um cone
      let pronto = false;
      for (let w = 0; w < 120 && !pronto; w++) {
        const s = await state();
        if (s.hidden === false && s.caught) break;
        const perigo = path.slice(0, 9).some((t) => veMais(s, t.x * 16 + 8, t.y * 16 + 8, 34)) && !SEM_FURT;
        if (!perigo) pronto = true; else await wait(120);
      }
      for (const t of path) {
        const r = await irParaTile(t, { correr: true });
        if (r === 'interrompido') break;
        if (r !== 'ok') break;
      }
      const q = await pos();
      if (q.s.caught || q.s.cutscene) { capturas++; await wait(1200); await avancar(10); }
    }
  }
  return `${capturas} captura(s)`;
}
