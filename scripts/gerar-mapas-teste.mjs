// Gera content/maps/teste.json e teste2.json (formato Tiled JSON) para testar o motor.
// Uso: node scripts/gerar-mapas-teste.mjs
// Os mapas definitivos são feitos no Tiled pela sessão de mapas; este script é só para o mapa de teste.
import { writeFileSync } from 'node:fs';

const T = {
  grama: 0, terra: 1, muro: 2, agua: 3, madeira: 4, arbusto: 5, barril: 6, arvore: 7,
  telhado: 8, parede: 9, porta: 10, flores: 11, cerca: 12, fogo: 13, cinzas: 14, escuro: 15,
};
const COLLIDES = [T.muro, T.agua, T.arvore, T.telhado, T.parede, T.porta, T.cerca, T.fogo, T.escuro];
const HIDES = [T.arbusto, T.barril];

const tileset = {
  firstgid: 1,
  name: 'placeholder',
  image: '../../assets/tilesets/placeholder.png',
  imagewidth: 128,
  imageheight: 32,
  tilewidth: 16,
  tileheight: 16,
  tilecount: 16,
  columns: 8,
  margin: 0,
  spacing: 0,
  tiles: [
    ...COLLIDES.map((id) => ({ id, properties: [{ name: 'collides', type: 'bool', value: true }] })),
    ...HIDES.map((id) => ({ id, properties: [{ name: 'hide', type: 'bool', value: true }] })),
  ].sort((a, b) => a.id - b.id),
};

const prop = (name, value) => ({
  name,
  type: typeof value === 'boolean' ? 'bool' : typeof value === 'number' ? (Number.isInteger(value) ? 'int' : 'float') : 'string',
  value,
});

function makeMap(w, h, props) {
  const ground = new Array(w * h).fill(T.grama + 1);
  const objs = new Array(w * h).fill(0);
  const S = 16;
  let nextId = 1;
  const objects = { entidades: [], markers: [] };
  const api = {
    w, h,
    ground: (x, y, t) => { ground[y * w + x] = t + 1; },
    obj: (x, y, t) => { objs[y * w + x] = t === null ? 0 : t + 1; },
    rect(x0, y0, x1, y1, fn) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) fn(x, y); },
    marker(name, tx, ty) {
      objects.markers.push({ id: nextId++, name, type: '', point: true, x: tx * S + 8, y: ty * S + 15, width: 0, height: 0, rotation: 0, visible: true });
    },
    entity(o) {
      objects.entidades.push({ id: nextId++, rotation: 0, visible: true, width: 0, height: 0, ...o });
    },
    zone(name, type, tx, ty, tw, th, properties) {
      api.entity({ name, type, x: tx * S, y: ty * S, width: tw * S, height: th * S, properties });
    },
    build() {
      return {
        type: 'map', version: '1.10', tiledversion: '1.10.2', orientation: 'orthogonal', renderorder: 'right-down',
        width: w, height: h, tilewidth: S, tileheight: S, infinite: false, compressionlevel: -1,
        nextlayerid: 5, nextobjectid: nextId,
        properties: props,
        tilesets: [tileset],
        layers: [
          { id: 1, name: 'chao', type: 'tilelayer', width: w, height: h, x: 0, y: 0, opacity: 1, visible: true, data: ground },
          { id: 2, name: 'objetos', type: 'tilelayer', width: w, height: h, x: 0, y: 0, opacity: 1, visible: true, data: objs },
          { id: 3, name: 'entidades', type: 'objectgroup', draworder: 'topdown', x: 0, y: 0, opacity: 1, visible: true, objects: objects.entidades },
          { id: 4, name: 'markers', type: 'objectgroup', draworder: 'topdown', x: 0, y: 0, opacity: 1, visible: true, objects: objects.markers },
        ],
      };
    },
  };
  return api;
}

