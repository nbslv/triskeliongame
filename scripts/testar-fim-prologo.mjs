/**
 * Conclui o prólogo (bambuzal → prologo_16 → Título) e confere que o save automático
 * tem a flag `prologo.concluido`, gravada pelo passo `autosave` dentro da cutscene e
 * pela troca para o Título.
 *
 * Uso: npm run build && npx vite preview --port 4173 & node scripts/testar-fim-prologo.mjs [url]
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
const active = () => page.evaluate(() => window.__TRISKELION__.scene.getScenes(true).map((s) => s.scene.key));
const state = () => page.evaluate(() => window.__TRISKELION__.scene.getScene('Mundo')?.debugState?.());
const autoSave = () => page.evaluate(() => JSON.parse(localStorage.getItem('triskelion.save.auto') ?? 'null'));

/** Aperta A até a condição valer (ou estourar o tempo). */
async function pressUntil(cond, maxMs) {
  const end = Date.now() + maxMs;
  while (Date.now() < end) {
    if (await cond()) return true;
    await page.keyboard.press('Enter');
    await wait(120);
  }
  return cond();
}

await page.goto(URL);
await wait(1500);
await page.evaluate(() => localStorage.clear());
await page.evaluate(() => window.__TRISKELION__.scene.getScene('Titulo').startNewGame());
await wait(1500);
check(!!(await state())?.map, 'novo jogo abriu o mundo');
await pressUntil(async () => !(await state())?.cutscene, 60000);

await page.evaluate(() => window.__TRISKELION__.scene.getScene('Mundo').changeMap('prologo_bambuzal'));
await wait(1500);
check((await state())?.map === 'prologo_bambuzal', 'chegou ao bambuzal');

const before = (await autoSave())?.flags?.['prologo.concluido'];
check(!before, 'antes do fim, o save não tem prologo.concluido');

const reachedTitle = await pressUntil(async () => {
  const a = await active();
  return a.includes('Titulo') && !a.includes('Mundo');
}, 120000);
check(reachedTitle, 'prologo_16 termina no Título');
const save = await autoSave();
check(save?.flags?.['prologo.concluido'] === true, `save automático tem prologo.concluido (${JSON.stringify(save?.flags?.['prologo.concluido'])})`);
check(save && !save.resumeDialogue, `save do fim não recomeça cutscene (resumeDialogue=${save?.resumeDialogue})`);
check(save?.position?.map === 'prologo_bambuzal', `posição do save é segura, no bambuzal (${save?.position?.map})`);
check(errors.length === 0, `sem erros no console${errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''}`);

await browser.close();
console.log(ok ? '\nTUDO OK' : '\nFALHOU');
process.exit(ok ? 0 : 1);
