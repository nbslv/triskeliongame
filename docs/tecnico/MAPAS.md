# Mapas (Tiled)

Arquivos: `content/maps/<id>.json`, exportados do [Tiled](https://www.mapeditor.org/) em **JSON**.
`npm test` valida todos os mapas (`src/systems/world/tiled.ts → validateMap`).

## Regras gerais

- Orientação **ortogonal**, tiles **16×16**, mapa **finito**.
- Tilesets **embutidos** no mapa (no Tiled: *Map → Embed Tileset*). Tilesets externos (`.tsx`) não funcionam.
- A imagem do tileset vem de `assets/tilesets/<nome do tileset>.png` (o nome do tileset no Tiled = nome do
  arquivo). Sem o arquivo, o motor usa o tileset provisório `assets/tilesets/placeholder.png`
  (16 tiles: grama, terra, muro, água, madeira, arbusto, barril, árvore, telhado, parede, porta, flores,
  cerca, fogo, cinzas, escuro — nessa ordem, 8 por linha).
- Propriedades de mapa (*Map → Map Properties*):
  - `nome` (string): nome exibido no save/menu.
  - `music` ou `musica` (string): id da música ao entrar no mapa.

## Camadas de tiles

Qualquer quantidade, desenhadas na ordem do Tiled.

| Propriedade | Onde | Efeito |
|---|---|---|
| `collides` (bool) | **tile** do tileset | Tile sólido. (Também aceita `colisao`.) |
| `hide` (bool) | **tile** do tileset | Esconderijo: jogador com os pés neste tile fica invisível aos inimigos (arbustos, barris). Também aceita `esconderijo`. |
| `collides` (bool) | **camada** | Todo tile não vazio da camada é sólido. |
| `above` (bool) | **camada** | Desenhada por cima dos personagens (copas de árvore, telhados). Camadas com nome começando em `acima`/`above`/`topo` também. |

## Camadas de objetos

Os objetos são identificados pela **classe** (campo *Class*/*Type* no Tiled). Podem ficar em qualquer
camada de objetos; por organização usamos `entidades` e `markers`.

### `markers` (obrigatória)

Objetos **ponto** com nome único. Usados como:
- ponto de entrada no mapa (`content/jogo.json → startMarker`, propriedade `entry` das saídas, `scene.at`),
- destino de `move`, `camera`, `spawn`, `face` nos roteiros (`"to": "nome_do_marcador"`).

Qualquer objeto da camada `markers` é marcador (classe opcional `marcador`/`marker` em outras camadas).

### Classes de objeto

Todas aceitam `requires` / `unless` (condição de flags, ver DIALOGO.md): o objeto só existe no mapa se
`requires` for verdadeira e `unless` for falsa (avaliado ao entrar no mapa).

| Classe | Forma | Propriedades | Efeito |
|---|---|---|---|
| `npc` | ponto | **nome** = id do ator; `dialogue` (id do roteiro), `alt_dialogue?` + `alt_if?`, `sprite?`, `facing?` (`down`…) | Personagem sólido. A perto + de frente → roda `dialogue` (ou `alt_dialogue` quando a condição `alt_if` for verdadeira), com `self` = este NPC. |
| `examinar` | retângulo ou ponto | `dialogue`, `alt_dialogue?`/`alt_if?`, `once?` (false), `used_dialogue?`, `glow?`, `counter?`/`counter_goal?`/`counter_flag?`, `activity?` + `param_*` | Objeto examinável com A (cartas, retratos, baús...). Ponto vira área de 1 tile. `glow` desenha um brilho até ser usado. **Contador**: cada objeto soma 1 na flag `counter` uma única vez; ao chegar em `counter_goal`, marca `counter_flag` (ex.: colheita do prólogo: `counter: prologo.colheita`, `counter_goal: 5`, `counter_flag: prologo.colheita_completa`, `glow: true`). Com `activity`, abre uma atividade (ver ARQUITETURA.md). Aliases de classe: `examinavel`, `inspect`, `interativo`, `atividade`. |
| `inimigo` | ponto **ou** polilinha/polígono | **nome** = id; `route?` (nome de polilinha/polígono), `sprite?` (padrão `caligosuin`), `speed?` (40 px/s), `vision?` (80 px), `angle?` (70°), `wait?` (700 ms em cada ponto), `mode?` (`loop`/`pingpong`), `turn?` (ms; sem rota, gira 90° a cada N ms), `facing?` | Patrulha a rota (polígono = volta em laço; polilinha = vai e volta). Desenha o cone de visão no chão, cortado por paredes. Se vir o jogador (ou encostar nele), tela escurece e o jogador volta ao último checkpoint. |
| `rota` | polilinha/polígono | **nome** | Caminho referenciado por `route` de um inimigo. Movimento é por eixos (primeiro o maior), então rotas retas ficam melhores. |
| `esconderijo` | retângulo | — | Área de esconderijo (alternativa a tiles com `hide`). |
| `gatilho` | retângulo | `dialogue` (aceita lista `"a,b,c"` = roteiros encadeados), `alt_dialogue?`/`alt_if?`, `activation?` (`touch` padrão / `interact` / `load`), `once?` (padrão `true`), `flag?` | Roda o roteiro ao entrar na área, ao apertar A (`interact`) ou assim que o mapa carrega (`load`, ex.: `gatilho_inicio`). Com `once`, grava a flag `gatilho.<mapa>.<nome>` (ou a de `flag`) e não dispara mais. Para "repetível só sem flag X": `once: false` + `unless: X`. |
| `saida` (ou `porta`) | retângulo | `map` (id do mapa), `entry?` (marcador no destino), `facing?`, `return?`, `locked_if?`, `locked_dialogue?` | Ao entrar: fade e troca de mapa. Ver **Interiores** abaixo. |
| `checkpoint` | retângulo | `autosave?` (padrão `true`) | Ao entrar: vira o ponto de retorno da furtividade (e faz autosave). Entrar num mapa também cria checkpoint. |

Mapa escuro (túnel): propriedades de mapa `escuro: true` e `luz_raio` (px, padrão 56) desenham um
círculo de luz em volta do jogador. O passo `light` dos roteiros muda o raio (0 = breu).

Patrulha por marcadores: em vez de polilinha, `route: "patrulha_a1"` usa os marcadores
`patrulha_a1_p1`, `patrulha_a1_p2`, ... em ordem (vai e volta; `mode: loop` para circular).

Aliases em inglês aceitos: `enemy`, `route`, `hide`, `trigger`, `exit`, `marker`. Nomes de propriedade em
português também: `dialogo`, `rota`, `velocidade`, `visao`, `angulo`, `espera`, `modo`, `girar`, `direcao`,
`mapa`, `entrada`, `ativacao` (`interagir`), `unica`, `requer`, `exceto`.

### Coordenadas

- Ponto de um ator = **pés** do personagem.
- Tile `[x, y]` dos roteiros = centro do tile `(x*16+8, y*16+15)`.

## Interiores de casas (padrão)

Cada interior é um mapa próprio (`content/maps/<casa>.json`), pequeno, com uma ou várias salas.

1. **Porta de fora** (no mapa da vila): objeto `saida` de 1 tile em frente à porta, com
   `map: "<casa>"`, `entry: "<marcador dentro, logo após a porta>"`, `facing: "up"`.
2. **Porta de dentro**: objeto `saida` sobre a soleira com `return: true` — o jogador volta exatamente
   ao ponto de onde entrou (um passo antes da porta, virado para fora). Como reserva (save antigo, ou
   entrou por roteiro), informe também `map` + `entry` com um marcador **na frente da porta, do lado de fora**.
3. **Porta trancada por flag**: `locked_if: "!prologo.cafe_com_pai"` + `locked_dialogue: "prologo_00c_porta_sem_cafe"`.
   Enquanto a condição for verdadeira, o jogador é empurrado de volta e o diálogo roda.
4. **Moradores**: objetos `npc` no interior (podem usar `requires`/`unless` para aparecer só em certos momentos).
5. **Objetos que contam história**: `examinar` com `dialogue`.
6. A transição tem fade automático; a música do interior vem da propriedade `music` do mapa.

Exemplo completo: `content/maps/teste_casa.json` (dois cômodos, moradora, retrato, baú com `alt_dialogue`),
ligado à casa de `teste.json` (porta trancada até falar com o aldeão).

## Exemplo

`content/maps/teste.json` (gerado por `scripts/gerar-mapas-teste.mjs`) tem um NPC, um Caligosuin patrulhando
um polígono, uma sentinela girando, arbustos/barris (tiles `hide`), uma área `esconderijo`, um checkpoint,
um gatilho de cutscene, 3 pés para colher (contador com brilho), a porta da casa (`teste_casa`) e uma saída
para `teste2` (que tem uma atividade de teste e a passagem para o túnel escuro `teste_tunel`).
Abra no Tiled para ver as propriedades.
