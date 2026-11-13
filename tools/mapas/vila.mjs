// Valesol: a MESMA planta de manhã (prologo_vila_manha) e à noite em chamas (prologo_vila).
import { Mapa, rng } from './lib.mjs';

const W = 70;
const H = 45;
const key = (x, y) => `${x},${y}`;

function vila(noite) {
  const E = noite ? 'tiles_exterior_noite' : 'tiles_exterior';
  const I = 'tiles_interior_noite';
  const F = 'tiles_fogo';
  const id = noite ? 'prologo_vila' : 'prologo_vila_manha';
  const m = new Mapa(id, W, H, noite ? [E, I, F] : [E], {
    nome: noite ? 'Valesol em chamas' : 'Valesol',
    music: noite ? 'tema_vila_em_chamas' : 'tema_casa',
  });
  const r = rng(noite ? 77 : 77); // mesma semente: mesma planta
  const N = (a, b) => (noite ? b : a); // escolhe o tile de dia ou de noite

  // ---------------------------------------------------------------- terreno
  m.encher('chao', 0, 0, W, H, E, () => ['grama_1', 'grama_1', 'grama_2', 'grama_3', 'grama_flores_1', 'grama_flores_2'][Math.floor(r() * 6)]);
  const rua = new Set();
  const praca = new Set();
  const ret = (set, x, y, w, h) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) set.add(key(i, j)); };
  ret(rua, 26, 10, 40, 3); // Rua da Venda
  ret(rua, 33, 26, 3, 12); // beco / Rua do Terreiro (trecho vertical)
  ret(rua, 6, 36, 31, 3); // Rua do Terreiro (trecho horizontal)
  ret(rua, 28, 32, 6, 2); // caminho da padaria
  ret(praca, 30, 13, 13, 13); // Praça do Chafariz
  const todos = new Set([...rua, ...praca]);
  for (const k of rua) { const [x, y] = k.split(',').map(Number); m.put('chao', x, y, E, r() < 0.7 ? 'terra_1' : 'terra_2'); }
  for (const k of praca) { const [x, y] = k.split(',').map(Number); m.put('chao', x, y, E, r() < 0.7 ? 'calcamento_1' : 'calcamento_2'); }
  m.autotile('chao2', E, 'borda_terra', rua, () => 'borda_terra', todos);
  m.autotile('chao2', E, 'borda_calcamento', praca, () => 'borda_calcamento', todos);
  // trilha de terra na frente das casas (degraus) e entre as ruas
  for (let x = 6; x <= 19; x++) m.put('chao', x, 35, E, 'terra_2');
  for (let x = 22; x <= 26; x++) m.put('chao', x, 35, E, 'terra_2');
  // terreiro de Ícaro (fundos)
  for (let y = 17; y < 25; y++) for (let x = 6; x < 20; x++) m.put('chao', x, y, E, r() < 0.55 ? 'terreiro_1' : 'terreiro_2');

  // ---------------------------------------------------------------- moldura da vila
  m.encher('objetos', 0, 0, W, 2, E, 'bambu_denso');
  m.encher('objetos', 0, 43, W, 2, E, 'bambu_denso');
  m.encher('objetos', 0, 0, 2, H, E, 'bambu_denso');
  m.encher('objetos', 66, 0, 4, H, E, 'bambu_denso');
  m.encher('chao', 66, 9, 4, 3, E, 'terra_1'); // além do portão
  m.encher('objetos', 66, 9, 4, 3, E, null);
  m.bloco('objetos', 66, 9, E, 'portao_vila');
  m.encher('chao2', 66, 9, 4, 3, E, null);
  // árvores espalhadas (copa em `acima`, tronco colide)
  const arvore = (x, y, k = 1) => m.blocoAlto(x, y, E, `arvore_${k}`, 2);
  for (const [x, y, k] of [[3, 4, 1], [20, 3, 2], [4, 14, 2], [3, 24, 1], [2, 30, 2], [3, 38, 1], [22, 40, 2], [38, 40, 1], [46, 37, 2], [52, 41, 1], [60, 38, 2], [63, 28, 1], [47, 29, 2], [57, 26, 1], [64, 18, 2], [66, 5, 1], [30, 4, 2], [45, 3, 1], [8, 8, 2], [14, 6, 1], [21, 21, 2], [24, 14, 1], [24, 22, 2], [54, 22, 1]]) arvore(x, y, k);

  // ---------------------------------------------------------------- casas
  /** Casa de 5+ de largura: telhado (3 linhas), parede (2 linhas), porta na linha y+3..y+4. */
  const casa = (x, y, w, dx, { palha = false, placa = null, chamine = true, fogo = false } = {}) => {
    const T = m.ind(E, N(palha ? 'telhado_palha' : 'telhado', 'telhado_queimado'));
    const P = m.ind(E, N('parede', 'parede_queimada'));
    for (let i = 0; i < w; i++) {
      const c = i === 0 ? 0 : i === w - 1 ? 2 : 1;
      for (let j = 0; j < 3; j++) m.put('objetos', x + i, y + j, E, T[j][c]);
      m.put('objetos', x + i, y + 3, E, P[0][c]);
      m.put('objetos', x + i, y + 4, E, P[1][c]);
    }
    for (const jx of [dx - 2, dx + 2]) if (jx > 0 && jx < w - 1) m.put('objetos', x + jx, y + 3, E, N('janela', 'janela_fogo'));
    if (placa) m.put('objetos', x + dx + 1, y + 3, E, placa);
    m.bloco('objetos', x + dx, y + 3, E, N('porta', 'porta_queimada'));
    if (chamine && !fogo) m.bloco('objetos2', x + 1, y - 1, E, 'chamine');
    if (noite && fogo) {
      for (let i = 1; i < w - 1; i += 2) m.bloco('objetos2', x + i, y + 1, F, ['fogo_alto_1', 'fogo_alto_2', 'fogo_alto_3'][(i >> 1) % 3]);
      m.bloco('acima', x + 1, y - 2, F, 'fumaca_preta_1');
      m.bloco('acima', x + w - 2, y - 2, F, 'fumaca_preta_2');
    }
    return { portaX: x + dx, portaY: y + 5 }; // zona em frente à porta
  };

  const biblio = casa(33, 3, 7, 3, { placa: m.ind(E, 'placa_biblioteca'), fogo: noite });
  casa(57, 3, 5, 2, { placa: m.ind(E, 'placa_venda'), palha: true, fogo: noite });
  casa(49, 3, 5, 2, {});
  casa(41, 3, 5, 2, { palha: true });
  casa(26, 3, 5, 2, { fogo: noite });
  casa(47, 14, 5, 2, { fogo: noite });
  const padariaP = casa(28, 27, 5, 2, { placa: m.ind(E, 'placa_padaria'), fogo: noite });
  casa(38, 27, 5, 2, { palha: true });
  const custodiaP = casa(22, 30, 5, 2, {});
  // barracão (leste): telhado de palha, parede de madeira e portão
  {
    const T = m.ind(E, N('telhado_palha', 'telhado_queimado'));
    const PM = m.ind(E, 'parede_madeira');
    for (let i = 0; i < 7; i++) {
      const c = i === 0 ? 0 : i === 6 ? 2 : 1;
      for (let j = 0; j < 3; j++) m.put('objetos', 56 + i, 16 + j, E, T[j][c]);
      m.put('objetos', 56 + i, 19, E, PM[0][c]);
      m.put('objetos', 56 + i, 20, E, PM[1][c]);
    }
    m.bloco('objetos', 58, 19, E, 'portao_barracao');
    if (noite) m.bloco('objetos2', 58, 17, F, 'fogo_alto_2');
  }

  // ---------------------------------------------------------------- casa de Ícaro (14×10 + terreiro 14×8)
  const HX = 6;
  const HY = 25;
  // terreiro cercado
  for (let x = 7; x < 19; x++) m.put('objetos', x, 17, E, 'cerca_h');
  m.put('objetos', 6, 17, E, 'cerca_canto_no');
  m.put('objetos', 19, 17, E, 'cerca_canto_ne');
  for (let y = 18; y < 24; y++) { m.put('objetos', 6, y, E, 'cerca_v'); m.put('objetos', 19, y, E, 'cerca_v'); }
  m.put('objetos', 6, 24, E, 'cerca_canto_so');
  m.put('objetos', 19, 24, E, 'cerca_canto_se');
  for (let x = 7; x < 19; x++) if (x !== 11) m.put('objetos', x, 24, E, 'cerca_h');
  m.put('objetos', 11, 19, E, N('alcapao', 'alcapao_aberto'));
  m.bloco('objetos', 14, 18, E, 'varal');
  m.bloco('objetos', 8, 19, E, 'canteiro');
  m.put('objetos', 17, 18, E, 'lenha');
  m.put('objetos', 8, 22, E, 'barril');
  m.put('objetos', 17, 21, E, 'cesto_cheio');
  m.put('objetos2', 10, 22, E, 'galinha_1');
  m.put('objetos2', 15, 22, E, 'galinha_2');
  if (!noite) {
    // casa fechada: telhado, parede e porta
    const T = m.ind(E, 'telhado');
    const P = m.ind(E, 'parede');
    for (let i = 0; i < 14; i++) {
      const c = i === 0 ? 0 : i === 13 ? 2 : 1;
      for (let j = 0; j < 8; j++) m.put('objetos', HX + i, HY + j, E, T[j === 0 ? 0 : j === 7 ? 2 : 1][c]);
      m.put('objetos', HX + i, HY + 8, E, P[0][c]);
      m.put('objetos', HX + i, HY + 9, E, P[1][c]);
    }
    for (const jx of [1, 7, 11]) m.put('objetos', HX + jx, HY + 8, E, 'janela_flores');
    m.bloco('objetos', HX + 4, HY + 8, E, 'porta');
    m.bloco('objetos2', HX + 11, HY - 1, E, 'chamine');
  } else {
    // ruína aberta: mesma planta, mesmos móveis (retrato, colchão, prateleira, viga do meio)
    const hx = (i) => HX + i;
    const hy = (j) => HY + j;
    for (let j = 0; j < 10; j++) for (let i = 0; i < 14; i++) m.put('chao', hx(i), hy(j), I, ['tabua_queimada', 'tabua_queimada', 'tabua_2', 'tabua_1'][Math.floor(r() * 4)]);
    const ru = m.ind(E, 'ruina_parede');
    for (let i = 0; i < 14; i++) {
      m.put('objetos', hx(i), hy(0), E, ru[0][i === 0 ? 0 : i === 13 ? 2 : 1]);
      if (i < 3 || i > 9) m.put('objetos', hx(i), hy(9), E, ru[0][i === 0 ? 0 : i === 13 ? 2 : 1]);
    }
    // paredes de fundo queimadas, com a porta dos fundos aberta
    const pf = m.ind(I, 'parede_fundo_queimada');
    for (let i = 1; i < 13; i++) {
      const c = i === 1 ? 0 : i === 12 ? 2 : 1;
      if (i === 5) continue;
      m.put('objetos', hx(i), hy(1), I, pf[0][c]);
      m.put('objetos', hx(i), hy(2), I, pf[1][c]);
    }
    m.put('chao', hx(5), hy(1), I, 'tabua_queimada');
    m.put('chao', hx(5), hy(2), I, 'tabua_queimada');
    m.put('chao', hx(5), hy(0), I, 'tabua_queimada');
    m.limpar('objetos', hx(5), hy(0));
    const mo = m.ind(I, 'moldura');
    for (let j = 1; j < 9; j++) {
      if (j < 6 || j > 7) m.put('objetos', hx(0), hy(j), I, mo[1][0]);
      m.put('objetos', hx(13), hy(j), I, mo[1][2]);
    }
    m.put('objetos', hx(7), hy(1), I, 'retrato_torto');
    m.bloco('objetos', hx(8), hy(1), I, 'prateleira_pote');
    m.bloco('objetos', hx(1), hy(2), I, 'fogao');
    m.bloco('objetos', hx(11), hy(3), I, 'catre');
    m.bloco('objetos', hx(10), hy(6), I, 'colchao_palha');
    m.bloco('objetos', hx(4), hy(6), E, 'viga_caida');
    m.bloco('chao2', hx(8), hy(3), I, 'tapete_azul');
    m.put('objetos', hx(1), hy(5), E, 'entulho_1');
    m.put('objetos', hx(2), hy(7), E, 'entulho_2');
    m.put('objetos', hx(9), hy(8), E, 'entulho_1');
    m.bloco('objetos', hx(11), hy(0), E, 'telhado_caido');
    m.put('objetos', hx(10), hy(4), E, 'chao_queimado_1');
    m.limpar('objetos', hx(10), hy(4));
    m.put('chao2', hx(10), hy(4), E, 'chao_queimado_1');
    m.put('chao2', hx(6), hy(8), E, 'chao_queimado_2');
    m.put('chao2', hx(2), hy(4), E, 'cinzas_1');
    m.put('chao2', hx(8), hy(7), E, 'cinzas_2');
    m.put('objetos', hx(13), hy(0), E, 'ruina_parede'[0] ? 321 - 0 : 321); // canto do telhado caído
    m.put('objetos', hx(7), hy(8), I, 'retrato_torto'); // retrato caído no chão
    m.bloco('objetos2', hx(3), hy(1), F, 'fogo_alto_1');
    m.bloco('objetos2', hx(9), hy(4), F, 'fogo_alto_3');
    m.bloco('acima', hx(3), hy(-1), F, 'fumaca_preta_3');
    m.bloco('acima', hx(10), hy(1), F, 'fumaca_preta_1');
  }

  // ---------------------------------------------------------------- praça, chafariz, muretas
  m.bloco('objetos', 35, 18, E, 'chafariz');
  for (let y = 14; y <= 24; y++) if (y < 18 || y > 20) m.put('objetos', 43, y, E, 'mureta_v');
  m.put('objetos', 43, 13, E, 'mureta_pilar');
  m.put('objetos', 43, 25, E, 'mureta_pilar');
  for (let x = 36; x <= 42; x++) m.put('objetos', x, 26, E, 'mureta_h');
  for (let x = 30; x <= 32; x++) m.put('objetos', x, 26, E, 'mureta_h');
  // cerca fecha a faixa atrás da mureta (obriga a passar pela praça)
  for (let x = 44; x <= 46; x++) m.put('objetos', x, 25, E, 'cerca_h');
  // arbustos-esconderijo na borda oeste da praça
  for (const [x, y] of [[29, 15], [29, 18], [29, 21], [29, 24]]) m.put('objetos', x, y, E, 'arbusto');
  // lampiões e bandeiras
  const lamp = noite ? 'lampiao_derretido' : 'lampiao';
  for (const [x, y] of [[30, 12], [42, 12], [31, 25], [41, 25], [48, 12], [60, 12]]) { if (y < 13) m.put('objetos', x, y, E, lamp === 'lampiao' ? null : null); }
  for (const [x, y] of [[30, 13], [42, 13]]) m.bloco('objetos', x, y, E, lamp);
  if (noite) { m.bloco('objetos', 34, 22, E, 'bandeira_cali'); m.bloco('objetos', 38, 17, E, 'bandeira_cali_chamuscada'); }

  // ---------------------------------------------------------------- cenário e esconderijos (A, B, C)
  const esc = []; // {nome,tipo,x,y,w,h}
  const hideRect = (nome, tipo, x, y, w = 1, h = 1) => { esc.push({ nome, tipo, x, y, w, h }); m.zona(nome, 'esconderijo', x, y, w, h, { tipo }); };
  // Trecho A (Rua da Venda): carroça, sacas, barril, arbustos no canto
  m.blocoAlto(60, 13, E, N('carroca', 'carroca_queimada'), 1);
  hideRect('esconderijo_carroca_1', 'carroca', 60, 13, 3, 1);
  m.blocoAlto(55, 13, E, 'sacas', 1);
  hideRect('esconderijo_sacas_1', 'sacas', 55, 13, 2, 1);
  m.blocoAlto(53, 13, E, 'barril_grande', 1);
  hideRect('esconderijo_barril_1', 'barril', 53, 13, 1, 1);
  for (const x of [44, 45]) m.put('objetos', x, 9, E, 'arbusto');
  // Trecho B (praça): carroça de feno, sacas e barris na beira da praça
  m.blocoAlto(40, 21, E, 'carroca_feno', 1);
  hideRect('esconderijo_carroca_praca', 'carroca', 40, 21, 3, 1);
  m.blocoAlto(38, 23, E, 'sacas', 1);
  hideRect('esconderijo_sacas_praca', 'sacas', 38, 23, 2, 1);
  m.blocoAlto(31, 14, E, 'barril_grande', 1);
  hideRect('esconderijo_barril_praca', 'barril', 31, 14, 1, 1);
  hideRect('esconderijo_praca', 'mureta', 44, 14, 1, 3);
  // Trecho C (Rua do Terreiro): sacas de café e carroça ao sul da rua; barril da Custódia ao norte
  m.blocoAlto(31, 39, E, 'sacas', 1);
  hideRect('esconderijo_sacas_c1', 'sacas', 31, 39, 2, 1);
  m.blocoAlto(23, 39, E, N('carroca_sacas', 'carroca_queimada'), 1);
  hideRect('esconderijo_carroca_c', 'carroca', 23, 39, 3, 1);
  m.blocoAlto(15, 39, E, 'sacas', 1);
  hideRect('esconderijo_sacas_c2', 'sacas', 15, 39, 2, 1);
  m.blocoAlto(9, 39, E, 'barril_grande', 1);
  hideRect('esconderijo_barril_c', 'barril', 9, 39, 1, 1);
  m.blocoAlto(27, 33, E, 'barril_grande', 1);
  hideRect('esconderijo_barril_custodia', 'barril', 27, 33, 1, 1);
  for (const [x, y] of [[20, 34], [21, 34], [20, 33], [21, 33]]) m.put('objetos', x, y, E, 'arbusto');
  // decoração: caixotes, cestos, lenha, galinhas, varal
  for (const [x, y, t] of [[52, 9, 'barril'], [47, 9, 'caixote'], [58, 9, 'cesto_cheio'], [37, 24, 'barril'], [42, 23, 'caixote'], [50, 9, 'lenha'], [44, 19, 'arbusto'], [36, 29, 'caixote'], [37, 31, 'cesto']]) m.put('objetos', x, y, E, t);
  m.put('objetos', 38, 34, E, 'placa_poste');
  m.put('objetos', 64, 9, E, 'placa_poste');
  if (!noite) {
    for (const [x, y, t] of [[53, 12, 'galinha_1'], [38, 14, 'galinha_2'], [24, 37, 'galinha_1']]) m.put('objetos2', x, y, E, t);
    m.bloco('objetos', 50, 20, E, 'varal');
  } else {
    // fogos soltos, brasas e marcas de queimado (fora dos caminhos de passagem)
    for (const [x, y, t] of [[48, 16, 'fogo_negro_1'], [64, 14, 'fogo_2'], [53, 27, 'fogo_negro_2'], [44, 31, 'fogo_1'], [27, 24, 'fogo_negro_3'], [24, 17, 'fogo_2'], [47, 33, 'fogo_negro_1'], [58, 22, 'fogo_3'], [30, 40, 'fogo_negro_2']]) m.put('objetos2', x, y, F, t);
    for (const [x, y, t] of [[46, 11, 'brasas_1'], [28, 11, 'brasas_2'], [36, 14, 'brasas_1'], [40, 24, 'brasas_2'], [34, 33, 'brasas_1'], [14, 37, 'brasas_2'], [29, 36, 'mancha_negra_1'], [52, 12, 'mancha_negra_2'], [60, 11, 'mancha_negra_1'], [38, 20, 'mancha_negra_2']]) m.put('chao2', x, y, F, t);
    for (const [x, y, t] of [[39, 5, 'cinzas_caindo_1'], [60, 6, 'cinzas_caindo_2'], [30, 29, 'cinzas_caindo_3'], [48, 18, 'cinzas_caindo_1'], [22, 33, 'cinzas_caindo_2']]) m.put('acima', x, y, F, t);
    for (const [x, y] of [[55, 8], [47, 9], [31, 31], [39, 34], [20, 36]]) m.put('chao2', x, y, E, 'chao_queimado_1');
    for (const [x, y] of [[44, 12], [33, 28], [12, 36], [60, 12]]) m.put('chao2', x, y, E, 'cinzas_1');
  }

  // ---------------------------------------------------------------- marcadores comuns
  const marcas = {
    marcador_vila_entrada: [64, 11],
    marcador_vila_panoramica: [36, 18],
    marcador_vila_cali_intro_a: [50, 11],
    marcador_vila_cali_intro_b: [58, 11],
    marcador_vila_esconderijo_1: [61, 13],
    marcador_vila_esconderijo_praca: [44, 15],
    marcador_vila_praca_centro: [36, 22],
    marcador_vila_biblioteca: [36, 8],
    marcador_vila_rua_de_cima: [34, 27],
    marcador_vila_rua_de_cima_b: [33, 28],
    marcador_vila_rua_de_cima_c: [35, 28],
    marcador_casa_pai: [HX + 3, HY + 6],
    marcador_casa_ao_lado_pai: [HX + 3, HY + 5],
    marcador_casa_empurrado: [HX + 3, HY + 3],
    marcador_casa_viga: [HX + 5, HY + 5],
    marcador_casa_porta_fundos: [HX + 5, HY + 2],
    marcador_terreiro_alcapao: [11, 19],
  };
  for (const [n, [x, y]] of Object.entries(marcas)) m.marcador(n, x, y);

  // ---------------------------------------------------------------- manhã: portas, moradores, portão
  if (!noite) {
    const porta = (nome, p, mapa, entry, volta) => {
      m.zona(`saida_${nome}`, 'saida', p.portaX, p.portaY, 1, 1, { map: mapa, entry, facing: 'up' });
      m.marcador(volta, p.portaX, p.portaY + 1);
    };
    porta('biblioteca', biblio, 'prologo_biblioteca', 'marcador_biblioteca_entrada', 'marcador_vila_manha_porta_biblioteca');
    porta('padaria', padariaP, 'prologo_padaria', 'marcador_padaria_entrada', 'marcador_vila_manha_porta_padaria');
    porta('custodia', custodiaP, 'prologo_casa_custodia', 'marcador_custodia_entrada', 'marcador_vila_manha_porta_custodia');
    porta('icaro', { portaX: HX + 4, portaY: HY + 10 }, 'prologo_casa_icaro', 'marcador_casa_entrada', 'marcador_vila_manha_porta_icaro');
    m.marcador('marcador_vila_manha_portao', 65, 11);
    m.zona('gatilho_portao_vila', 'gatilho', 64, 10, 2, 3, { dialogue: 'prologo_00d_saida_vila', once: false });
    // figurantes (sem fala obrigatória)
    for (const [n, x, y, f] of [['morador_1', 46, 9, 'down'], ['morador_2', 38, 15, 'left'], ['morador_3', 28, 13, 'right'], ['morador_4', 17, 36, 'up']]) m.npc(n, x, y, { facing: f, sprite: 'aldeao' });
    m.marcador('marcador_vila_manha_inicio', 10, 36);
  } else {
    // ---------------------------------------------------------------- noite: gatilhos, examináveis, furtividade
    m.zona('gatilho_vila_entrada', 'gatilho', 64, 10, 1, 3, { dialogue: 'prologo_08_vila_entrada', activation: 'load' });
    m.zona('gatilho_vila_praca', 'gatilho', 44, 10, 2, 4, { dialogue: 'prologo_10_praca' });
    m.zona('gatilho_casa', 'gatilho', HX + 1, HY + 5, 10, 1, { dialogue: 'prologo_12_pai_confissao,prologo_13_cura,prologo_14_promessa' });
    m.zona('checkpoint_entrada', 'checkpoint', 60, 13, 3, 1, {});
    m.zona('checkpoint_praca', 'checkpoint', 44, 14, 1, 3, {});
    m.zona('checkpoint_beco', 'checkpoint', 33, 27, 3, 1, {});
    m.zona('checkpoint_casa', 'checkpoint', HX + 1, HY + 8, 9, 1, {});
    m.npc('pai', HX + 3, HY + 6, { facing: 'right', sprite: 'pai' });
    m.examinar('exame_biblioteca', 35, 8, { dialogue: 'prologo_exame_biblioteca' }, 3, 1);
    m.examinar('exame_padaria', 29, 32, { dialogue: 'prologo_exame_padaria' }, 3, 1);
    m.examinar('exame_chafariz', 34, 17, { dialogue: 'prologo_exame_chafariz' }, 5, 5);
    m.examinar('exame_saca_cafe', 31, 38, { dialogue: 'prologo_exame_saca_cafe' }, 2, 2);
    m.examinar('exame_retrato', HX + 7, HY + 8, { dialogue: 'prologo_exame_retrato' });
    m.examinar('exame_colchao', HX + 10, HY + 6, { dialogue: 'prologo_exame_colchao' }, 2, 2);
    m.examinar('barril_custodia', 27, 33, { dialogue: 'prologo_11_custodia' }, 1, 2);

    // patrulhas (ver docs/mapas/furtividade.md para os números)
    const cali = (nome, rota, p = {}, x, y) => m.inimigo(nome, x, y, { route: rota, sprite: 'caligosuin', ...p });
    // Trecho A: 1 Caligosuin na Rua da Venda (vai e volta)
    m.rota('patrulha_a1', [[47, 11], [59, 11]]);
    cali('cali_a1', 'patrulha_a1', { speed: 34, vision: 88, angle: 76, wait: 2200 }, 47, 11);
    // Trecho B: 2 em volta do chafariz, sentidos opostos
    m.rota('patrulha_b1', [[32, 16], [41, 16], [41, 23], [32, 23]]);
    m.rota('patrulha_b2', [[41, 23], [41, 16], [32, 16], [32, 23]]);
    cali('cali_b1', 'patrulha_b1', { speed: 30, vision: 72, angle: 70, wait: 1200, mode: 'loop' }, 32, 16);
    cali('cali_b2', 'patrulha_b2', { speed: 30, vision: 72, angle: 70, wait: 1200, mode: 'loop' }, 41, 23);
    // Toucim parado: o cone gira 90° a cada 4 s
    m.entidade({ name: 'toucim_posto', type: 'inimigo', point: true, ...m.centroPx(31, 21), properties: [
      { name: 'sprite', type: 'string', value: 'caligosuin' }, { name: 'turn', type: 'int', value: 4000 }, { name: 'vision', type: 'int', value: 88 }, { name: 'angle', type: 'int', value: 80 }, { name: 'facing', type: 'string', value: 'right' } ] });
    m.marcador('posto_toucim', 31, 21);
    // Trecho C: 2 patrulhas cruzadas na Rua do Terreiro
    m.rota('patrulha_c1', [[34, 28], [34, 37], [24, 37]]);
    m.rota('patrulha_c2', [[8, 37], [19, 37], [29, 37]]);
    cali('cali_c1', 'patrulha_c1', { speed: 34, vision: 88, angle: 76, wait: 1800 }, 34, 28);
    cali('cali_c2', 'patrulha_c2', { speed: 34, vision: 88, angle: 76, wait: 1800 }, 8, 37);
  }
  return m;
}

export const vilaManha = () => vila(false);
export const vilaNoite = () => vila(true);
