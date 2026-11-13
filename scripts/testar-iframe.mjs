// Regressão do prólogo DENTRO DE UM IFRAME (como na página de artefato do claude.ai), só com toque,
// áudio bloqueado (AudioContext nunca retoma) e troca de visibilidade da aba no meio da cutscene.
// Vai do início do jogo até o cafezal e a colheita completa.
// Uso:
//   npm run build && npx vite preview --port 4173 &
//   node scripts/testar-iframe.mjs [url] [pasta_capturas]      (SENHA=... se houver tela de senha)
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const URL = process.argv[2] ?? 'http://localhost:4173/';
const OUT = process.argv[3] ?? 'docs/tecnico/capturas';
const SENHA = process.env.SENHA ?? '';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ args: ['--autoplay-policy=user-gesture-required'] });
const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
// Áudio bloqueado: o contexto de áudio nunca sai de "suspended".
await ctx.addInitScript(() => {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (AC) AC.prototype.resume = function () { return new Promise(() => {}); };
});
const page = await ctx.newPage();
const errors = [];
const limites = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
  if (/passou do limite|terminou com a tela escura/.test(m.text())) limites.push(m.text());
});

let ok = true;
const check = (c, msg) => { console.log(`${c ? '✔' : '✘'} ${msg}`); if (!c) ok = false; };
const wait = (ms) => page.waitForTimeout(ms);

await page.setContent(`<!doctype html><body style="margin:0;background:#222"><iframe id="jogo" src="${URL}" style="position:absolute;left:10px;top:10px;width:824px;height:370px;border:0" allow="fullscreen; autoplay"></iframe></body>`);
await wait(2500);
let f = page.frames().find((x) => x !== page.mainFrame());
const refreshFrame = () => { f = page.frames().find((x) => x !== page.mainFrame()); };

const W = (fn, arg) => f.evaluate(([src, a]) => new Function('w', 'g', 'a', src)(window.__TRISKELION__.scene.getScene('Mundo'), window.__TRISKELION__, a), [fn, arg]);
const state = () => f.evaluate(() => {
  const w = window.__TRISKELION__.scene.getScene('Mundo');
  return { ...(w.sys.isActive() ? w.debugState() : {}), fade: window.__TRISKELION_DIRECTOR__.fadeState.alpha, rect: w.fadeRect?.fillAlpha ?? 0 };
});
const flag = (k) => f.evaluate((key) => window.__TRISKELION_FLAGS__.get(key) ?? null, k);
async function toPage(gx, gy) {
  const ib = await page.locator('#jogo').boundingBox();
  const cb = await f.evaluate(() => { const b = document.querySelector('#game canvas').getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height }; });
  return { x: ib.x + cb.x + (gx / 640) * cb.w, y: ib.y + cb.y + (gy / 360) * cb.h };
}
const tap = async (gx, gy) => { const p = await toPage(gx, gy); await page.touchscreen.tap(p.x, p.y); await wait(80); };
const tapA = () => tap(640 - 52, 360 - 82);
const teleport = (x, y, facing) => W('w.player.sprite.setPosition(a.x, a.y); w.player.body.reset(a.x, a.y); w.player.face(a.facing);', { x, y, facing });

/** Avança falas por toque (e toca na 1ª opção das escolhas) até ficar sem cutscene por ~1 s. */
async function advance(max = 200) {
  let calm = 0;
  for (let i = 0; i < max; i++) {
    const s = await state().catch(() => null);
    if (s && s.map && !s.cutscene) { if (++calm >= 5) return true; await wait(200); continue; }
    calm = 0;
    const opt = await f.evaluate(() => { const d = window.__TRISKELION__.scene.getScene('Dialogo'); const t = d.menu?.texts?.[0]; return t ? { x: t.x + t.width / 2, y: t.y + 10 } : null; });
    if (opt) await tap(opt.x, opt.y);
    else await tap(400, 180);
    await wait(250);
  }
  return false;
}

const objOf = (map, name) => {
  const m = JSON.parse(readFileSync(`content/maps/${map}.json`, 'utf8'));
  for (const l of m.layers) if (l.type === 'objectgroup') for (const o of l.objects) if (o.name === name) return o;
  return null;
};

