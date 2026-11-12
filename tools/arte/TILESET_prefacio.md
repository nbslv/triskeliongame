# Guia de tiles do prólogo

> Gerado por `python3 tools/arte/gerar_tilesets.py` (o texto de abertura vem de
> `tools/arte/TILESET_prefacio.md`). **Não edite este arquivo à mão.**

Para a sessão de mapas. Todos os tiles são 16×16, sem margem nem espaçamento.

## Como usar no Tiled

1. **Tilesets embutidos.** Cada tileset tem um JSON pronto em `docs/arte/tilesets/<nome>.json`, já com
   as propriedades `collides` e `hide` por tile. Copie o objeto para a lista `tilesets` do mapa e
   acrescente `"firstgid"` (1 para o primeiro; para os seguintes, `firstgid` anterior + `tilecount` anterior).
   O nome do tileset tem de ser igual ao do arquivo em `assets/tilesets/`.
2. **Índice → gid.** Os índices deste guia começam em 0. No mapa, `gid = firstgid + índice`.
   Para scripts, `docs/arte/tilesets/<nome>.indices.json` traz `nome → índice` (ou matriz de índices,
   linha por linha, para blocos maiores que 1×1).
3. **Blocos.** Um bloco "3×2" ocupa 3 colunas × 2 linhas contíguas no tileset; a coluna "Índices" mostra a
   matriz na mesma disposição em que deve ir para o mapa.
4. **Camadas sugeridas** (de baixo para cima):

   | Camada | Conteúdo |
   |---|---|
   | `chao` | Terreno opaco: grama, terra, pisos, panoramas. |
   | `chao2` | Transições (`borda_*`), tapetes, manchas, brasas, luz no chão: tiles com transparência. |
   | `objetos` | Paredes, móveis, cercas, troncos, a parte de baixo de objetos altos. Colisão vem do tile. |
   | `objetos2` | Opcional: o que fica por cima de outro objeto (chaminé no telhado, placa, toldo). |
   | `acima` | O que cobre o jogador: copas, topo de lampiões/bandeiras/carroças, fumaça, cinzas. O nome deve começar com `acima`. |

   Na coluna "Uso", "Camada `acima`: ■■ / ·· " indica quais tiles do bloco (■) vão na camada `acima`;
   o resto vai em `objetos`. A coluna "Sólido" mostra do mesmo jeito quais tiles colidem.
5. **Esconderijos.** Tiles marcados **`hide`** (arbustos) escondem o jogador que pisa neles. Carroças, barris,
   sacas e muretas são sólidos: desenhe um objeto `esconderijo` (retângulo) no chão ao lado/atrás deles.

## Dia, tarde e noite: a mesma planta

`tiles_exterior` tem três imagens com **exatamente os mesmos índices**: `tiles_exterior` (manhã),
`tiles_exterior_tarde` (luz dourada do cafezal e da estrada) e `tiles_exterior_noite` (vila em chamas e
bambuzal). O mesmo vale para `tiles_interior` / `tiles_interior_noite`.

Para fazer `prologo_vila` a partir de `prologo_vila_manha`: copie o mapa, troque o nome/imagem do tileset
para a variação `_noite` e depois troque só os tiles que mudam (telhado → `telhado_queimado`, parede →
`parede_queimada`, janela → `janela_fogo`, lampião → `lampiao_derretido`, carroça → `carroca_queimada`…),
some o fogo de `tiles_fogo` e as bandeiras. As cores de fogo, brasa e luz **não escurecem** na variação
de noite, então elas "acendem" a cena. A casa de Ícaro em ruína usa o piso e os móveis de
`tiles_interior_noite` cercados por `ruina_parede`, com a `viga_caida` no meio.

Mapa → tilesets:

| Mapa | Tilesets |
|---|---|
| `prologo_casa_icaro`, `prologo_casa_custodia`, `prologo_padaria`, `prologo_biblioteca` | `tiles_interior` (+ `tiles_exterior` no terreiro da casa de Ícaro) |
| `prologo_vila_manha` | `tiles_exterior` |
| `prologo_cafezal` | `tiles_exterior_tarde`, `tiles_panorama` |
| `prologo_estrada` | `tiles_exterior_tarde`, `tiles_panorama` (céu) |
| `prologo_vila` | `tiles_exterior_noite`, `tiles_interior_noite`, `tiles_fogo` |
| `prologo_tunel` | `tiles_tunel` |
| `prologo_bambuzal` | `tiles_exterior_noite`, `tiles_panorama` |

## Receitas

**Casa (5 de largura):** veja `docs/arte/capturas/mock_vila_dia.png`.

```
T T T T T     T = telhado (bloco 3×3: repita a coluna do meio)
T T T T T
T T T T T
P J D S P     P = parede linha de cima (L, M…, R); J = janela; S = placa; D = porta (tile de cima)
P P D P P     P = parede linha de baixo; D = porta (tile de baixo)
```

**Sala interna:** `moldura` em volta, duas linhas de `parede_fundo`, piso, e uma `soleira` na moldura de baixo
(veja `docs/arte/capturas/mock_casa_icaro.png`).

**Caminho/praça:** pinte o chão base em `chao` e a mancha com o bloco `borda_*` em `chao2`
(cantos nos cantos, lados nos lados, centro no miolo; `borda_*_int` nas curvas para dentro).

Exemplos montados só com estes tiles: `docs/arte/capturas/mock_*.png`.

## Estabilidade dos índices

Os índices não mudam: tiles novos entram sempre **no fim** de cada tileset. Se faltar algum tile, peça em
`docs/status/arte.md`.
