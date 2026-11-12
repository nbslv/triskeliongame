// Teste de fumaça no Chromium (Playwright) em viewport de celular horizontal com toque.
// Uso:
//   VITE_GAME_PASSWORD=teste123 npm run build && npx vite preview --port 4173 &
//   SENHA=teste123 node scripts/testar-navegador.mjs [url] [pasta_capturas]
// Verifica: senha, título, joystick (toque), diálogo com NPC, cutscene de teste, furtividade.
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const URL = process.argv[2] ?? 'http://localhost:4173/';
const OUT = process.argv[3] ?? 'docs/tecnico/capturas';
const SENHA = process.env.SENHA ?? '';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});
const cdp = await ctx.newCDPSession(page);

let ok = true;
const check = (cond, msg) => {
  console.log(`${cond ? '✔' : '✘'} ${msg}`);
  if (!cond) ok = false;
};
const wait = (ms) => page.waitForTimeout(ms);
const state = () => page.evaluate(() => window.__TRISKELION__.scene.getScene('Mundo').debugState?.());
const activeScenes = () => page.evaluate(() => window.__TRISKELION__.scene.getScenes(true).map((s) => s.scene.key));

/** Coordenada lógica (640×360) → pixels da página. */
async function toPage(gx, gy) {
  const r = await page.evaluate(() => {
    const b = document.querySelector('#game canvas').getBoundingClientRect();
    return { x: b.left, y: b.top, w: b.width, h: b.height };
  });
  return { x: r.x + (gx / 640) * r.w, y: r.y + (gy / 360) * r.h };
}

async function touch(type, points) {
  await cdp.send('Input.dispatchTouchEvent', { type, touchPoints: points });
}
async function tap(gx, gy, id = 9) {
  const p = await toPage(gx, gy);
  await touch('touchStart', [{ x: p.x, y: p.y, id }]);
  await wait(60);
  await touch('touchEnd', []);
  await wait(60);
}
const tapA = () => tap(640 - 52, 360 - 82);

let joy = null;
async function joystick(dx, dy) {
  const base = await toPage(110, 270);
  if (!joy) {
    await touch('touchStart', [{ x: base.x, y: base.y, id: 1 }]);
    joy = base;
    await wait(30);
  }
  const k = await toPage(110 + dx * 30, 270 + dy * 30);
  await touch('touchMove', [{ x: k.x, y: k.y, id: 1 }]);
}
async function joystickRelease() {
  if (joy) await touch('touchEnd', []);
  joy = null;
}

/** Anda até (x,y) em pixels do mapa, primeiro no eixo X, depois Y, pelo joystick. */
async function walkTo(tx, ty, timeout = 15000) {
  const t0 = Date.now();
  for (const axis of ['x', 'y']) {
    while (Date.now() - t0 < timeout) {
      const s = await state();
      if (s.cutscene || s.caught) {
        await joystickRelease();
        return s;
      }
      const d = (axis === 'x' ? tx : ty) - s.player[axis];
      if (Math.abs(d) < 3) break;
      await joystick(axis === 'x' ? Math.sign(d) : 0, axis === 'y' ? Math.sign(d) : 0);
      await wait(Math.min(200, Math.abs(d) * 8));
    }
    await joystickRelease();
    await wait(80);
  }
  return state();
}

async function advanceDialogue(maxTaps = 60) {
  for (let i = 0; i < maxTaps; i++) {
    const s = await state();
    if (!s.cutscene) return true;
    await tap(320, 200);
    await wait(250);
  }
  return !(await state()).cutscene;
}

// ---------------------------------------------------------------- roteiro
await page.goto(URL);
await wait(1500);
if (SENHA && (await page.$('.senha-form'))) {
  await page.fill('.senha-form input', 'errada');
  await page.click('.senha-form button');
  await wait(200);
  check((await activeScenes()).includes('Senha'), 'senha errada é recusada');
  await page.fill('.senha-form input', SENHA);
  await page.click('.senha-form button');
  await wait(1000);
}
check((await activeScenes()).includes('Titulo'), 'chegou ao título');
await page.screenshot({ path: `${OUT}/01-titulo.png` });

// Novo jogo (toque direto no item)
await page.evaluate(() => localStorage.removeItem('triskelion.save.auto'));
await tap(300, 214);
await wait(1500);
let s = await state();
check(s && s.map === 'teste', 'novo jogo abriu o mapa de teste');

