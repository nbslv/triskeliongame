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
| `npc` | ponto | **nome** = id do ator; `dialogue` (id do roteiro), `sprite?`, `facing?` (`down`…) | Personagem sólido. A perto + de frente → roda `dialogue` (com `self` = este NPC). |
| `inimigo` | ponto **ou** polilinha/polígono | **nome** = id; `route?` (nome de polilinha/polígono), `sprite?` (padrão `caligosuin`), `speed?` (40 px/s), `vision?` (80 px), `angle?` (70°), `wait?` (700 ms em cada ponto), `mode?` (`loop`/`pingpong`), `turn?` (ms; sem rota, gira 90° a cada N ms), `facing?` | Patrulha a rota (polígono = volta em laço; polilinha = vai e volta). Desenha o cone de visão no chão, cortado por paredes. Se vir o jogador (ou encostar nele), tela escurece e o jogador volta ao último checkpoint. |
| `rota` | polilinha/polígono | **nome** | Caminho referenciado por `route` de um inimigo. Movimento é por eixos (primeiro o maior), então rotas retas ficam melhores. |
| `esconderijo` | retângulo | — | Área de esconderijo (alternativa a tiles com `hide`). |
| `gatilho` | retângulo | `dialogue`, `activation?` (`touch` padrão / `interact`), `once?` (padrão `true`), `flag?` | Roda o roteiro ao entrar na área (ou ao apertar A dentro/de frente, se `interact`). Com `once`, grava a flag `gatilho.<mapa>.<nome>` (ou a informada em `flag`) e não dispara mais. |
| `saida` | retângulo | `map` (id do mapa), `entry?` (marcador no mapa de destino), `facing?` | Ao entrar: escurece e troca de mapa. |
| `checkpoint` | retângulo | `autosave?` (padrão `true`) | Ao entrar: vira o ponto de retorno da furtividade (e faz autosave). Entrar num mapa também cria checkpoint. |

Aliases em inglês aceitos: `enemy`, `route`, `hide`, `trigger`, `exit`, `marker`. Nomes de propriedade em
português também: `dialogo`, `rota`, `velocidade`, `visao`, `angulo`, `espera`, `modo`, `girar`, `direcao`,
`mapa`, `entrada`, `ativacao` (`interagir`), `unica`, `requer`, `exceto`.

### Coordenadas

- Ponto de um ator = **pés** do personagem.
- Tile `[x, y]` dos roteiros = centro do tile `(x*16+8, y*16+15)`.

## Exemplo

`content/maps/teste.json` (gerado por `scripts/gerar-mapas-teste.mjs`) tem um NPC, um Caligosuin patrulhando
um polígono, uma sentinela girando, arbustos/barris (tiles `hide`), uma área `esconderijo`, um checkpoint,
um gatilho de cutscene e uma saída para `teste2`. Abra no Tiled para ver as propriedades.
