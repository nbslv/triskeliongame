// Interiores do Prólogo: casa de Ícaro (com terreiro), casa da Custódia, padaria e biblioteca.
import { Mapa, rng } from './lib.mjs';

const I = 'tiles_interior';
const E = 'tiles_exterior';

/** Sala: moldura, duas linhas de parede de fundo, piso e soleira. (x0,y0) = canto superior esquerdo. */
function sala(m, x0, y0, w, h, { soleiraX, semente = 7, piso = ['tabua_1', 'tabua_2'] }) {
  const r = rng(semente);
  const mo = m.ind(I, 'moldura');
  const pf = m.ind(I, 'parede_fundo');
  // piso
  m.encher('chao', x0, y0, w, h, I, () => piso[r() < 0.6 ? 0 : 1]);
  // moldura (1 tile): cantos, topo/base, laterais
  for (let x = 0; x < w; x++) {
    const c = x === 0 ? 0 : x === w - 1 ? 2 : 1;
    m.put('objetos', x0 + x, y0, I, mo[0][c]);
    m.put('objetos', x0 + x, y0 + h - 1, I, mo[2][c]);
  }
  for (let y = 1; y < h - 1; y++) {
    m.put('objetos', x0, y0 + y, I, mo[1][0]);
    m.put('objetos', x0 + w - 1, y0 + y, I, mo[1][2]);
  }
  // parede de fundo (2 linhas)
  for (let x = 1; x < w - 1; x++) {
    const c = x === 1 ? 0 : x === w - 2 ? 2 : 1;
    m.put('objetos', x0 + x, y0 + 1, I, pf[0][c]);
    m.put('objetos', x0 + x, y0 + 2, I, pf[1][c]);
  }
  // soleira (a porta de baixo): tile atravessável sobre a moldura
  m.limpar('objetos', x0 + soleiraX, y0 + h - 1);
  m.put('chao', x0 + soleiraX, y0 + h - 1, I, 'soleira');
}

/** Peça "sólida" (bloco de índices) numa camada de objetos. */
const peca = (m, x, y, nome, camada = 'objetos') => m.bloco(camada, x, y, I, nome);

function porta({ m, y0, h, soleiraX, aqui, vila, entrada, voltar, trancada }) {
  const p = { map: vila, entry: voltar, facing: 'down', return: true };
  if (trancada) {
    p.locked_if = '!prologo.cafe_com_pai';
    p.locked_dialogue = 'prologo_00c_porta_sem_cafe';
  }
  m.zona(`saida_${aqui}`, 'saida', soleiraX, y0 + h - 1, 1, 1, p);
  m.marcador(entrada, soleiraX, y0 + h - 2);
}

