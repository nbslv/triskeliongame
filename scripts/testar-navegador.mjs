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
const flagsNow = () => page.evaluate(() => JSON.parse(localStorage.getItem('triskelion.save.auto') ?? '{}').flags ?? {});
const evalWorld = (fn, arg) => page.evaluate(([f, a]) => new Function('w', 'a', f)(window.__TRISKELION__.scene.getScene('Mundo'), a), [fn, arg]);
const teleport = (x, y, facing = 'up') =>
  evalWorld('w.player.sprite.setPosition(a.x, a.y); w.player.face(a.facing); w.player.body.reset(a.x, a.y);', { x, y, facing });
const goMap = async (map, at) => {
  await evalWorld('w.changeMap(a.map, a.at)', { map, at });
  await wait(1200);
};
const box = () => page.evaluate(() => window.__TRISKELION__.scene.getScene('Dialogo').boxRect());
const waitCutsceneEnd = async (max = 40) => {
  for (let i = 0; i < max; i++) {
    const st = await state();
    if (!st.cutscene) return true;
    await tapA();
    await wait(300);
  }
  return !(await state()).cutscene;
};
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
{
  const r = await page.evaluate(async () => {
    const t = window.__TRISKELION__.scene.getScene('Titulo');
    const keys = t.children.list.filter((o) => o.type === 'Image').map((o) => o.texture.key);
    const man = await fetch('manifest.webmanifest').then((x) => x.json()).catch(() => null);
    const icon = await fetch('icons/icone_192.png').then((x) => x.ok && x.headers.get('content-type')?.includes('png')).catch(() => false);
    return { keys, orientation: man?.orientation, icons: man?.icons?.length ?? 0, icon };
  });
  check(r.keys.includes('titulo_fundo') && r.keys.includes('simbolo_triskelion'), `título usa a arte final (${r.keys.join(', ')})`);
  check(r.orientation === 'landscape' && r.icons >= 2 && r.icon, 'manifest de PWA (paisagem) e ícones servidos');
}
await page.screenshot({ path: `${OUT}/01-titulo.png` });

// Novo jogo (toque direto no item)
await page.evaluate(() => localStorage.removeItem('triskelion.save.auto'));
await tap(300, 214);
await wait(1500);
let s = await state();
check(s && !!s.map, `novo jogo abriu o mapa inicial (${s?.map})`);
// O jogo começa no prólogo; este teste usa os mapas de teste do motor.
await waitCutsceneEnd(80);
await goMap('teste', 'inicio');
s = await state();
check(s.map === 'teste', 'foi para o mapa de teste');

// Porta da casa trancada até falar com o aldeão (locked_if)
s = await walkTo(136, 140, 6000);
await wait(300);
s = await state();
check(s.map === 'teste' && s.cutscene, 'porta trancada mostra mensagem e não entra');
await waitCutsceneEnd();
await teleport(136, 191, 'down'); // volta ao ponto inicial
await wait(150);
s = await state();

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
{
  const b = await box();
  check(b.visible && b.x + b.w <= 640 - 108 - 22, `caixa de diálogo não fica embaixo dos botões A/B (termina em x=${b.x + b.w})`);
  check(b.name === 'Aldeão', `nome do falante com acento: "${b.name}"`);
}
check(await advanceDialogue(), 'diálogo do NPC termina com toques');

// Fonte com todos os acentos do PT-BR
check(
  await page.evaluate(() => document.fonts.check('20px VT323', 'ãõçéêáíóúàâôÍÇÉÚÃÕÀ')),
  'fonte VT323 carregada para todos os acentos (ã õ ç é ê á í ó ú à â ô)',
);

// Casa: entra pela porta (agora destrancada), fala com a moradora, examina, sai e volta ao lado de fora
await teleport(136, 165, 'up');
await wait(100);
s = await walkTo(136, 140, 6000);
await wait(900);
s = await state();
if (s.map !== 'teste_casa') console.log('  (debug porta)', JSON.stringify(s.player), s.cutscene);
check(s.map === 'teste_casa', `porta leva ao interior (${s.map})`);
await teleport(72, 100, 'up'); // abaixo da moradora (4,4)
await wait(100);
await tapA();
await wait(1500);
{
  const b = await box();
  check(b.name === 'Dona Custódia', `moradora fala com nome acentuado ("${b.name}")`);
  await page.screenshot({ path: `${OUT}/07-casa-moradora.png` });
}
check(await waitCutsceneEnd(), 'diálogo da moradora termina');
await teleport(56, 63, 'up'); // abaixo do retrato (3,2)
await tapA();
await wait(400);
check((await state()).cutscene, 'objeto examinável abre diálogo');
await waitCutsceneEnd();
s = await walkTo(104, 150, 5000);
s = await walkTo(104, 158, 3000);
await wait(900);
s = await state();
check(s.map === 'teste' && s.player.y > 144 && Math.abs(s.player.x - 136) < 12, `saída do interior volta para fora da porta (${s.map} ${s.player.x},${s.player.y})`);