// ---------------------------------------------------------------- início
if (SENHA && (await f.$('.senha-form'))) {
  await f.fill('.senha-form input', SENHA);
  await f.click('.senha-form button');
  await wait(1200);
}
await f.evaluate(() => { for (const k of Object.keys(localStorage)) if (k.startsWith('triskelion.save')) localStorage.removeItem(k); location.reload(); }).catch(() => {});
await wait(2500);
refreshFrame();
check(await f.evaluate(() => window.top !== window.self), 'jogo roda dentro de um iframe');
check(await f.evaluate(() => window.__TRISKELION__.sound.context?.state !== 'running'), 'áudio bloqueado (AudioContext suspenso)');
const t0 = Date.now();
await tap(300, 214); // Novo jogo
await wait(1800);
check((await state()).map === 'prologo_casa_icaro', 'novo jogo começa na casa de Ícaro');
check(await advance(), 'abertura termina só com toques');

// Café com o pai
const pai = objOf('prologo_casa_icaro', 'pai');
await teleport(pai.x, pai.y + 18, 'up');
await wait(150);
await tapA();
await wait(400);
await advance();
check((await flag('prologo.cafe_com_pai')) === true, 'café com o pai (toque no A)');

// Porta da frente → vila de manhã
const porta = objOf('prologo_casa_icaro', 'saida_porta_frente');
await teleport(porta.x + 8, porta.y + 14, 'down');
await wait(1500);
check((await state()).map === 'prologo_vila_manha', 'saiu para a vila de manhã');

// Portão → "Ir para o cafezal"
const portao = objOf('prologo_vila_manha', 'gatilho_portao_vila');
await teleport(portao.x - 20, portao.y + 30, 'right');
await wait(200);
await teleport(portao.x + 16, portao.y + 30, 'right');
await wait(500);
check((await state()).cutscene, 'portão abre a escolha de ir ao cafezal');
// avança até a troca de mapa e a abertura do cafezal começar
let viuAbertura = false;
let trocouVisibilidade = false;
for (let i = 0; i < 160; i++) {
  const s = await state();
  if (s.map === 'prologo_cafezal' && s.cutscene) {
    viuAbertura = true;
    if (!trocouVisibilidade) {
      // aba oculta e de volta no meio da cutscene (sem recarregar)
      trocouVisibilidade = true;
      await f.evaluate(() => {
        const set = (v) => Object.defineProperty(document, 'visibilityState', { value: v, configurable: true });
        set('hidden'); document.dispatchEvent(new Event('visibilitychange')); window.dispatchEvent(new Event('pagehide'));
        set('visible'); document.dispatchEvent(new Event('visibilitychange'));
      });
    }
  }
  if (s.map === 'prologo_cafezal' && !s.cutscene && viuAbertura) break;
  const opt = await f.evaluate(() => { const d = window.__TRISKELION__.scene.getScene('Dialogo'); const t = d.menu?.texts?.[0]; return t ? { x: t.x + t.width / 2, y: t.y + 10 } : null; });
  if (opt) await tap(opt.x, opt.y); else await tap(400, 180);
  await wait(300);
}
await advance();
let s = await state();
check(s.map === 'prologo_cafezal', 'chegou ao cafezal');
check(viuAbertura, 'abertura do cafezal (prologo_01) dispara ao chegar pela cutscene');
check((await flag('prologo.abertura_vista')) === true, 'abertura do cafezal terminou (flag prologo.abertura_vista)');
check(!s.cutscene && s.fade === 0 && s.rect === 0, `sem cutscene presa e tela clara (fade=${s.fade}, rect=${s.rect})`);
await page.screenshot({ path: `${OUT}/11-iframe-cafezal.png` });

// Tonho
const tonho = objOf('prologo_cafezal', 'tonho');
await teleport(tonho.x - 14, tonho.y, 'right');
await wait(150);
await tapA();
await wait(400);
await advance();
check((await flag('prologo.colheita_iniciada')) === true, 'conversa com o Tonho (tutorial da colheita)');

// Colheita: 5 pés
for (let i = 1; i <= 5; i++) {
  const pe = objOf('prologo_cafezal', `pe_cafe_maduro_${i}`);
  await teleport(pe.x + 8, pe.y + pe.height + 12, 'up');
  await wait(150);
  await tapA();
  await wait(300);
  await advance();
}
check((await flag('prologo.colheita')) === 5 && (await flag('prologo.colheita_completa')) === true, 'colheita completa (5 pés) só com toque');
s = await state();
check(!s.cutscene && s.fade === 0, 'jogo livre depois da colheita');
check(limites.length === 0, `nenhum passo precisou do limite de tempo${limites.length ? ': ' + limites.join(' | ') : ''}`);
check(errors.length === 0, `sem erros no console${errors.length ? ': ' + errors.join(' | ') : ''}`);
console.log(`(tempo: ${((Date.now() - t0) / 1000).toFixed(0)} s)`);
await browser.close();
console.log(ok ? '\nTUDO OK' : '\nFALHAS ACIMA');
process.exit(ok ? 0 : 1);