// ---------------- teste ----------------
{
  const m = makeMap(48, 30, [prop('nome', 'Mapa de teste'), prop('music', 'teste_vila'), prop('periodo', 'tarde')]);
  // bordas
  m.rect(0, 0, 47, 29, (x, y) => { if (x === 0 || y === 0 || x === 47 || y === 29) m.obj(x, y, T.muro); });
  // caminhos
  m.rect(1, 14, 46, 15, (x, y) => m.ground(x, y, T.terra));
  m.rect(8, 8, 9, 13, (x, y) => m.ground(x, y, T.terra));
  // casa
  m.rect(3, 3, 12, 5, (x, y) => m.obj(x, y, T.telhado));
  m.rect(3, 6, 12, 7, (x, y) => m.obj(x, y, T.parede));
  m.obj(8, 7, T.porta);
  // lago e árvores
  m.rect(14, 20, 18, 24, (x, y) => m.obj(x, y, T.agua));
  for (const [x, y] of [[2, 10], [4, 18], [6, 24], [11, 22], [20, 4], [22, 6], [24, 3], [42, 4], [44, 25], [40, 26], [3, 26]]) m.obj(x, y, T.arvore);
  for (const [x, y] of [[13, 10], [15, 11], [10, 18], [12, 17], [20, 22], [21, 18]]) m.ground(x, y, T.flores);
  // área de furtividade: cercas com passagem pelo caminho
  m.rect(26, 1, 26, 12, (x, y) => m.obj(x, y, T.cerca));
  m.rect(26, 17, 26, 28, (x, y) => m.obj(x, y, T.cerca));
  m.rect(26, 2, 44, 28, (x, y) => { if (m.w && x > 26) m.ground(x, y, (((x * 73856093) ^ (y * 19349663)) >>> 0) % 11 < 2 ? T.cinzas : T.grama); });
  m.rect(27, 14, 46, 15, (x, y) => m.ground(x, y, T.terra));
  // esconderijos por tile: arbustos e barris ao longo do caminho
  for (const [x, y] of [[29, 13], [29, 16], [33, 13], [33, 16], [38, 13], [38, 16], [41, 13], [41, 16]]) m.obj(x, y, T.arbusto);
  for (const [x, y] of [[35, 13], [35, 16]]) m.obj(x, y, T.barril);
  // fogo decorativo (vila em chamas)
  for (const [x, y] of [[30, 5], [31, 5], [37, 24], [38, 24], [43, 9]]) m.obj(x, y, T.fogo);
  // saída leste
  m.obj(47, 14, null);
  m.obj(47, 15, null);

  // porta da casa → interior (trancada até falar com o aldeão)
  m.zone('porta_casa', 'saida', 8, 8, 1, 1, [prop('map', 'teste_casa'), prop('entry', 'porta_entrada'), prop('facing', 'up'),
    prop('locked_if', '!teste.falou_npc'), prop('locked_dialogue', 'teste_porta_trancada')]);
  m.marker('porta_casa_fora', 8, 9);
  // colheita: 3 pés com brilho e contador
  for (const [i, x] of [[1, 14], [2, 16], [3, 18]]) {
    m.obj(x, 12, T.arbusto);
    m.entity({ name: `pe_teste_${i}`, type: 'examinar', point: true, x: x * 16 + 8, y: 12 * 16 + 15,
      properties: [prop('dialogue', 'teste_colher'), prop('counter', 'teste.colheita'), prop('counter_goal', 3),
        prop('counter_flag', 'teste.colheita_completa'), prop('glow', true)] });
  }

  // NPC sem `dialogue`: usa a fala padrão do tipo (padrao_teste[_periodo].json)
  m.entity({ name: 'galinha_teste', type: 'npc', point: true, x: 3 * 16 + 8, y: 12 * 16 + 15,
    properties: [prop('tipo', 'teste'), prop('nome', 'Galinha de Teste'), prop('facing', 'right')] });
  // portas de casas sem interior
  m.zone('porta_dono', 'porta_trancada', 11, 7, 1, 1, [prop('dono', 'Seu Teste')]);
  m.zone('porta_texto', 'porta_trancada', 4, 7, 1, 1, [prop('trancada_texto', '[teste] Porta com texto vindo do mapa.')]);

  // marcadores
  m.marker('inicio', 8, 11);
  m.marker('entrada_leste', 45, 14);
  m.marker('ponto_a', 21, 11);
  m.marker('ponto_b', 16, 11);
  m.marker('camera_foco', 33, 14);
  m.marker('spawn_visitante', 21, 9);
  m.marker('checkpoint_cutscene', 19, 14);

  // entidades
  m.entity({ name: 'aldeao', type: 'npc', point: true, x: 12 * 16 + 8, y: 9 * 16 + 15,
    properties: [prop('dialogue', 'teste_npc'), prop('sprite', 'aldeao'), prop('facing', 'down')] });
  m.zone('gatilho_cutscene', 'gatilho', 18, 13, 1, 4, [prop('dialogue', 'teste'), prop('once', true)]);
  m.zone('checkpoint_furtividade', 'checkpoint', 23, 13, 1, 4, []);
  m.zone('moita_grande', 'esconderijo', 24, 18, 2, 2, []);
  m.obj(24, 18, T.arbusto); m.obj(25, 18, T.arbusto); m.obj(24, 19, T.arbusto); m.obj(25, 19, T.arbusto);
  m.zone('saida_leste', 'saida', 46, 14, 2, 2, [prop('map', 'teste2'), prop('entry', 'entrada_oeste'), prop('facing', 'right')]);
  // inimigo patrulhando um retângulo (polígono = volta em laço)
  const px = (t) => t * 16 + 8;
  const py = (t) => t * 16 + 15;
  m.entity({ name: 'rota_guarda', type: 'rota', x: px(31), y: py(8),
    polygon: [{ x: 0, y: 0 }, { x: 0, y: (21 - 8) * 16 }, { x: (36 - 31) * 16, y: (21 - 8) * 16 }, { x: (36 - 31) * 16, y: 0 }] });
  m.entity({ name: 'guarda', type: 'inimigo', point: true, x: px(31), y: py(8),
    properties: [prop('route', 'rota_guarda'), prop('sprite', 'caligosuin'), prop('speed', 42), prop('vision', 80), prop('angle', 70), prop('wait', 600)] });
  // sentinela parada que gira
  m.entity({ name: 'sentinela', type: 'inimigo', point: true, x: px(43), y: py(20),
    properties: [prop('sprite', 'caligosuin'), prop('turn', 1800), prop('vision', 64), prop('facing', 'left')] });

  writeFileSync('content/maps/teste.json', JSON.stringify(m.build(), null, 1) + '\n');
}

