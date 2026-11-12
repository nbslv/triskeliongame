// Mapas ao ar livre do Prólogo (exceto a vila): cafezal, estrada, túnel e bambuzal.
import { Mapa, rng } from './lib.mjs';

const E_TARDE = 'tiles_exterior_tarde';
const E_NOITE = 'tiles_exterior_noite';
const PAN = 'tiles_panorama';
const TUN = 'tiles_tunel';

/** Preenche com tiles aleatórios (nomes). */
const sorteio = (r, nomes) => () => nomes[Math.floor(r() * nomes.length)];

// ------------------------------------------------------------------ cafezal
export function cafezal() {
  const E = E_TARDE;
  const m = new Mapa('prologo_cafezal', 50, 30, [E, PAN], { nome: 'Cafezal de Valesol', music: 'tema_cafezal' });
  const r = rng(101);
  m.encher('chao', 0, 0, 50, 30, E, sorteio(r, ['grama_1', 'grama_1', 'grama_2', 'grama_3', 'grama_flores_1']));

  // horizonte: céu + vale de Valesol (panorama) emoldurado por bambuzal e morros
  m.encher('chao', 0, 0, 50, 9, E, 'grama_1');
  m.bloco('chao', 15, 0, PAN, 'pan_ceu_tarde');
  m.bloco('chao', 15, 3, PAN, 'pan_vila');
  m.encher('objetos', 0, 0, 15, 9, E, 'bambu_denso');
  m.encher('objetos', 35, 0, 15, 9, E, 'bambu_denso');
  m.encher('objetos', 15, 9, 20, 1, E, (x) => (x % 2 ? 'barranco_vermelho_M' : 'barranco_vermelho_M'));
  // um respiro no barranco: escadinha para o mirante (sem passagem para o vale)
  m.encher('objetos', 0, 29, 50, 1, E, 'bambu_denso');
  m.encher('objetos', 0, 0, 1, 30, E, 'bambu_denso');
  m.encher('objetos', 49, 0, 1, 30, E, 'bambu_denso');
  m.encher('objetos', 0, 28, 50, 1, E, 'bambu_denso');

  // terra vermelha: clareira do toco, corredor principal e arredores da balança
  const terra = sorteio(r, ['terra_vermelha_1', 'terra_vermelha_1', 'terra_vermelha_2']);
  m.encher('chao', 2, 16, 8, 9, E, terra);
  m.encher('chao', 9, 20, 40, 2, E, terra); // corredor principal y=20..21
  for (const ay of [12, 16, 24]) m.encher('chao', 10, ay, 36, 2, E, terra);
  for (const ax of [19, 29]) m.encher('chao', ax, 11, 2, 15, E, terra);
  m.encher('chao', 40, 14, 8, 10, E, terra);

  // fileiras de café: topo (y), pé (y+1) com tile sólido embaixo; lacunas nos corredores verticais
  const fileiras = [10, 14, 18, 22, 26];
  // fileiras de café ocupam y..y+1; corredores horizontais: 12–13, 16–17, 20–21, 24–25
  const marcados = new Map(); // x,y → 'maduro' | 'verde'
  const maduros = [[14, 18], [24, 18], [35, 18], [16, 22], [27, 22]];
  const verdes = [[31, 18], [22, 22], [13, 22]];
  maduros.forEach(([x, y]) => marcados.set(`${x},${y}`, 'maduro'));
  verdes.forEach(([x, y]) => marcados.set(`${x},${y}`, 'verde'));
  for (const y of fileiras) {
    for (let x = 11; x <= 38; x++) {
      if ([19, 20, 29, 30].includes(x)) continue;
      if (y === 18 && x > 38) continue;
      const tipo = marcados.get(`${x},${y}`) ?? 'verde';
      const nome = tipo === 'maduro' ? 'pe_cafe_maduro' : 'pe_cafe_verde';
      // fileira 26 encosta no limite do mapa: só decorativa
      m.bloco('objetos', x, y, E, nome);
    }
  }
  // corredores horizontais aparecem como terra
  // toco, cesto e a clareira
  m.put('objetos', 5, 20, E, 'toco');
  m.put('objetos', 5, 22, E, 'cesto');
  m.put('objetos', 7, 18, E, 'arbusto');
  m.put('objetos', 3, 17, E, 'arbusto_frutas');
  m.bloco('objetos', 2, 11, E, 'arvore_1');
  m.bloco('objetos', 6, 11, E, 'arvore_2');
  m.bloco('objetos', 3, 25, E, 'arvore_2');
  m.put('chao2', 8, 24, E, 'capim_1');
  m.put('chao2', 3, 21, E, 'capim_2');
  // mirante a oeste: banco virado para o vale e cerca baixa
  m.bloco('objetos', 3, 14, E, 'banco');
  for (let x = 2; x <= 8; x++) m.put('objetos', x, 13, E, 'cerca_h');
  // barracão e balança da Zefa (leste)
  const T = m.ind(E, 'telhado_palha');
  const PM = m.ind(E, 'parede_madeira');
  for (let x = 0; x < 7; x++) {
    const c = x === 0 ? 0 : x === 6 ? 2 : 1;
    m.put('objetos', 41 + x, 7, E, T[0][c]);
    m.put('objetos', 41 + x, 8, E, T[1][c]);
    m.put('objetos', 41 + x, 9, E, PM[0][c]);
    m.put('objetos', 41 + x, 10, E, PM[1][c]);
  }
  m.bloco('objetos', 43, 9, E, 'portao_barracao');
  m.bloco('objetos', 45, 12, E, 'sacas');
  m.bloco('objetos', 41, 12, E, 'carroca_sacas');
  m.bloco('objetos', 44, 16, E, 'balanca');
  m.put('objetos', 47, 15, E, 'caixote');
  m.put('objetos', 47, 18, E, 'cesto_cheio');
  m.put('objetos', 40, 14, E, 'placa_poste');
  m.bloco('objetos', 46, 20, E, 'lampiao');

  // marcadores
  m.marcador('marcador_cafezal_inicio', 6, 21);
  m.marcador('marcador_cafezal_tonho', 12, 20);
  m.marcador('marcador_cafezal_balanca', 43, 17);
  m.marcador('marcador_cafezal_balanca_tonho', 43, 18);
  m.marcador('marcador_cafezal_zefa', 46, 17);
  m.marcador('marcador_cafezal_vista_vila', 25, 7);

  // personagens e interativos
  m.npc('tonho', 13, 20, { dialogue: 'prologo_02_tonho_tutorial', facing: 'left' });
  m.npc('zefa', 46, 17, { dialogue: 'prologo_04_zefa', alt_dialogue: 'prologo_06_colheita_fim', alt_if: 'prologo.colheita_completa', facing: 'left' });
  m.examinar('cesto_icaro', 5, 22, { dialogue: 'prologo_05_livro' });
  m.zona('gatilho_abertura', 'gatilho', 5, 21, 1, 1, { dialogue: 'prologo_01_abertura', activation: 'load' });
  maduros.forEach(([x, y], i) =>
    m.examinar(`pe_cafe_maduro_${i + 1}`, x, y, { dialogue: 'prologo_03_pe_de_cafe', counter: 'prologo.colheita', counter_goal: 5, counter_flag: 'prologo.colheita_completa', glow: true }, 1, 2),
  );
  verdes.forEach(([x, y], i) => m.examinar(`pe_cafe_verde_${i + 1}`, x, y, { dialogue: 'prologo_03b_pe_verde' }, 1, 2));
  return m;
}

