# 12 — Prólogo: lista de assets (para a sessão de arte e áudio)

Padrões técnicos (de `docs/COORDENACAO.md`): tiles 16×16; personagens 16×24, 4 direções,
3–4 quadros de caminhada; resolução 640×360; tudo original. Ids abaixo são os usados nos
diálogos (`content/dialogues/prologo_*.json`) — manter exatamente iguais.

Paletas dos personagens principais: ver `02_personagens.md`.

## 1. Sprites de personagens

| Id | Descrição | Animações além de andar (4 direções) |
|---|---|---|
| `icaro` | 18 anos, loiro despenteado, camisa creme de mangas dobradas, colete marrom-café, calça azul desbotada remendada, botina | `esconder_livro`, `colher`, `agachar`, `ajoelhar`, `conjurar`, `conjurar_brilho` (luz morna nas mãos), `erguer_viga`, `encolhido`, `colar_brilho`, `segurar_colar`, correr |
| `tonho` | 18 anos, magro, chapéu de palha torto, camisa verde-oliva, sorriso de dente lascado | correr |
| `zefa` | ~60 anos, baixinha e larga, lenço vermelho na cabeça, avental de lona, mãos na cintura | parada (2 quadros) |
| `pai` | Anselmo, ~60, grisalho, barba por fazer, camisa xadrez desbotada | **só deitado** sob a viga: `parado`, `mostrar_caixa`, `empurrar`, `entregar_caixa` |
| `custodia` | ~65, magrinha, xale lilás, coque, galinha debaixo do braço | andar/correr com a galinha |
| `nina` | 7 anos, duas tranças, vestido amarelo grande demais | andar |
| `sobrevivente_1`, `sobrevivente_2` | Aldeão e aldeã genéricos (2 variações de cor para figurantes) | correr; sentado com cobertor |
| `soldado_1` | Guarda de Luminaer: tabardo branco e dourado, lança, elmo simples | parado, andar |
| `sargento` | Íris Candeia, ~35, pele escura, cabelo curto, tabardo branco/dourado com faixa azul, capa curta | andar |
| `cali_soldado` (usado por `cali_1`…`5`) | Caligosuin soldado — ver seção 2 | andar, `bufar` (fumacinha preta), `espirrar`, `alerta` |
| `toucim` | Capitão Toucim — ver seção 2 | andar, `apontar`, `bronca` |

## 2. Caligosuins — direção visual ("fofo-ameaçador")

- **Forma:** porcos bípedes baixinhos e rechonchudos (cabem em 16×24; Toucim em 16×32),
  pele **cinza-ardósia**, focinho grande rosado-acinzentado, orelhas caídas, olhinhos amarelos
  redondos. **Presas enormes** curvando para cima — é o que impede de serem só fofos.
- **Fogo negro:** fumacinha e labaredas **pretas com borda roxa** saindo do focinho a cada
  respiração (2–3 quadros em laço). Não emite luz; "suja" o que toca.
- **Roupa:** mantos de mago curtos demais, cor vinho-escuro, com capuz de onde saem as orelhas;
  cajadinhos tortos de madeira queimada. Rabo enrolado aparecendo por um buraco no manto.
- **Capitão Toucim:** um pouco maior, uma presa quebrada, ombreira de ferro só de um lado,
  capa vinho com gola alta (alta demais), bandeirinha chamuscada nas costas.
- **Paleta base:** `#6B6F7A` (pele), `#3A3D46` (sombra), `#F2E9D8` (presas), `#5B1F3A` (manto),
  `#1A1423` + `#7B3FA0` (fogo negro e borda), `#FFD23F` (olhos).
- **Cone de visão:** leque translúcido roxo `#7B3FA0` a ~35% de opacidade no chão.

## 3. Retratos (caixa de diálogo, sugestão 64×64)

| Personagem | Ids |
|---|---|
| Ícaro | `icaro_neutro`, `icaro_sorriso`, `icaro_surpreso`, `icaro_medo`, `icaro_choro`, `icaro_determinado` |
| Pai | `pai_ferido` (fuligem, suor, cansaço — **sem sangue**), `pai_sorriso_fraco` |
| Mãe | `mae_silhueta` (contraluz dourada, só o contorno do cabelo e um sorriso) |
| Tonho | `tonho_neutro`, `tonho_riso`, `tonho_medo` |
| Dona Zefa | `zefa_neutro`, `zefa_brava` |
| Dona Custódia | `custodia_neutro`, `custodia_medo` (a galinha aparece no canto do retrato) |
| Nina | `nina_neutro` |
| Aldeões | `aldeao_medo`, `aldea_medo` |
| Guarda | `soldado_neutro`, `sargento_neutro`, `sargento_suave` |
| Caligosuins | `cali_soldado`, `toucim_neutro`, `toucim_bravo` |