// Gatilho da cutscene de teste em x=288..304, y=208..272
await teleport(136, 191, 'down');
await wait(100);
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

// Colheita: 3 objetos com contador
for (const [i, x] of [[1, 232], [2, 264], [3, 296]]) {
  await teleport(x, 223, 'up');
  await wait(80);
  await tapA();
  await wait(300);
  await waitCutsceneEnd();
}
await evalWorld('w.autosave(true)');
check((await flagsNow())['teste.colheita_completa'] === true, 'contador de colheita marca a flag ao completar');

// Atividade (minijogo/loja): abre cena registrada e grava o resultado
await goMap('teste2', 'centro');
await teleport(312, 112, 'up');
await wait(100);
await tapA();
await wait(500);
check((await activeScenes()).includes('AtividadeTeste'), 'objeto com activity abre a cena registrada');
await page.screenshot({ path: `${OUT}/08-atividade.png` });
await tapA();
await wait(600);
{
  const auto = await page.evaluate(() => JSON.parse(localStorage.getItem('triskelion.save.auto') ?? '{}'));
  check(auto.flags?.['atividade.teste.concluida'] === true && auto.state?.coins === 7 && auto.state?.attributes?.magia === 2,
    `resultado da atividade vai para flags e save (moedas=${auto.state?.coins}, magia=${auto.state?.attributes?.magia})`);
}

// Túnel escuro com círculo de luz
await goMap('teste_tunel', 'tunel_inicio');
await waitCutsceneEnd();
s = await state();
check(s.dark === 48, `mapa escuro com luz de raio ${s.dark}`);
await joystick(1, 0);
await wait(500);
await joystickRelease();
await page.screenshot({ path: `${OUT}/09-tunel-escuro.png` });

// Tilesets da arte: carregam, fogo animado, collides e hide
await goMap('teste_arte', 'inicio');
{
  const r = await page.evaluate(async () => {
    const w = window.__TRISKELION__.scene.getScene('Mundo');
    const a1 = w.debugState().animatedTiles.map((a) => a.frame);
    await new Promise((res) => setTimeout(res, 250));
    const a2 = w.debugState().animatedTiles.map((a) => a.frame);
    return {
      keys: w.tilemap.tilesets.map((t) => t.image?.key),
      animated: a1.length,
      changed: a1.some((f, i) => f !== a2[i]),
      fireSolid: w.isSolid(18 * 16 + 8, 5 * 16 + 8),
      grassFree: !w.isSolid(8 * 16 + 8, 12 * 16 + 8),
    };
  });
  check(r.keys.every((k) => k && k !== 'tileset:placeholder'), `tilesets da arte carregados (${r.keys.join(', ')})`);
  check(r.animated > 0 && r.changed, `tiles animados trocam de quadro (${r.animated} animações)`);
  check(r.fireSolid && r.grassFree, 'propriedade collides dos tilesets da arte');
  await teleport(11 * 16 + 8, 7 * 16 + 12, 'down');
  await wait(200);
  check((await state()).hidden, 'propriedade hide dos tilesets da arte (arbusto)');
  await teleport(18 * 16 + 8, 7 * 16 + 15, 'up');
  await wait(300);
  await page.screenshot({ path: `${OUT}/11-tilesets-arte.png` });
}

// NPC sem diálogo (fala padrão por tipo/período) e portas de casas sem interior
await goMap('teste', 'inicio');
{
  const dlgText = () => page.evaluate(() => { const d = window.__TRISKELION__.scene.getScene('Dialogo'); return { text: d.full, name: d.boxRect().name }; });
  await teleport(3 * 16 + 8 + 14, 12 * 16 + 15, 'left');
  await wait(100);
  await tapA();
  await wait(1200);
  let t = await dlgText();
  check(t.name === 'Galinha de Teste' && /tarde/.test(t.text), `NPC sem dialogue usa padrao_<tipo> com período (${t.name}: ${t.text})`);
  await waitCutsceneEnd();
  await teleport(11 * 16 + 8, 8 * 16 + 15, 'up');
  await wait(100);
  await tapA();
  await wait(1200);
  t = await dlgText();
  check(t.text === 'A casa de Seu Teste está trancada.', `porta trancada com {dono} (${t.text})`);
  await waitCutsceneEnd();
  await teleport(4 * 16 + 8, 8 * 16 + 15, 'up');
  await wait(100);
  await tapA();
  await wait(1000);
  t = await dlgText();
  check(/texto vindo do mapa/.test(t.text), 'porta trancada com trancada_texto do mapa');
  await waitCutsceneEnd();
  await goMap('teste2', 'entrada_oeste');
  await teleport(4 * 16 + 8, 5 * 16 + 14, 'up');
  await wait(100);
  await tapA();
  await wait(1200);
  t = await dlgText();
  check(/Boa noite/.test(t.text), `variante por período (noite): ${t.text}`);
  await waitCutsceneEnd();
  await goMap('teste', 'inicio');
}