// ------------------------------------------------------------------ estrada
export function estrada() {
  const E = E_TARDE;
  const m = new Mapa('prologo_estrada', 60, 14, [E, PAN], { nome: 'Estrada de Valesol', music: 'tema_tensao' });
  const r = rng(202);
  m.encher('chao', 0, 0, 60, 14, E, sorteio(r, ['grama_1', 'grama_1', 'grama_2', 'grama_3', 'grama_flores_2']));
  for (const x of [0, 20, 40]) m.bloco('chao', x, 0, PAN, 'pan_ceu_tarde');
  m.encher('chao', 0, 7, 60, 4, E, sorteio(r, ['terra_1', 'terra_1', 'terra_2']));
  // cercas dos dois lados e porteira do pasto
  m.encher('objetos', 0, 6, 60, 1, E, 'cerca_h');
  m.encher('objetos', 0, 11, 60, 1, E, 'cerca_h');
  m.bloco('objetos', 40, 6, E, 'porteira');
  // pasto: árvores, arbustos e capim
  for (const x of [4, 12, 19, 33, 47, 55]) m.bloco('objetos', x, 3, E, 'arvore_1');
  for (const x of [9, 26, 38, 51]) m.put('objetos', x, 5, E, 'arbusto');
  for (const x of [6, 16, 22, 31, 44, 53]) m.put('chao2', x, 4, E, 'capim_1');
  for (const x of [8, 18, 30, 42, 50]) m.put('objetos', x, 12, E, 'arbusto');
  for (const x of [3, 14, 27, 36, 48, 57]) m.put('chao2', x, 13, E, 'capim_2');
  m.bloco('objetos', 24, 12, E, 'arvore_2');
  // mata-burro cruzando a estrada
  for (let y = 7; y <= 10; y++) m.bloco('objetos2', 26, y, E, 'mata_burro');
  // postes de luz do fim de tarde
  m.bloco('objetos', 52, 11, E, 'lampiao');
  m.bloco('objetos', 14, 11, E, 'lampiao');
  // marcadores
  m.marcador('marcador_estrada_inicio', 57, 9);
  m.marcador('marcador_estrada_encontro', 28, 8);
  m.marcador('marcador_estrada_fugitivos_a', 6, 8);
  m.marcador('marcador_estrada_fugitivos_b', 4, 9);
  m.marcador('marcador_estrada_saida_pasto', 40, 4);
  m.marcador('marcador_estrada_fim', 2, 8);
  // personagens e gatilhos
  m.npc('tonho', 40, 8, { facing: 'right' });
  m.zona('gatilho_estrada_inicio', 'gatilho', 57, 8, 1, 2, { dialogue: 'prologo_07_estrada', activation: 'load' });
  m.zona('gatilho_estrada_fugitivos', 'gatilho', 34, 7, 1, 4, { dialogue: 'prologo_07b_estrada_fugitivos' });
  m.zona('saida_estrada_vila', 'saida', 0, 7, 2, 4, { map: 'prologo_vila', entry: 'marcador_vila_entrada', facing: 'left' });
  return m;
}

