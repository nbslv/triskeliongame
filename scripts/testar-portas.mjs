/**
 * Portas: entra e sai da padaria, da casa da Custódia, da biblioteca e da casa de Ícaro, 3 vezes cada,
 * andando com o teclado. Falha se a troca de mapa entrar em laço (porta que manda de volta sozinha)
 * ou se o jogador surgir dentro de uma zona de porta.
 *
 * Uso: npm run build && npx vite preview --port 4173 & node scripts/testar-portas.mjs [url]
 */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const URL = process.argv[2] ?? 'http://localhost:4173/';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

let ok = true;
const check = (cond, msg) => {
  console.log(`${cond ? '✔' : '✘'} ${msg}`);
  if (!cond) ok = false;
};
const wait = (ms) => page.waitForTimeout(ms);
const state = () => page.evaluate(() => window.__TRISKELION__.scene.getScene('Mundo')?.debugState?.());
const world = (fn, arg) => page.evaluate(([f, a]) => new Function('w', 'a', f)(window.__TRISKELION__.scene.getScene('Mundo'), a), [fn, arg]);

/** Avança qualquer cutscene em andamento (Enter) até o jogador ficar livre. */
async function livre(maxMs = 30000) {
  const end = Date.now() + maxMs;
  while (Date.now() < end) {
    const s = await state();
    if (s && !s.cutscene && s.ready !== false) return true;
    await page.keyboard.press('Enter');
    await wait(120);
  }
  return false;
}

/** Segura a seta até o mapa mudar (ou estourar o tempo). Devolve o mapa novo ou null. */
async function andarAteTrocar(tecla, de, maxMs = 6000) {
  await page.keyboard.down(tecla);
  const end = Date.now() + maxMs;
  let novo = null;
  while (Date.now() < end) {
    const s = await state();
    if (s?.map && s.map !== de) {
      novo = s.map;
      break;
    }
    await wait(50);
  }
  await page.keyboard.up(tecla);
  return novo;
}

await page.goto(URL);
await wait(1500);
await page.evaluate(() => localStorage.clear());
await page.evaluate(() => window.__TRISKELION__.scene.getScene('Titulo').startNewGame());
await wait(1500);
await livre(60000);

// Conta as trocas de mapa (para achar laços).
await page.evaluate(() => {
  window.__trocas = [];
  window.__TRISKELION__.events.on('step', () => {});
  const w = () => window.__TRISKELION__.scene.getScene('Mundo');
  let last = null;
  setInterval(() => {
    const m = w()?.mapId;
    if (m && m !== last) window.__trocas.push({ m, t: performance.now() });
    last = m;
  }, 16);
});
// Portas da vila liberadas (a da casa de Ícaro só abre depois do café com o pai).
await page.evaluate(() => {
  const f = window.__TRISKELION_FLAGS__;
  f.set('prologo.cafe_com_pai', true);
});

const portas = [
  { nome: 'padaria', saida: 'saida_padaria', interior: 'prologo_padaria' },
  { nome: 'casa da Custódia', saida: 'saida_custodia', interior: 'prologo_casa_custodia' },
  { nome: 'biblioteca', saida: 'saida_biblioteca', interior: 'prologo_biblioteca' },
  { nome: 'casa de Ícaro', saida: 'saida_icaro', interior: 'prologo_casa_icaro' },
];

for (const porta of portas) {
  for (let vez = 1; vez <= 3; vez++) {
    const tag = `${porta.nome} (${vez}/3)`;
    // Na vila, dois tiles abaixo da porta, olhando para ela.
    await world('w.changeMap("prologo_vila_manha", { x: 0, y: 0 })');
    await wait(900);
    await livre();
    const pos = await world(
      `const z = w.exits.find((e) => e.obj.name === a); const x = z.rect.x + z.rect.w / 2, y = z.rect.y + z.rect.h + 2 * 16;
       w.player.sprite.setPosition(x, y); w.player.body.reset(x, y); w.player.face('up');
       for (const e of [...w.exits, ...w.triggers]) e.inside = false; return { x, y };`,
      porta.saida,
    );
    await wait(200);
    await page.evaluate(() => (window.__trocas = []));
    const dentro = await andarAteTrocar('ArrowUp', 'prologo_vila_manha');
    check(dentro === porta.interior, `${tag}: entrou (${dentro})`);
    await wait(900);
    await livre();
    const s1 = await state();
    check(s1?.map === porta.interior, `${tag}: continua dentro depois de entrar (${s1?.map})`);
    const naPorta = await world('const x = w.player.x, y = w.player.y - 3; return w.exits.filter((e) => x >= e.rect.x && x < e.rect.x + e.rect.w && y >= e.rect.y && y < e.rect.y + e.rect.h).map((e) => e.obj.name);');
    check(naPorta.length === 0, `${tag}: chegou fora de qualquer zona de porta (${naPorta.join(',') || 'ok'})`);
    // Sai: anda para baixo até a vila.
    const fora = await andarAteTrocar('ArrowDown', porta.interior, 8000);
    check(fora === 'prologo_vila_manha', `${tag}: saiu para a vila (${fora})`);
    await wait(1500);
    const s2 = await state();
    const trocas = await page.evaluate(() => window.__trocas.map((t) => t.m));
    check(s2?.map === 'prologo_vila_manha' && trocas.length <= 2, `${tag}: sem laço na saída (trocas: ${trocas.join(' → ')})`);
    void pos;
  }
}
// Chegada forçada DENTRO da zona da porta (e na borda dela): o motor desloca para fora e não entra.
for (const [nome, dy] of [['no meio', 8], ['na borda', 15.5]]) {
  const alvo = await world('const z = w.exits.find((e) => e.obj.name === "saida_padaria") ?? null; return z ? { x: z.rect.x + z.rect.w / 2, y: z.rect.y + a + 3 } : null;', dy);
  if (!alvo) {
    await world('w.changeMap("prologo_vila_manha", { x: 0, y: 0 })');
    await wait(900);
  }
  const vila = await world('const z = w.exits.find((e) => e.obj.name === "saida_padaria"); return { x: z.rect.x + z.rect.w / 2, y: z.rect.y + a + 3 };', dy);
  await world('w.changeMap("prologo_padaria", "marcador_padaria_balcao")');
  await wait(900);
  await page.evaluate(() => (window.__trocas = []));
  await world('w.changeMap("prologo_vila_manha", a, "down")', vila);
  await wait(1500);
  const s = await state();
  const trocas = await page.evaluate(() => window.__trocas.map((t) => t.m));
  const naPorta = await world('const x = w.player.x, y = w.player.y - 3; return w.exits.some((e) => x >= e.rect.x && x < e.rect.x + e.rect.w && y >= e.rect.y && y < e.rect.y + e.rect.h);');
  check(s.map === 'prologo_vila_manha' && !naPorta && trocas.length <= 1, `chegada ${nome} da porta: deslocada para fora, sem laço (${trocas.join(' → ')})`);
}
check(errors.length === 0, `sem erros no console${errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''}`);

await browser.close();
console.log(ok ? '\nTUDO OK' : '\nFALHOU');
process.exit(ok ? 0 : 1);