// Arte: poses (anim), sprites especiais e emotes por ícone
await goMap('teste', 'inicio');
{
  const r = await page.evaluate(async () => {
    const g = window.__TRISKELION__;
    const w = g.scene.getScene('Mundo');
    const out = {
      poses: ['icaro:colher', 'pai:mostrar_caixa', 'cali_soldado:bufar', 'toucim:bronca', 'caixa_costura:aberta'].filter((k) => g.anims.exists(k)).length,
      emoteIcon: g.textures.exists('emote_exclamacao') && g.textures.exists('emote_suor'),
    };
    w.cutSpawn('cali_1', [12, 11], undefined, 'down');
    w.cutSpawn('toucim', [14, 11], undefined, 'down');
    out.caliSprite = w.actors.get('cali_1').textureKey;
    out.toucimH = w.actors.get('toucim').sprite.height;
    w.cutAnim('icaro', 'colher');
    out.icaroAnim = w.player.sprite.anims.currentAnim?.key;
    w.cutAnim('toucim', 'bronca');
    out.toucimAnim = w.actors.get('toucim').sprite.anims.currentAnim?.key;
    void w.cutEmote('cali_1', '!', 1500);
    void w.cutEmote('toucim', '💧', 1500);
    return out;
  });
  check(r.poses === 5, `animações de pose da arte criadas (${r.poses}/5)`);
  check(r.icaroAnim === 'icaro:colher' && r.toucimAnim === 'toucim:bronca', `passo anim toca a pose (${r.icaroAnim}, ${r.toucimAnim})`);
  check(r.caliSprite === 'cali_soldado' && r.toucimH === 32, `cali_N usa cali_soldado e toucim é 16×32 (${r.caliSprite}, h=${r.toucimH})`);
  check(r.emoteIcon, 'ícones de emote carregados');
  await wait(300);
  await page.screenshot({ path: `${OUT}/12-poses-emotes.png` });
  await evalWorld("w.cutDespawn('cali_1'); w.cutDespawn('toucim'); w.cutAnim('icaro', 'normal');");
}

// Músicas: carregadas sob demanda, com laço do manifesto (tema_lenda toca uma vez)
{
  const r = await page.evaluate(async () => {
    const a = window.__TRISKELION_AUDIO__;
    const waitSrc = async () => {
      for (let i = 0; i < 50 && !a.current?.source; i++) await new Promise((res) => setTimeout(res, 100));
      return a.current?.source;
    };
    a.playMusic('tema_casa', 50);
    const casa = await waitSrc();
    const casaInfo = casa ? { loop: casa.loop, loopEnd: Math.round(casa.loopEnd) } : null;
    a.playMusic('tema_lenda', 50);
    const lenda = await waitSrc();
    const lendaLoop = lenda ? lenda.loop : null;
    a.playMusic(null, 50);
    return { casaInfo, lendaLoop };
  });
  check(r.casaInfo?.loop === true && r.casaInfo?.loopEnd === 48, `música em laço com loopEnd do manifesto (${JSON.stringify(r.casaInfo)})`);
  check(r.lendaLoop === false, 'tema_lenda toca uma vez só (sem laço)');
}

// Salvar manualmente pelo menu (espaço 1)
await goMap('teste', 'inicio');
await tap(640 - 30, 26);
await wait(400);
await tap(100, 108); // Salvar
await wait(400);
await tap(150, 122); // Espaço 1
await wait(300);
const slot1 = await page.evaluate(() => JSON.parse(localStorage.getItem('triskelion.save.1') ?? 'null'));
check(slot1?.position?.map === 'teste', 'salvar pelo menu grava no espaço 1');
await tap(640 - 30, 26); // MENU fecha espaços? (B/menu)
await page.keyboard.press('Escape');
await wait(200);
await page.keyboard.press('Escape');
await wait(400);

// Retomada: anda um pouco e RECARREGA a página no meio da exploração
await joystick(1, 0);
await wait(400);
await joystickRelease();
await wait(200);
const before = await state();
await page.reload();
await wait(1800);
const titleTexts = await page.evaluate(() => window.__TRISKELION__.scene.getScene('Titulo').children.list.filter((o) => o.type === 'Text').map((o) => o.text));
check(titleTexts.includes('Retomar de onde parou'), 'título oferece "Retomar de onde parou" após recarregar');
await page.screenshot({ path: `${OUT}/10-titulo-retomar.png` });
await tap(280, 214);
await wait(1500);
s = await state();
check(s && s.map === before.map && Math.abs(s.player.x - before.player.x) < 4 && Math.abs(s.player.y - before.player.y) < 4,
  `retomada volta à mesma posição (${before.player.x},${before.player.y} → ${s?.player.x},${s?.player.y})`);

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