// ------------------------------------------------------------------ casa de Ícaro
export function casaIcaro() {
  const m = new Mapa('prologo_casa_icaro', 14, 18, [I, E], { nome: 'Casa de Ícaro', music: 'tema_casa' });
  const Y = 8; // interior começa na linha 8; terreiro acima (linhas 0–7)
  sala(m, 0, Y, 14, 10, { soleiraX: 4, semente: 11 });
  const iy = (y) => Y + y;

  // ---- terreiro (linhas 0–7): exterior da parte de trás
  const r = rng(5);
  m.encher('chao', 0, 0, 14, 8, E, () => (r() < 0.55 ? 'terreiro_1' : 'terreiro_2'));
  for (let x = 1; x < 13; x++) m.put('objetos', x, 0, E, 'cerca_h');
  m.put('objetos', 0, 0, E, 'cerca_canto_no');
  m.put('objetos', 13, 0, E, 'cerca_canto_ne');
  for (let y = 1; y < 6; y++) { m.put('objetos', 0, y, E, 'cerca_v'); m.put('objetos', 13, y, E, 'cerca_v'); }
  // fundo da casa: parede de madeira nas linhas 6–7 com a porta dos fundos
  const pm = m.ind(E, 'parede_madeira');
  for (let x = 0; x < 14; x++) {
    const c = x === 0 ? 0 : x === 13 ? 2 : 1;
    m.put('objetos', x, 6, E, pm[0][c]);
    m.put('objetos', x, 7, E, pm[1][c]);
  }
  m.bloco('objetos', 5, 6, E, 'porta_aberta');
  m.put('chao2', 5, 5, E, 'calcamento_1'); // degrau de pedra
  // terreiro: varal, canteiros, lenha, cesto, galinhas, alçapão
  m.bloco('objetos', 6, 1, E, 'varal');
  m.bloco('objetos', 2, 2, E, 'canteiro');
  m.put('objetos', 11, 1, E, 'lenha');
  m.put('objetos', 12, 1, E, 'lenha');
  m.put('objetos', 12, 4, E, 'cesto_cheio');
  m.put('objetos', 1, 4, E, 'barril');
  m.put('objetos', 10, 3, E, 'alcapao');
  m.put('objetos2', 4, 4, E, 'galinha_1');
  m.put('objetos2', 8, 5, E, 'galinha_2');
  m.put('chao2', 2, 5, E, 'grama_flores_1');
  m.put('chao2', 9, 4, E, 'terreiro_1');
  m.examinar('exame_casa_alcapao', 10, 3, { dialogue: 'prologo_casa_alcapao' });
  m.zona('saida_terreiro_para_casa', 'saida', 5, 5, 1, 1, { map: 'prologo_casa_icaro', entry: 'marcador_casa_porta_fundos', facing: 'up' });
  m.marcador('marcador_casa_terreiro', 5, 4);

  // ---- parede de fundo (linha 1 do interior)
  m.put('objetos', 3, iy(1), I, 'janela_luz');
  m.put('objetos', 4, iy(1), I, 'ferramentas');
  m.bloco('objetos', 5, iy(1), I, 'porta_fundos_aberta');
  m.put('objetos', 7, iy(1), I, 'retrato_torto');
  m.bloco('objetos', 8, iy(1), I, 'prateleira_pote');
  m.bloco('objetos', 10, iy(1), I, 'prateleira');
  m.put('objetos2', 10, iy(2), I, 'caixa_costura');
  m.zona('saida_porta_fundos', 'saida', 5, iy(2), 1, 1, { map: 'prologo_casa_icaro', entry: 'marcador_casa_terreiro', facing: 'up' });

  // ---- móveis
  peca(m, 1, iy(2), 'fogao');
  peca(m, 11, iy(3), 'catre');
  peca(m, 10, iy(6), 'colchao_palha');
  m.bloco('objetos', 5, iy(5), I, 'mesa_posta');
  m.put('objetos', 6, iy(4), I, 'cadeira_costas');
  m.put('objetos', 6, iy(7), I, 'cadeira_frente');
  peca(m, 1, iy(5), 'cadeira_balanco');
  m.put('objetos', 2, iy(7), I, 'pote_barro');
  m.put('objetos', 12, iy(8), I, 'vaso_flor');
  m.bloco('chao2', 8, iy(3), I, 'tapete_azul');
  m.bloco('chao2', 3, iy(5), I, 'luz_chao');

  // ---- marcadores
  m.marcador('marcador_casa_cama', 9, iy(6));
  m.marcador('marcador_casa_mesa', 5, iy(7));
  m.marcador('marcador_casa_pai_mesa', 6, iy(4));
  m.marcador('marcador_casa_porta_frente', 4, iy(9));
  m.marcador('marcador_casa_porta_fundos', 5, iy(3));
  porta({ m, y0: Y, h: 10, soleiraX: 4, aqui: 'porta_frente', vila: 'prologo_vila_manha', entrada: 'marcador_casa_entrada', voltar: 'marcador_vila_manha_porta_icaro', trancada: true });

  // ---- NPC e examináveis
  m.npc('pai', 6, iy(4), { dialogue: 'prologo_00b_cafe_com_pai', facing: 'down' });
  m.zona('gatilho_inicio', 'gatilho', 1, iy(8), 1, 1, { dialogue: 'prologo_00_abertura', activation: 'load' });
  m.examinar('exame_casa_colchao', 10, iy(6), { dialogue: 'prologo_casa_colchao' }, 2, 2);
  m.examinar('exame_casa_retrato', 7, iy(1), { dialogue: 'prologo_casa_retrato' }, 1, 2);
  m.examinar('exame_casa_caixa_costura', 10, iy(1), { dialogue: 'prologo_casa_caixa_costura' }, 1, 2);
  m.examinar('exame_casa_cadeira', 1, iy(5), { dialogue: 'prologo_casa_cadeira' }, 1, 2);
  m.examinar('exame_casa_fogao', 1, iy(2), { dialogue: 'prologo_casa_fogao' }, 2, 2);
  m.examinar('exame_casa_pote', 2, iy(7), { dialogue: 'prologo_casa_pote' });
  m.examinar('exame_casa_ferramentas', 4, iy(1), { dialogue: 'prologo_casa_ferramentas' }, 1, 2);
  return m;
}