// ------------------------------------------------------------------ túnel
export function tunel() {
  const m = new Mapa('prologo_tunel', 40, 12, [TUN], { nome: 'O rego seco', music: 'tema_tunel', escuro: true, luz_raio: 56 });
  const r = rng(303);
  const W = 40;
  const H = 12;
  const piso = new Set();
  const retas = [
    [2, 5, 14, 3], // trecho 1 (x,y,w,h)
    [12, 7, 3, 4], // desce
    [12, 8, 15, 3], // trecho 2
    [24, 3, 3, 8], // sobe
    [24, 3, 15, 3], // trecho 3 até a saída
    [8, 3, 2, 3], // reentrância do brinquedo
  ];
  for (const [x, y, w, h] of retas) for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) piso.add(`${i},${j}`);
  const livre = (x, y) => piso.has(`${x},${y}`);
  m.encher('chao', 0, 0, W, H, TUN, 'pedra_1'); // fundo (sob a rocha)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (livre(x, y)) {
      m.put('chao', x, y, TUN, ['pedra_1', 'pedra_1', 'pedra_2', 'pedra_3'][Math.floor(r() * 4)]);
    } else {
      m.put('objetos', x, y, TUN, 25); // rocha cheia
    }
  }
  // paredes: rocha_face (2 linhas) acima de cada trecho de piso
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!livre(x, y) || livre(x, y - 1)) continue;
    // a linha y-1 e y-2 (se forem rocha) mostram a face da parede
    const c = !livre(x - 1, y) ? 0 : !livre(x + 1, y) ? 2 : 1;
    const face = m.ind(TUN, 'rocha_face');
    if (y - 2 >= 0 && !livre(x, y - 2)) m.put('objetos', x, y - 2, TUN, face[0][c]);
    if (y - 1 >= 0) m.put('objetos', x, y - 1, TUN, face[1][c]);
  }
  // detalhes: poças, raízes, goteiras, canaleta
  for (const [x, y] of [[6, 7], [18, 10], [30, 4], [10, 9]]) if (livre(x, y)) m.put('chao2', x, y, TUN, 'poca');
  for (const [x, y] of [[5, 6], [16, 9], [27, 5], [34, 4]]) if (livre(x, y)) m.put('chao2', x, y, TUN, 'goteira_1');
  for (const [x, y] of [[8, 7], [20, 9], [31, 5]]) if (livre(x, y)) m.put('chao2', x, y, TUN, 'raiz_chao');
  for (let x = 14; x < 22; x++) if (livre(x, 10)) m.put('chao2', x, 10, TUN, 'canaleta_M');
  for (const [x, y] of [[3, 5], [15, 8], [25, 3]]) if (livre(x, y)) m.put('acima', x, y, TUN, 'raiz_pendente');
  for (const [x, y] of [[13, 6], [26, 10], [36, 5]]) if (livre(x, y)) m.put('objetos', x, y, TUN, 'pedras_soltas');
  m.put('chao2', 2, 6, TUN, 'escada_saida');
  m.put('chao2', 9, 3, TUN, 'cavalinho_sabugo');
  // marcadores
  m.marcador('marcador_tunel_inicio', 3, 6);
  m.marcador('marcador_tunel_brinquedo', 9, 3);
  m.marcador('marcador_tunel_fim', 37, 4);
  m.zona('gatilho_tunel_inicio', 'gatilho', 3, 6, 1, 1, { dialogue: 'prologo_15_tunel_inicio', activation: 'load' });
  m.examinar('exame_brinquedo', 9, 3, { dialogue: 'prologo_15b_tunel_brinquedo' });
  m.zona('saida_tunel', 'saida', 38, 3, 1, 3, { map: 'prologo_bambuzal', entry: 'marcador_bambuzal_entrada', facing: 'right' });
  return m;
}

