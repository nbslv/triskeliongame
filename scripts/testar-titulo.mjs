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
// ---------------------------------------------------------------------------------------------
// Botões A/B da tela, joystick e teclado em todos os menus (título, confirmação, espaços, opções, pausa)
for (const via of ['toque', 'teclado']) {
  const g = await abrir(via === 'toque' ? 'toque' : 'clique', semRetomada);
  const cdp = via === 'toque' ? await g.ctx.newCDPSession(g.page) : null;
  const canvasBox = () => g.f.evaluate(() => { const b = document.querySelector('#game canvas').getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height }; });
  const pg = async (gx, gy) => { const b = await canvasBox(); return { x: b.x + (gx / 640) * b.w, y: b.y + (gy / 360) * b.h }; };
  const t = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts });
  const BOT = { A: [588, 278], B: [532, 316], MENU: [610, 26] };
  const TECLA = { A: 'Enter', B: 'KeyX', MENU: 'KeyM', cima: 'ArrowUp', baixo: 'ArrowDown', esq: 'ArrowLeft', dir: 'ArrowRight' };
  const segurar = async (key, ms = 90) => { await g.page.keyboard.down(key); await g.page.waitForTimeout(ms); await g.page.keyboard.up(key); await g.page.waitForTimeout(120); };
  const botao = async (b) => {
    if (via === 'teclado') return segurar(TECLA[b]);
    const p = await pg(...BOT[b]);
    await t('touchStart', [{ x: p.x, y: p.y, id: 5 }]); await g.page.waitForTimeout(70); await t('touchEnd', []); await g.page.waitForTimeout(150);
  };
  /** Um passo de navegação: joystick (arrasta e solta) ou seta. */
  const mover = async (dir) => {
    if (via === 'teclado') return segurar(TECLA[dir]);
    const d = { cima: [0, -1], baixo: [0, 1], esq: [-1, 0], dir: [1, 0] }[dir];
    const b = await pg(110, 250); const k = await pg(110 + d[0] * 32, 250 + d[1] * 32);
    await t('touchStart', [{ x: b.x, y: b.y, id: 2 }]); await g.page.waitForTimeout(40);
    await t('touchMove', [{ x: k.x, y: k.y, id: 2 }]); await g.page.waitForTimeout(150);
    await t('touchEnd', []); await g.page.waitForTimeout(120);
  };
  const idx = (c) => g.f.evaluate((c) => window.__TRISKELION__.scene.getScene(c).menu.index, c);
  const label = (c) => g.f.evaluate((c) => { const m = window.__TRISKELION__.scene.getScene(c).menu; return m.texts[m.index].text; }, c);
  const irPara = async (c, texto) => { for (let i = 0; i < 8 && (await label(c)) !== texto; i++) await mover('baixo'); return (await label(c)) === texto; };
  const ativa = async (c) => (await g.cenas()).includes(c);
  const V = `${via}:`;

  // Título: navegar e voltar
  const i0 = await idx('Titulo');
  await mover('baixo');
  const i1 = await idx('Titulo');
  check(i1 !== i0, `${V} título navega (${i0} → ${i1})`);
  await mover('cima');
  check((await idx('Titulo')) === i0, `${V} título volta para cima`);
  // Opções: A abre, navega, esquerda/direita ajusta, B volta
  check(await irPara('Titulo', 'Opções'), `${V} chega em "Opções"`);
  await botao('A'); await g.page.waitForTimeout(300);
  check(await ativa('Opcoes'), `${V} A abre Opções`);
  const o0 = await label('Opcoes');
  await mover('dir');
  const o1 = await label('Opcoes');
  check(o1 !== o0, `${V} Opções: direita ajusta o volume (${o0} → ${o1})`);
  await mover('esq');
  await mover('baixo');
  check((await idx('Opcoes')) === 1, `${V} Opções navega`);
  await botao('B'); await g.page.waitForTimeout(300);
  check(!(await ativa('Opcoes')) && (await ativa('Titulo')), `${V} B fecha Opções e volta ao título`);
  // Espaços (Continuar): A abre, B volta
  check(await irPara('Titulo', 'Continuar'), `${V} chega em "Continuar"`);
  await botao('A'); await g.page.waitForTimeout(300);
  check(await ativa('Espacos'), `${V} A abre os espaços`);
  await mover('baixo');
  check((await idx('Espacos')) !== undefined, `${V} espaços navegam`);
  await botao('B'); await g.page.waitForTimeout(300);
  check(!(await ativa('Espacos')) && (await ativa('Titulo')), `${V} B fecha os espaços`);
  // Confirmação: B = não; A em "Começar do zero" = sim
  check(await irPara('Titulo', 'Novo jogo'), `${V} chega em "Novo jogo"`);
  await botao('A'); await g.page.waitForTimeout(400);
  check(await ativa('Confirmar'), `${V} A em Novo jogo pede confirmação`);
  await botao('B'); await g.page.waitForTimeout(300);
  check(!(await ativa('Confirmar')) && (await ativa('Titulo')), `${V} B na confirmação volta ao título`);
  await botao('A'); await g.page.waitForTimeout(400);
  await mover('cima');
  check((await label('Confirmar')) === 'Começar do zero', `${V} confirmação navega até "Começar do zero"`);
  await botao('A'); await g.page.waitForTimeout(1600);
  check((await g.mapa()) === 'prologo_casa_icaro', `${V} A confirma e começa o jogo`);
  // Pausa: termina a abertura, MENU abre, navega, A abre Opções, B volta, B fecha
  for (let i = 0; i < 120; i++) {
    const cut = await g.f.evaluate(() => window.__TRISKELION__.scene.getScene('Mundo').debugState().cutscene);
    if (!cut) break;
    await botao('A');
  }
  await g.page.waitForTimeout(500);
  await botao('MENU'); await g.page.waitForTimeout(400);
  check(await ativa('Menu'), `${V} MENU abre a pausa`);
  check(await irPara('Menu', 'Opções'), `${V} pausa navega até Opções`);
  await botao('A'); await g.page.waitForTimeout(300);
  check(await ativa('Opcoes'), `${V} A abre Opções na pausa`);
  await botao('B'); await g.page.waitForTimeout(300);
  check(!(await ativa('Opcoes')) && (await ativa('Menu')), `${V} B volta à pausa`);
  await botao('B'); await g.page.waitForTimeout(300);
  check(!(await ativa('Menu')), `${V} B fecha a pausa`);
  await g.fechar();
}

await browser.close();
console.log(ok ? '\nTUDO OK' : '\nFALHAS ACIMA');
process.exit(ok ? 0 : 1);