// ------------------------------------------------------------------ casa da Custódia
export function casaCustodia() {
  const m = new Mapa('prologo_casa_custodia', 10, 8, [I], { nome: 'Casa da Dona Custódia', music: 'tema_casa' });
  sala(m, 0, 0, 10, 8, { soleiraX: 3, semente: 21 });
  m.put('objetos', 2, 1, I, 'janela_luz');
  m.put('objetos', 4, 1, I, 'retrato_fita');
  m.bloco('objetos', 6, 1, I, 'prateleira');
  peca(m, 7, 3, 'catre');
  peca(m, 1, 3, 'cadeira_balanco');
  m.put('objetos2', 2, 4, I, 'croche');
  m.put('objetos', 5, 3, I, 'ninho_galinha');
  m.bloco('objetos', 4, 4, I, 'mesa');
  m.bloco('chao2', 2, 5, I, 'tapete');
  m.put('objetos', 8, 5, I, 'vaso_flor');
  m.put('objetos', 1, 6, I, 'barril_melado');
  m.put('objetos', 6, 5, I, 'cadeira_lado');
  m.marcador('marcador_custodia_porta', 3, 6);
  porta({ m, y0: 0, h: 8, soleiraX: 3, aqui: 'porta', vila: 'prologo_vila_manha', entrada: 'marcador_custodia_entrada', voltar: 'marcador_vila_manha_porta_custodia' });
  m.npc('npc_custodia_casa', 4, 3, { dialogue: 'prologo_viz_custodia', sprite: 'custodia', facing: 'down' });
  m.examinar('exame_custodia_retrato', 4, 1, { dialogue: 'prologo_viz_custodia_retrato' }, 1, 2);
  m.examinar('exame_custodia_barril', 1, 6, { dialogue: 'prologo_viz_custodia_barril' });
  m.examinar('exame_custodia_croche', 2, 4, { dialogue: 'prologo_viz_custodia_croche' });
  return m;
}

// ------------------------------------------------------------------ padaria
export function padaria() {
  const m = new Mapa('prologo_padaria', 12, 8, [I], { nome: 'Padaria do Seu Juca', music: 'tema_casa' });
  sala(m, 0, 0, 12, 8, { soleiraX: 5, semente: 31 });
  m.put('objetos', 2, 1, I, 'janela_luz');
  m.bloco('objetos', 3, 1, I, 'prateleira_paes');
  m.put('objetos', 6, 1, I, 'receita');
  m.put('objetos', 7, 1, I, 'desenho');
  m.bloco('objetos', 9, 1, I, 'forno');
  // balcão em L: comprimento x=4..8 nas linhas 4–5
  const bal = ['balcao_L', 'balcao_M', 'balcao_paes', 'balcao_carimbo', 'balcao_R'];
  bal.forEach((n, i) => m.bloco('objetos', 4 + i, 4, I, n));
  m.put('objetos', 2, 5, I, 'cesto_paes');
  m.put('objetos', 8, 3, I, 'cesto_paes');
  m.put('objetos', 1, 3, I, 'vaso_flor');
  m.marcador('marcador_padaria_balcao', 3, 6);
  porta({ m, y0: 0, h: 8, soleiraX: 5, aqui: 'porta', vila: 'prologo_vila_manha', entrada: 'marcador_padaria_entrada', voltar: 'marcador_vila_manha_porta_padaria' });
  m.npc('npc_juca', 3, 5, { dialogue: 'prologo_viz_juca', sprite: 'juca', facing: 'right' });
  m.examinar('exame_juca_forno', 9, 1, { dialogue: 'prologo_viz_juca_forno' }, 2, 3);
  m.examinar('exame_juca_receita', 6, 1, { dialogue: 'prologo_viz_juca_receita' }, 1, 2);
  m.examinar('exame_juca_desenho', 7, 1, { dialogue: 'prologo_viz_juca_desenho' }, 1, 2);
  return m;
}

// ------------------------------------------------------------------ biblioteca
export function biblioteca() {
  const m = new Mapa('prologo_biblioteca', 12, 10, [I], { nome: 'Biblioteca de Valesol', music: 'tema_casa' });
  sala(m, 0, 0, 12, 10, { soleiraX: 5, semente: 41 });
  m.bloco('objetos', 1, 1, I, 'estante');
  m.bloco('objetos', 3, 1, I, 'estante');
  m.put('objetos', 6, 1, I, 'placa_silencio');
  m.put('objetos', 8, 1, I, 'janela_luz');
  m.bloco('objetos', 10, 1, I, 'estante_estreita');
  // freestanding
  m.bloco('objetos', 1, 5, I, 'estante_estreita');
  m.bloco('objetos', 1, 7, I, 'estante_estreita');
  // balcão da Ermelinda (x=7..10, linhas 5–6)
  ['balcao_L', 'balcao_M', 'balcao_fichario', 'balcao_R'].forEach((n, i) => m.bloco('objetos', 7 + i, 5, I, n));
  m.bloco('chao2', 4, 7, I, 'tapete_azul');
  m.put('objetos', 10, 8, I, 'vaso_flor');
  m.marcador('marcador_biblioteca_balcao', 6, 7);
  porta({ m, y0: 0, h: 10, soleiraX: 5, aqui: 'porta', vila: 'prologo_vila_manha', entrada: 'marcador_biblioteca_entrada', voltar: 'marcador_vila_manha_porta_biblioteca' });
  m.npc('npc_ermelinda', 6, 5, { dialogue: 'prologo_viz_biblioteca', sprite: 'ermelinda', facing: 'right' });
  m.examinar('exame_biblioteca_estante', 3, 1, { dialogue: 'prologo_viz_biblioteca_estante' }, 2, 2);
  m.examinar('exame_biblioteca_ficha', 9, 5, { dialogue: 'prologo_viz_biblioteca_ficha' }, 1, 2);
  return m;
}
