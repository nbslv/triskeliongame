# 11 — Prólogo: marcadores e mapas (para a sessão de mapas)

Os diálogos do prólogo usam **marcadores nomeados** em vez de coordenadas. Cada marcador deve
existir como objeto de ponto (camada de objetos do Tiled, `name` = id abaixo) no mapa indicado.
Além dos marcadores citados nos JSON, listo os que a jogabilidade precisa (gatilhos,
checkpoints, patrulhas, examináveis).

## Mapas

| Mapa (id) | Tamanho sugerido (tiles) | Descrição |
|---|---|---|
| `prologo_cafezal` | 50 × 30 | Morro suave, fileiras de café, toco de leitura, balança e barracão da Zefa a leste; mirante a oeste com vista para a vila |
| `prologo_estrada` | 60 × 14 | Estrada de terra, cercas, um mata-burro; entra pela direita, sai pela esquerda |
| `prologo_vila` | 70 × 45 | Rua da Venda → Praça do Chafariz → Rua do Terreiro → casa de Ícaro (ruína aberta, sem troca de mapa) → terreiro de secar café com o alçapão |
| `prologo_tunel` | 40 × 12 | Túnel de pedra e raízes, escuro; uma reentrância com o brinquedo |
| `prologo_bambuzal` | 40 × 24 | Clareira entre bambus, fogueira coberta, sobreviventes; mirante com a capital ao longe |

## Marcadores usados nos diálogos (obrigatórios)

### `prologo_cafezal`
| Marcador | Uso |
|---|---|
| `marcador_cafezal_inicio` | Posição inicial de Ícaro (sentado no toco) |
| `marcador_cafezal_tonho` | Tonho parado (destino do 1º tutorial) |
| `marcador_cafezal_balanca` | Onde Ícaro para em frente à balança |
| `marcador_cafezal_balanca_tonho` | Onde Tonho para ao lado dele |
| `marcador_cafezal_zefa` | Dona Zefa, atrás da balança |
| `marcador_cafezal_vista_vila` | Ponto de câmera: horizonte com a coluna de fumaça |

### `prologo_estrada`
| Marcador | Uso |
|---|---|
| `marcador_estrada_inicio` | Entrada (direita). Ícaro e Tonho surgem aqui |
| `marcador_estrada_encontro` | Meio da estrada: onde os fugitivos param |
| `marcador_estrada_fugitivos_a`, `marcador_estrada_fugitivos_b` | Onde os dois fugitivos aparecem (lado esquerdo) |
| `marcador_estrada_saida_pasto` | Porteira lateral por onde o Tonho sai |
| `marcador_estrada_fim` | Saída (esquerda) → `prologo_vila` |

### `prologo_vila`
| Marcador | Uso |
|---|---|
| `marcador_vila_entrada` | Entrada de Ícaro |
| `marcador_vila_panoramica` | Ponto de câmera: vista geral da vila queimando |
| `marcador_vila_cali_intro_a` → `marcador_vila_cali_intro_b` | Caminho do primeiro Caligosuin |
| `marcador_vila_esconderijo_1` | Atrás da primeira carroça |
| `marcador_vila_esconderijo_praca` | Atrás da mureta, na borda da praça |
| `marcador_vila_praca_centro` | Ponto de câmera: Toucim e dois soldados |
| `marcador_vila_biblioteca` | Ponto de câmera: fachada da biblioteca |
| `marcador_vila_rua_de_cima`, `_b`, `_c` | Topo da Rua do Terreiro: onde Toucim e 2 soldados aparecem na Cena 4 |
| `marcador_casa_pai` | Posição do pai sob a viga (também ponto de câmera) |
| `marcador_casa_ao_lado_pai` | Onde Ícaro se ajoelha |
| `marcador_casa_empurrado` | 2 tiles atrás: para onde Ícaro é empurrado |
| `marcador_casa_viga` | Ponta da viga que Ícaro tenta erguer |
| `marcador_casa_porta_fundos` | Porta dos fundos da casa |
| `marcador_terreiro_alcapao` | Alçapão da adega, no terreiro |

### `prologo_tunel`
| Marcador | Uso |
|---|---|
| `marcador_tunel_inicio` | Onde Ícaro aparece, encolhido |
| `marcador_tunel_brinquedo` | Examinável: cavalinho de sabugo |
| `marcador_tunel_fim` | Gatilho de saída → `prologo_bambuzal` |

### `prologo_bambuzal`
| Marcador | Uso |
|---|---|
| `marcador_bambuzal_entrada` | Boca do túnel, onde Ícaro surge |
| `marcador_bambuzal_saida` | 3 tiles à frente: onde ele para ao ser visto |
| `marcador_bambuzal_soldado_1` | Soldado Dário, de guarda |
| `marcador_bambuzal_sargento`, `marcador_bambuzal_sargento_frente`, `marcador_bambuzal_sargento_lado` | Posição inicial da sargento; em frente a Ícaro; ao lado dela (Ícaro) na fala final |
| `marcador_bambuzal_custodia`, `marcador_bambuzal_custodia_frente` | Dona Custódia: inicial e ao chegar em Ícaro |
| `marcador_bambuzal_tonho`, `marcador_bambuzal_tonho_frente` | Tonho: inicial e ao lado de Ícaro |
| `marcador_bambuzal_nina`, `marcador_bambuzal_nina_frente` | Nina: idem |
| `marcador_bambuzal_vista_capital` | Ponto de câmera: capital ao longe com a torre |