// ---------------- teste2 ----------------
{
  const m = makeMap(24, 16, [prop('nome', 'Clareira de teste'), prop('music', 'teste_clareira'), prop('periodo', 'noite')]);
  m.entity({ name: 'galinha_noite', type: 'npc', point: true, x: 4 * 16 + 8, y: 4 * 16 + 15, properties: [prop('tipo', 'teste')] });
  m.rect(0, 0, 23, 15, (x, y) => { if (x === 0 || y === 0 || x === 23 || y === 15) m.obj(x, y, T.muro); });
  m.rect(1, 7, 12, 8, (x, y) => m.ground(x, y, T.terra));
  m.rect(14, 4, 20, 10, (x, y) => m.ground(x, y, T.madeira));
  for (const [x, y] of [[5, 3], [8, 12], [19, 13], [3, 12]]) m.obj(x, y, T.arvore);
  m.obj(0, 7, null);
  m.obj(0, 8, null);
  m.obj(12, 6, T.barril);
  m.marker('entrada_oeste', 2, 7);
  m.marker('centro', 17, 7);
  m.zone('saida_oeste', 'saida', 0, 7, 1, 2, [prop('map', 'teste'), prop('entry', 'entrada_leste'), prop('facing', 'left')]);
  m.zone('placa', 'gatilho', 11, 6, 1, 1, [prop('dialogue', 'teste_placa'), prop('activation', 'interact'), prop('once', false)]);
  m.obj(11, 6, T.cerca);
  m.entity({ name: 'viajante', type: 'npc', point: true, x: 17 * 16 + 8, y: 7 * 16 + 15,
    properties: [prop('dialogue', 'teste_npc'), prop('facing', 'left')] });
  // atividade de teste (minijogo/loja de exemplo)
  m.obj(19, 5, T.flores);
  m.entity({ name: 'altar_teste', type: 'atividade', point: true, x: 19 * 16 + 8, y: 5 * 16 + 15,
    properties: [prop('activity', 'teste'), prop('param_moedas', 7), prop('glow', true)] });
  // passagem para o túnel escuro
  m.obj(23, 11, null);
  m.obj(23, 12, null);
  m.zone('saida_tunel', 'saida', 23, 11, 1, 2, [prop('map', 'teste_tunel'), prop('entry', 'tunel_inicio'), prop('facing', 'right')]);
  m.marker('saida_tunel_volta', 21, 11);
  writeFileSync('content/maps/teste2.json', JSON.stringify(m.build(), null, 1) + '\n');
}
// ---------------- teste_casa (interior com dois cômodos) ----------------
{
  const m = makeMap(14, 10, [prop('nome', 'Casa de teste'), prop('music', 'teste_casa')]);
  m.rect(0, 0, 13, 9, (x, y) => m.ground(x, y, T.madeira));
  m.rect(0, 0, 13, 9, (x, y) => { if (x === 0 || x === 13 || y === 0 || y === 9 || y === 1) m.obj(x, y, T.parede); });
  // parede interna com vão (dois cômodos)
  m.rect(8, 2, 8, 8, (x, y) => { if (y !== 6) m.obj(x, y, T.parede); });
  m.obj(6, 9, null); // porta
  m.ground(6, 9, T.terra);
  m.obj(3, 2, T.porta); // "retrato" na parede (placeholder)
  m.obj(11, 3, T.barril); // baú
  m.obj(2, 5, T.barril); // mesa
  m.marker('porta_entrada', 6, 8);
  m.marker('moradora_cozinha', 4, 6);
  m.entity({ name: 'moradora', type: 'npc', point: true, x: 4 * 16 + 8, y: 4 * 16 + 15,
    properties: [prop('dialogue', 'teste_moradora'), prop('facing', 'down')] });
  m.entity({ name: 'retrato', type: 'examinar', x: 3 * 16, y: 2 * 16, width: 16, height: 16,
    properties: [prop('dialogue', 'teste_retrato')] });
  m.entity({ name: 'bau', type: 'examinar', x: 11 * 16, y: 3 * 16, width: 16, height: 16,
    properties: [prop('dialogue', 'teste_bau'), prop('alt_dialogue', 'teste_bau_cheio'), prop('alt_if', 'teste.colheita_completa')] });
  // saída: volta ao ponto de onde o jogador entrou (return), com mapa/entrada de reserva
  m.zone('porta_saida', 'saida', 6, 9, 1, 1, [prop('return', true), prop('map', 'teste'), prop('entry', 'porta_casa_fora'), prop('facing', 'down')]);
  writeFileSync('content/maps/teste_casa.json', JSON.stringify(m.build(), null, 1) + '\n');
}

// ---------------- teste_tunel (mapa escuro com círculo de luz) ----------------
{
  const m = makeMap(30, 8, [prop('nome', 'Túnel de teste'), prop('escuro', true), prop('luz_raio', 40)]);
  m.rect(0, 0, 29, 7, (x, y) => m.ground(x, y, T.cinzas));
  m.rect(0, 0, 29, 7, (x, y) => { if (y <= 1 || y >= 6 || x === 29) m.obj(x, y, T.muro); });
  for (const x of [6, 13, 20]) m.obj(x, 2, T.muro);
  m.obj(0, 3, null);
  m.obj(0, 4, null);
  m.marker('tunel_inicio', 2, 3);
  m.zone('tunel_entrada', 'gatilho', 0, 0, 30, 8, [prop('dialogue', 'teste_tunel'), prop('activation', 'load')]);
  m.zone('saida_tunel_oeste', 'saida', 0, 3, 1, 2, [prop('map', 'teste2'), prop('entry', 'saida_tunel_volta'), prop('facing', 'left')]);
  writeFileSync('content/maps/teste_tunel.json', JSON.stringify(m.build(), null, 1) + '\n');
}
console.log('ok: content/maps/teste*.json');