// Joystick
const x0 = s.player.x;
await joystick(1, 0);
await wait(700);
s = await state();
await joystickRelease();
check(s.player.x > x0 + 20, `joystick move o jogador (x ${x0} → ${s.player.x})`);

// Multitoque: segura o joystick e toca B (correr) ao mesmo tempo
{
  const before = (await state()).player.x;
  const base = await toPage(110, 270);
  const k = await toPage(80, 270);
  const b = await toPage(640 - 108, 360 - 44);
  await touch('touchStart', [{ x: base.x, y: base.y, id: 1 }]);
  await touch('touchMove', [{ x: k.x, y: k.y, id: 1 }]);
  await touch('touchStart', [{ x: k.x, y: k.y, id: 1 }, { x: b.x, y: b.y, id: 2 }]);
  await wait(400);
  await touch('touchEnd', []);
  await wait(100);
  const after = (await state()).player.x;
  check(before - after > 40, `multitoque joystick + B (correr): andou ${before - after}px em 0,4s`);
}

// NPC: aldeão em (200, 159); fica abaixo dele olhando para cima
await walkTo(200, 180);
await joystick(0, -1);
await wait(80);
await joystickRelease();
await tapA();
await wait(900);
s = await state();
check(s.cutscene, 'A perto do NPC inicia diálogo');
await page.screenshot({ path: `${OUT}/02-dialogo-npc.png` });
check(await advanceDialogue(), 'diálogo do NPC termina com toques');

// Gatilho da cutscene de teste em x=288..304, y=208..272
s = await walkTo(296, 238);
check(s.cutscene, 'gatilho inicia a cutscene de teste');
let sawTeste2 = false;
let shot = false;
for (let i = 0; i < 120; i++) {
  s = await state();
  if (!s.cutscene) break;
  if (s.map === 'teste2') sawTeste2 = true;
  if (!shot && s.actors.includes('visitante')) {
    await wait(1200);
    await page.screenshot({ path: `${OUT}/03-cutscene.png` });
    shot = true;
  }
  // A (botão na tela) avança falas e confirma a 1ª opção das escolhas
  await tapA();
  await wait(300);
}
check(!s.cutscene, 'cutscene de teste terminou');
check(sawTeste2, 'cutscene trocou de mapa (teste2) e voltou');
check(s.map === 'teste', 'de volta ao mapa de teste');
const flags = await page.evaluate(() => JSON.parse(localStorage.getItem('triskelion.save.auto') ?? '{}').flags ?? {});
check(flags['teste.visto_antes'] === true, 'flag do roteiro gravada no autosave');

// Furtividade: entra no checkpoint (x=368..384) e depois atravessa a área do guarda sem se esconder
s = await walkTo(376, 238);
const cp = s.player;
await wait(300);
await page.screenshot({ path: `${OUT}/04-furtividade.png` });
// Esconderijo: entra no arbusto (tile 29,13) e espera o guarda passar
s = await walkTo(472, 238, 8000);
s = await walkTo(472, 220, 4000);
let hiddenOk = s.hidden && !s.caught;
for (let i = 0; i < 16 && hiddenOk; i++) {
  await wait(500);
  s = await state();
  hiddenOk = s.hidden && !s.caught;
}
check(hiddenOk, `arbusto esconde o jogador por 8s (hidden=${s.hidden}, caught=${s.caught})`);
if (s.caught) await wait(2500);

// Visto: fica parado no caminho, na coluna da patrulha
s = await walkTo(cp.x, 238, 6000);
s = await walkTo(500, 238, 8000);
let caught = s.caught;
for (let i = 0; i < 40 && !caught; i++) {
  await wait(250);
  caught = (await state()).caught;
}
check(caught, 'inimigo vê o jogador fora do esconderijo');
if (caught) {
  await wait(150);
  await page.screenshot({ path: `${OUT}/05-visto.png` });
  await wait(2000);
  s = await state();
  check(!s.caught && Math.abs(s.player.x - cp.x) < 20, `volta ao checkpoint (${s.player.x},${s.player.y})`);
}

// Menu de pausa pelo botão MENU
await joystickRelease();
await wait(2500);
await tap(640 - 30, 26);
await wait(400);
check((await activeScenes()).includes('Menu'), 'botão MENU abre a pausa');
await page.screenshot({ path: `${OUT}/06-menu.png` });

check(errors.length === 0, `sem erros no console${errors.length ? ': ' + errors.join(' | ') : ''}`);
await browser.close();
console.log(ok ? '\nTUDO OK' : '\nFALHAS ACIMA');
process.exit(ok ? 0 : 1);