// ------------------------------------------------------------------ bambuzal
export function bambuzal() {
  const E = E_NOITE;
  const m = new Mapa('prologo_bambuzal', 40, 24, [E, PAN], { nome: 'Bambuzal', music: 'tema_noite_esperanca' });
  const r = rng(404);
  m.encher('chao', 0, 0, 40, 24, E, sorteio(r, ['folhas_1', 'folhas_1', 'folhas_2', 'grama_1']));
  // mirante: a capital ao longe
  m.bloco('chao', 10, 0, PAN, 'pan_capital');
  m.encher('objetos', 0, 0, 10, 7, E, 'bambu_denso');
  m.encher('objetos', 30, 0, 10, 7, E, 'bambu_denso');
  // moldura de bambu
  m.encher('objetos', 0, 22, 40, 2, E, 'bambu_denso');
  m.encher('objetos', 38, 0, 2, 24, E, 'bambu_denso');
  m.encher('objetos', 0, 0, 1, 24, E, 'bambu_denso');
  m.encher('objetos', 10, 7, 20, 1, E, 'barranco_M');
  // bambus soltos pelo bosque e entre o acampamento
  for (const [x, y] of [[3, 9], [5, 18], [8, 20], [14, 9], [24, 10], [32, 9], [34, 18], [28, 20], [18, 20], [2, 12], [12, 19]]) m.bloco('objetos', x, y, E, 'bambu');
  for (const [x, y] of [[6, 10], [31, 12], [33, 14], [22, 9]]) m.put('objetos', x, y, E, 'arbusto');
  // boca do túnel (esquerda): corredor escuro de pedra sob o morro
  m.encher('objetos', 1, 12, 1, 5, E, 'barranco_L');
  m.encher('chao', 1, 14, 3, 1, E, 'terra_2');
  m.put('objetos', 1, 14, E, 'alcapao_aberto');
  // acampamento: fogueira coberta no centro, trouxas, cobertores, bancos
  m.put('objetos', 21, 14, E, 'fogueira_coberta');
  m.encher('chao', 17, 11, 9, 8, E, 'terra_2');
  m.mancha('chao2', 17, 11, 9, 8, E, 'borda_terra');
  m.bloco('objetos', 18, 16, E, 'banco');
  m.bloco('objetos', 23, 11, E, 'banco');
  for (const [x, y] of [[17, 13], [25, 15], [26, 12], [16, 17], [27, 17], [14, 12]]) m.put('objetos', x, y, E, 'trouxa');
  for (const [x, y] of [[15, 15], [24, 17], [20, 11]]) m.put('chao2', x, y, E, 'cobertor');
  m.bloco('objetos', 13, 17, E, 'carroca_sacas');
  // marcadores
  m.marcador('marcador_bambuzal_entrada', 4, 14);
  m.marcador('marcador_bambuzal_saida', 8, 14);
  m.marcador('marcador_bambuzal_soldado_1', 11, 12);
  m.marcador('marcador_bambuzal_sargento', 17, 11);
  m.marcador('marcador_bambuzal_sargento_frente', 10, 14);
  m.marcador('marcador_bambuzal_sargento_lado', 10, 15);
  m.marcador('marcador_bambuzal_custodia', 15, 18);
  m.marcador('marcador_bambuzal_custodia_frente', 9, 16);
  m.marcador('marcador_bambuzal_tonho', 22, 18);
  m.marcador('marcador_bambuzal_tonho_frente', 7, 16);
  m.marcador('marcador_bambuzal_nina', 23, 18);
  m.marcador('marcador_bambuzal_nina_frente', 8, 16);
  m.marcador('marcador_bambuzal_vista_capital', 20, 7);
  // personagens (ids estáveis do roteiro)
  m.npc('soldado_1', 11, 12, { facing: 'down' });
  m.npc('sargento', 17, 11, { facing: 'left' });
  m.npc('custodia', 15, 18, { facing: 'right' });
  m.npc('tonho', 22, 18, { facing: 'left' });
  m.npc('nina', 23, 18, { facing: 'left' });
  m.npc('sobrevivente_1', 19, 14, { facing: 'right' });
  m.npc('sobrevivente_2', 24, 13, { facing: 'left' });
  m.npc('figurante_1', 26, 16, { facing: 'left' });
  m.npc('figurante_2', 17, 15, { facing: 'right' });
  m.npc('figurante_3', 29, 14, { facing: 'down' });
  m.zona('gatilho_bambuzal', 'gatilho', 4, 14, 1, 1, { dialogue: 'prologo_16_sobreviventes', activation: 'load' });
  return m;
}
