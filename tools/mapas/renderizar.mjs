// Renderiza um mapa Tiled (content/maps/<id>.json) em PNG, com marcadores/zonas sobrepostos.
// Uso: node tools/mapas/renderizar.mjs <id> [saida.png] [--sem-objetos] [--escala=2]
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = process.argv.slice(2);
const id = args[0];
const saida = args.find((a, i) => i > 0 && !a.startsWith('--')) ?? join(RAIZ, 'docs', 'mapas', 'render', `${id}.png`);
const objs = !args.includes('--sem-objetos');
const escala = Number((args.find((a) => a.startsWith('--escala=')) ?? '--escala=2').split('=')[1]);
const mapa = JSON.parse(readFileSync(join(RAIZ, 'content', 'maps', `${id}.json`), 'utf8'));
const imgs = {};
for (const ts of mapa.tilesets) {
  imgs[ts.name] = 'data:image/png;base64,' + readFileSync(join(RAIZ, 'assets', 'tilesets', `${ts.name}.png`)).toString('base64');
}
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 400, height: 300 } });
await p.setContent('<body style="margin:0"><canvas id=c></canvas></body>');
await p.evaluate(async ({ mapa, imgs, objs, escala }) => {
  const W = mapa.width * 16, H = mapa.height * 16;
  const c = document.getElementById('c');
  c.width = W * escala; c.height = H * escala;
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.scale(escala, escala);
  g.fillStyle = '#222'; g.fillRect(0, 0, W, H);
  const load = (src) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = src; });
  const im = {}; for (const k in imgs) im[k] = await load(imgs[k]);
  for (const l of mapa.layers) {
    if (l.type !== 'tilelayer') continue;
    l.data.forEach((gid, i) => {
      if (!gid) return;
      const ts = [...mapa.tilesets].reverse().find((t) => gid >= t.firstgid);
      const idx = gid - ts.firstgid; const cols = ts.columns;
      g.drawImage(im[ts.name], (idx % cols) * 16, Math.floor(idx / cols) * 16, 16, 16, (i % mapa.width) * 16, Math.floor(i / mapa.width) * 16, 16, 16);
    });
  }
  if (objs) {
    g.font = '5px monospace';
    for (const l of mapa.layers) {
      if (l.type !== 'objectgroup') continue;
      for (const o of l.objects) {
        const t = (o.type || '').toLowerCase();
        const cor = l.name === 'markers' ? '#00e5ff' : t === 'npc' ? '#ff66ff' : t === 'inimigo' ? '#ff3030' : t === 'esconderijo' ? '#30ff30' : t === 'saida' ? '#ffff00' : t === 'checkpoint' ? '#ffffff' : '#ff9900';
        g.strokeStyle = cor; g.fillStyle = cor; g.globalAlpha = 0.9;
        if (o.point) { g.fillRect(o.x - 1.5, o.y - 3, 3, 3); }
        else { g.strokeRect(o.x, o.y, o.width, o.height); }
        if (o.name) { g.globalAlpha = 0.9; g.fillText(o.name.replace(/^marcador_|^exame_|^patrulha_|^esconderijo_/, '').slice(0, 14), o.x + 1, (o.point ? o.y : o.y + 6) - 3); }
      }
    }
  }
}, { mapa, imgs, objs, escala });
const { mkdirSync } = await import('node:fs');
mkdirSync(dirname(saida), { recursive: true });
await (await p.$('#c')).screenshot({ path: saida });
await b.close();
console.log('ok', saida);