Total: 25 retratos.

## 4. Tilesets

| Tileset | Conteúdo |
|---|---|
| `tiles_cafezal` | Terra vermelha, grama, morro em degraus; pé de café (verde, maduro com brilho, colhido); toco; cestos; balança de pesagem; barracão; cerca; céu de entardecer (parallax dourado) |
| `tiles_estrada` | Estrada de terra, cerca de arame, porteira, mata-burro, capim; céu laranja→roxo |
| `tiles_vila` | Casas de pau a pique e telha (inteiras, queimando, em ruína); padaria, venda, biblioteca (com placa); chafariz de pedra; calçamento; carroça; barris; pilhas de sacas de café; mureta; lampião de ferro (inteiro e derretido); bandeira Caligosuin (inteira e chamuscada) |
| `tiles_fogo` | Fogo **negro/roxo** animado (3 quadros), fogo comum alaranjado animado, brasas, fumaça preta, cinzas caindo (partículas) |
| `tiles_casa_icaro` | Chão de tábua, parede com retrato torto, colchão de palha com livros embaixo, fogão a lenha, mesa; viga caída em brasa; telhado desabado; porta dos fundos; terreiro de secar café; alçapão |
| `tiles_tunel` | Pedra úmida, raízes, canaleta seca, teias; cavalinho de sabugo; máscara de escuridão com círculo de luz |
| `tiles_bambuzal` | Bambus (frente e fundo), chão de folhas, fogueira coberta, cobertores, trouxas; fundo noturno com a **capital ao longe**: muralha, clarões brancos e roxos nos portões, torre alta com um ponto de luz |

## 5. Objetos e ícones

- `caixa_costura` (fechada, aberta, `piscar`), `barril_custodia` (fechado, `abrir` com a
  cabeça dela e a galinha), livro de Ícaro, cesto cheio/vazio.
- Ícones de item (16×16): **Colar da Mãe** (cordão + pedrinha opaca cinza-rosada),
  **Rapadura Amassada**, moeda de cobre.
- Emotes (balão 16×16 sobre a cabeça): `exclamacao`, `interrogacao`, `reticencias`, `suor`.
- Cartão de título **TRISKELION** com o símbolo das três espirais bem discreto ao fundo.

## 6. Música (laços curtos, originais)

| Id | Onde | Clima |
|---|---|---|
| `tema_lenda` | Narração de abertura | Caixinha de música + cordas, solene e curto |
| `tema_cafezal` | Cena 1 | Violão/viola, assobiável, sol de fim de tarde |
| `tema_tensao` | Fumaça, estrada, "eles tão descendo a rua" | Pulso grave, urgente |
| `tema_vila_em_chamas` | Furtividade | Tenso mas contido; um fagote/tuba cômico para os Caligosuins |
| `tema_pai` | Cena 4 | A melodia do `tema_cafezal`, lenta, em piano |
| `tema_mae` | Flashback (4 s) | Caixinha de música; **é o leitmotiv do triskelion**, reaparece no jogo todo |
| `tema_tunel` | Cena 5 | Quase silêncio; uma nota sustentada e goteira |
| `tema_noite_esperanca` | Cena 6 | Violão suave, grilos |
| `tema_triskelion` | Cartão de título | Tema principal do jogo (cresce a partir do `tema_mae`) |

## 7. Efeitos sonoros

**Cafezal:** `passaros_tarde`, `livro_fechando`, `colher_cafe`, `cesto_balanca`, `moedas`,
`passaros_fugindo`, `sino_vila`.
**Vila:** `fogo_crepitar` (laço), `cali_bufo`, `cali_espirro`, `cali_alerta`,
`cali_grunhidos_longe`, `cali_grunhidos_perto`, `galinha`, `madeira_estalando`.
**Casa:** `madeira_rangendo`, `magia_brilho_fraco`, `magia_falha`, `brilho_colar`, `empurrao`,
`caixa_abrindo`, `item_obtido`, `alcapao`.
**Túnel e bambuzal:** `passos_acima_abafados`, `porta_arrombada_abafada`, `grilos` (laço),
`trovao_magico_longe`.
**Interface:** avanço de texto, confirmar, cancelar, "bip" de fala (um tom por personagem:
grave para o pai, agudo para a Nina, ronquinho para os Caligosuins).

Total: 27 efeitos de cena + interface.