## Marcadores de jogabilidade (não aparecem nos JSON)

### Gatilhos de diálogo (áreas retangulares; propriedade `dialogue` = id; `once` = true salvo indicação)
| Gatilho | Mapa | Dispara |
|---|---|---|
| `gatilho_abertura` | cafezal (ao carregar) | `prologo_01_abertura` |
| `gatilho_estrada_inicio` | estrada (ao carregar) | `prologo_07_estrada` |
| `gatilho_estrada_fugitivos` | estrada, meio | `prologo_07b_estrada_fugitivos` |
| `gatilho_vila_entrada` | vila (ao carregar) | `prologo_08_vila_entrada` |
| `gatilho_vila_praca` | vila, borda da praça | `prologo_10_praca` |
| `gatilho_casa` | vila, soleira da casa | `prologo_12_pai_confissao` → `13` → `14` (encadeados) |
| `gatilho_tunel_inicio` | túnel (ao carregar) | `prologo_15_tunel_inicio` |
| `gatilho_bambuzal` | bambuzal (ao carregar) | `prologo_16_sobreviventes` |

### Interativos (botão A)
| Objeto | Mapa | Diálogo |
|---|---|---|
| `npc_tonho` | cafezal | `prologo_02_tonho_tutorial` |
| `npc_zefa` | cafezal | `prologo_04_zefa`; com `prologo.colheita_completa` → `prologo_06_colheita_fim` |
| `pe_cafe_maduro_1`…`5` | cafezal | `prologo_03_pe_de_cafe` (+1 no contador; some o brilho) |
| `pe_cafe_verde_1`…`3` | cafezal | `prologo_03b_pe_verde` |
| `cesto_icaro` | cafezal, ao lado do toco | `prologo_05_livro` |
| `barril_custodia` | vila, Rua do Terreiro | `prologo_11_custodia` (também funciona como esconderijo) |
| `exame_biblioteca`, `exame_chafariz`, `exame_padaria`, `exame_saca_cafe` | vila | `prologo_exame_*` |
| `exame_retrato`, `exame_colchao` | casa | `prologo_exame_retrato`, `prologo_exame_colchao` |
| `exame_brinquedo` | túnel | `prologo_15b_tunel_brinquedo` |

### Furtividade (mapa `prologo_vila`)
| Marcador | Uso |
|---|---|
| `checkpoint_entrada` | Ponto seguro do trecho A (= `marcador_vila_esconderijo_1`) |
| `checkpoint_praca` | Ponto seguro do trecho B (= `marcador_vila_esconderijo_praca`) |
| `checkpoint_beco` | Ponto seguro do trecho C (beco da padaria, início da Rua do Terreiro) |
| `esconderijo_*` (≈ 10) | Áreas de esconderijo: propriedade `tipo` = `carroca` / `barril` / `sacas` / `mureta` |
| `patrulha_a1_p1…p2` | Trecho A: 1 Caligosuin, vai e volta na Rua da Venda |
| `patrulha_b1_p1…p4`, `patrulha_b2_p1…p4` | Trecho B: 2 Caligosuins em volta do chafariz, sentidos opostos |
| `posto_toucim` | Trecho B: Toucim parado; cone gira 90° a cada 4 s |
| `patrulha_c1_p1…p3`, `patrulha_c2_p1…p3` | Trecho C: 2 patrulhas cruzadas |

Regras completas de furtividade: `10_prologo_roteiro.md`, Cena 3.

## Atores (ids estáveis)

| Id | Quem | Mapas |
|---|---|---|
| `icaro` | Protagonista | todos |
| `tonho` | Colega de colheita | cafezal, estrada, bambuzal |
| `zefa` | Capataz do cafezal | cafezal |
| `sobrevivente_1`, `sobrevivente_2` | Moradores fugindo (homem, mulher) | estrada; figurantes no bambuzal |
| `cali_1` … `cali_5`, `cali_soldado` (genérico) | Soldados Caligosuins | vila |
| `toucim` | Capitão Toucim | vila |
| `custodia` | Dona Custódia (+ galinha Pamonha no colo) | vila (no barril), bambuzal |
| `pai` | Anselmo | vila (casa) |
| `mae` | Helena — só voz/silhueta no flashback | — |
| `soldado_1` | Soldado Dário | bambuzal |
| `sargento` | Sargento Íris Candeia | bambuzal |
| `nina` | Irmã do Tonho (7 anos) | bambuzal |
| `caixa_costura`, `barril_custodia` | Objetos com animação | vila |
