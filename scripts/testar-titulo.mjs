// Teste do menu do título: cada item TOCADO executa a própria ação.
// Modos: toque, clique e toque dentro de iframe; com e sem save de retomada.
// Uso: npm run build && npx vite preview --port 4173 &   node scripts/testar-titulo.mjs [url]   (SENHA=... se houver)
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const URL = process.argv[2] ?? 'http://localhost:4173/';
const SENHA = process.env.SENHA ?? '';

let ok = true;
const check = (c, msg) => { console.log(`${c ? '✔' : '✘'} ${msg}`); if (!c) ok = false; };
const browser = await chromium.launch();

const SAVE = (map) => {
  const pos = { map, x: 104, y: 351, facing: 'down' };
  return JSON.stringify({ version: 3, savedAt: Date.now(), playtimeMs: 60000, position: pos, checkpoint: pos, flags: {}, state: { difficulty: 'tranquila', coins: 0, inventory: {}, attributes: {} } });
};

/** Abre o jogo no modo pedido com os saves dados e devolve helpers. */
async function abrir(modo, saves) {
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: modo !== 'clique', isMobile: modo !== 'clique' });
  const page = await ctx.newPage();
  if (modo === 'iframe') await page.setContent(`<iframe id="j" src="${URL}" style="position:absolute;left:12px;top:14px;width:820px;height:366px;border:0"></iframe>`);
  else await page.goto(URL);
  await page.waitForTimeout(2200);
  let f = modo === 'iframe' ? page.frames()[1] : page.mainFrame();
  if (SENHA && (await f.$('.senha-form'))) { await f.fill('.senha-form input', SENHA); await f.click('.senha-form button'); await page.waitForTimeout(800); }
  await f.evaluate((s) => {
    for (const k of Object.keys(localStorage)) if (k.startsWith('triskelion.save')) localStorage.removeItem(k);
    for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v);
    location.reload();
  }, saves).catch(() => {});
  await page.waitForTimeout(1500);
  f = modo === 'iframe' ? page.frames()[1] : page.mainFrame();
  for (let i = 0; i < 40; i++) {
    const pronto = await f.evaluate(() => !!window.__TRISKELION__?.scene.getScene('Titulo')?.menu && window.__TRISKELION__.scene.isActive('Titulo')).catch(() => false);
    if (pronto) break;
    await page.waitForTimeout(200);
  }
  await page.waitForTimeout(400);
  const toPage = async (gx, gy) => {
    const ib = modo === 'iframe' ? await page.locator('#j').boundingBox() : { x: 0, y: 0 };
    const cb = await f.evaluate(() => { const b = document.querySelector('#game canvas').getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height }; });
    return { x: ib.x + cb.x + (gx / 640) * cb.w, y: ib.y + cb.y + (gy / 360) * cb.h };
  };
  const tocar = async (gx, gy) => { const p = await toPage(gx, gy); if (modo === 'clique') await page.mouse.click(p.x, p.y); else await page.touchscreen.tap(p.x, p.y); };
  const itens = (cena) => f.evaluate((c) => window.__TRISKELION__.scene.getScene(c).menu.texts.map((t) => ({ text: t.text, x: t.x, y: t.y, w: t.width, h: t.height })), cena);
  const tocarItem = async (cena, texto) => {
    const it = (await itens(cena)).find((i) => i.text === texto);
    if (!it) throw new Error(`item "${texto}" não está em ${cena}`);
    await tocar(it.x + Math.min(40, it.w / 2), it.y + it.h / 2);
  };
  const cenas = () => f.evaluate(() => window.__TRISKELION__.scene.getScenes(true).map((s) => s.scene.key));
  const mapa = () => f.evaluate(() => { const w = window.__TRISKELION__.scene.getScene('Mundo'); return w.sys.isActive() ? w.mapId : null; });
  return { ctx, page, f, itens, tocarItem, cenas, mapa, fechar: () => ctx.close() };
}

const comRetomada = { 'triskelion.save.retomada': SAVE('prologo_cafezal'), 'triskelion.save.1': SAVE('prologo_vila_manha') };
const semRetomada = { 'triskelion.save.1': SAVE('prologo_vila_manha') };
const esperado = {
  'Retomar de onde parou': async (g) => (await g.mapa()) === 'prologo_cafezal',
  'Novo jogo': async (g) => (await g.cenas()).includes('Confirmar'),
  Continuar: async (g) => (await g.cenas()).includes('Espacos'),
  'Opções': async (g) => (await g.cenas()).includes('Opcoes'),
  'Backup do save': async (g) => (await g.cenas()).includes('Backup'),
};

for (const modo of ['toque', 'clique', 'iframe']) {
  for (const [nome, saves] of [['com retomada', comRetomada], ['sem retomada', semRetomada]]) {
    const g0 = await abrir(modo, saves);
    const labels = (await g0.itens('Titulo')).map((i) => i.text);
    await g0.fechar();
    for (const label of labels) {
      const g = await abrir(modo, saves);
      await g.tocarItem('Titulo', label);
      await g.page.waitForTimeout(1300);
      check(await esperado[label](g), `${modo}, ${nome}: tocar "${label}" executa a ação certa (${(await g.cenas()).join(',')})`);
      if (label === 'Novo jogo') {
        // confirmação: "Começar do zero" leva ao início do jogo, sem apagar o espaço 1
        await g.tocarItem('Confirmar', 'Começar do zero');
        await g.page.waitForTimeout(1500);
        const m = await g.mapa();
        const slot1 = await g.f.evaluate(() => localStorage.getItem('triskelion.save.1') !== null);
        const ret = await g.f.evaluate(() => localStorage.getItem('triskelion.save.retomada'));
        check(m === 'prologo_casa_icaro' && slot1, `${modo}, ${nome}: confirmar começa do zero (${m}) e mantém o espaço 1`);
        check(!ret || !JSON.parse(ret).position || JSON.parse(ret).position.map !== 'prologo_cafezal', `${modo}, ${nome}: a retomada antiga não fica no título`);
      }
      await g.fechar();
    }
  }
}
// sem nenhum save: Novo jogo vai direto
{
  const g = await abrir('toque', {});
  await g.tocarItem('Titulo', 'Novo jogo');
  await g.page.waitForTimeout(1500);
  check((await g.mapa()) === 'prologo_casa_icaro', 'sem saves: Novo jogo começa direto, sem confirmação');
  await g.fechar();
}
// confirmação: "Voltar" retorna ao título
{
  const g = await abrir('toque', semRetomada);
  await g.tocarItem('Titulo', 'Novo jogo');
  await g.page.waitForTimeout(800);
  await g.tocarItem('Confirmar', 'Voltar');
  await g.page.waitForTimeout(600);
  const c = await g.cenas();
  check(c.includes('Titulo') && !c.includes('Confirmar') && !(await g.mapa()), 'confirmação: Voltar fica no título');
  await g.fechar();
}
await browser.close();
console.log(ok ? '\nTUDO OK' : '\nFALHAS ACIMA');
process.exit(ok ? 0 : 1);
