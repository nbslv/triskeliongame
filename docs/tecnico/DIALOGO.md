# Roteiros de diálogo e cutscene

Arquivos: `content/dialogues/<id>.json`. O nome do arquivo **é** o id (o campo `id` deve ser igual).
O motor valida tudo ao iniciar e no `npm test` (esquema em `src/systems/dialogue/schema.ts`).
Objetos são **estritos**: campo com nome errado (ex.: `"txt"`) é erro, para pegar erros de digitação.

```json
{
  "id": "prologo_exemplo",
  "description": "Comentário livre (ignorado pelo jogo).",
  "steps": [
    { "type": "say", "speaker": "pai", "portrait": "pai_ferido", "text": "Ícaro... você veio." },
    { "type": "end" }
  ]
}
```

## Conceitos

- **Atores**: `icaro` (o jogador; id configurável em `content/jogo.json` → `playerId`; `player`/`jogador`
  também funcionam), NPCs e inimigos do mapa (pelo **nome** do objeto no Tiled), atores criados com `spawn`,
  e `self` = o NPC com quem o jogador falou (só quando o roteiro foi iniciado por um NPC).
- **Alvo (`Target`)**: `[x, y]` em **tiles** (o ator fica no centro do tile, pés na base) **ou** o nome de um
  marcador (objeto pontual da camada `markers` do mapa). Em `camera.to`/`face.to` também vale id de ator.
- **Flags**: chaves com ponto, ex.: `prologo.encontrou_pai`. Valores booleanos, números ou texto. São salvas.
- **Condições** (usadas em `if.cond`, `choice.options[].if` e em propriedades de mapa `requires`/`unless`):
  `flag`, `!flag`, `flag == valor`, `!=`, `>=`, `<=`, `>`, `<`, combinadas com `&&` e `||` (sem parênteses;
  `&&` tem precedência). Ex.: `"prologo.viu_pai && !prologo.fugiu"`, `"prologo.tentativas >= 3"`.

## Tipos de passo (contrato)

| type | campos | o que faz |
|---|---|---|
| `say` | `text` (obrig.), `speaker?`, `name?`, `portrait?`, `speed?`, `auto?` | Caixa de texto com digitação. `speaker` = id do personagem (o nome vem de `content/characters.json`; sem cadastro, usa o id capitalizado). `name` sobrescreve o nome. `portrait` = chave do retrato (`assets/portraits/<chave>.png`; sem arquivo, gera um provisório). `speed` = caracteres/s. `auto` = avança sozinho N ms depois de digitar. A/toque completa o texto ou avança; segurar B acelera. |
| `choice` | `options` (obrig.), `prompt?`, `speaker?` | Lista de opções. Cada opção: `text`, e **`goto`** (label) **ou** **`steps`** (passos aninhados; depois o roteiro segue após o `choice`), e `if?` (condição para a opção aparecer). Sem `prompt`, a última fala continua visível. |
| `label` | `name` | Ponto de salto. Só no nível principal de `steps`; nomes únicos. |
| `goto` | `label` | Salta para o label (de dentro de blocos aninhados também). |
| `if` | `flag` **ou** `cond`; `equals?`; `goto` **ou** `then`; `else?` | Se `flag` estiver ligada (ou igual a `equals`), ou se `cond` for verdadeira: salta (`goto`) ou executa `then` (lista). Senão: `else` = label (texto) ou lista de passos. |
| `flag` | `set` + `value?` (padrão `true`), `clear`, `add` + `by?` (padrão 1) | Liga/define, apaga ou soma em flags. Pode combinar no mesmo passo. |
| `move` | `actor`, `to`, `speed?` (px/s, padrão 60), `wait?` (padrão `true`), `facing?` | Anda em linha reta até o alvo (ignora colisão). `wait:false` deixa andando enquanto o roteiro continua. |
| `face` | `actor` + `dir` (`down`/`left`/`right`/`up`) **ou** `to` (ator/marcador) | Vira o ator. |
| `emote` | `actor`, `emote`, `ms?` (900), `wait?` (true) | Balão sobre a cabeça: `"!"`, `"?"`, `"..."`, `"♥"`, `"♪"`, `"💧"`… |
| `wait` | `ms` | Pausa. |
| `sfx` | `id`, `volume?` (0–1) | Efeito: `assets/audio/sfx/<id>.ogg|mp3`; sem arquivo, toca um bipe provisório. |
| `music` | `id` (ou `null` para parar), `fadeMs?` (800), `volume?` | Troca de música com crossfade: `assets/audio/music/<id>.*`; sem arquivo, melodia provisória. |
| `shake` | `ms`, `intensity?` (0.01), `wait?` (false) | Treme a câmera. |
| `fade` | `to`: `"black"`, `"white"`, `"#rrggbb"` ou `"clear"`; `ms?` (600) | Escurece/clareia a tela. O escurecimento persiste entre trocas de mapa até um `"clear"`. |
| `camera` | `to?` (alvo/ator), `follow?` (ator), `zoom?`, `ms?` (800), `wait?` (true) | `to` desloca a câmera até o alvo e para de seguir o jogador; `follow` volta a seguir (ex.: `"icaro"`). Ao fim do roteiro a câmera volta ao jogador automaticamente. |
| `spawn` | `actor`, `at`, `sprite?`, `facing?` | Cria um ator (sprite padrão: `characters.json` → `sprite`, ou o próprio id; sem arquivo, placeholder). |
| `despawn` | `actor` | Remove o ator do mapa (não remove o jogador). |
| `scene` | `map` + `at?` + `facing?` **ou** `scene` | `map`: troca de mapa **e o roteiro continua** no mapa novo. `scene`: troca de cena do jogo (ex.: `"Titulo"`) e encerra o roteiro. |
| `end` | — | Encerra o roteiro. (Dentro de um `call`, encerra só o roteiro chamado.) |

### Extensões do motor (compatíveis com o contrato)

| type | campos | o que faz |
|---|---|---|
| `checkpoint` | `at?` | Define o ponto de retorno da furtividade (padrão: posição atual do jogador). |
| `autosave` | — | Grava no espaço automático. |
| `call` | `id` | Executa outro roteiro e volta (útil para trechos repetidos). |
| `anim` | `actor`, `anim` | Toca a animação `<sprite>:<anim>` se a arte tiver; `"normal"` volta ao parado. Sem animação, é ignorado. |
| `title` | `text`, `subtitle?`, `ms?` (1500) | Cartão de título em tela cheia; A/toque continua. |
| `activity` | `id`, `params?` | Abre uma atividade registrada (loja, treino, minijogo); o resultado vai para flags/save. |
| `light` | `radius`, `ms?` (600) | Raio do círculo de luz em mapas escuros (0 = breu). |

### Falantes especiais

- `speaker: "narrador"` — caixa sem nome nem retrato, em tom acinzentado.
- `speaker: "tutorial"` — caixa verde com o nome "Dica" (instruções de controle).
- Texto inteiro entre parênteses (pensamento) aparece em cor mais suave.
- Os nomes exibidos vêm de `content/characters.json` (com acentos: "Ícaro", "Dona Custódia").

### Aliases aceitos (usados nos roteiros do prólogo)

O motor converte antes de validar (`normalizeScript` em `schema.ts`):

| Escrito | Vira |
|---|---|
| `goto.to` | `goto.label` |
| `if` com `not: true` | `cond: "!flag"` |
| `music.fade` / `id: "none"` | `music.fadeMs` / `id: null` (silêncio) |
| `scene.spawn` | `scene.at` |
| `spawn.dir`, `move.dir`, `scene.dir` | `facing` |
| `camera.actor` | `camera.follow` |
| `move.speed: "run"` / `"walk"` / `"slow"` | 130 / 60 / 35 px/s |
| `emote: "exclamacao"`, `"interrogacao"`, `"reticencias"`, `"suor"`, `"coracao"`, `"nota"` | `!`, `?`, `...`, 💧, ♥, ♪ |

### Cutscenes, autosave e retomada

Roteiros disparados por gatilho/mapa/início (não conversas com NPC ou examináveis) são **cutscenes**:
o motor grava autosave no começo e no fim. Se a página fechar no meio, o save de retomada guarda o
estado de **antes** da cutscene e o id do roteiro, que recomeça do início ao carregar.
Um gatilho com `dialogue: "a,b,c"` roda os três em sequência como uma cutscene só (ex.: 12→13→14 do prólogo).

## Dicas

- Para o jogador olhar alguém durante a fala: `{ "type": "face", "actor": "icaro", "to": "pai" }`.
- Ao falar com um NPC, o motor já vira os dois um para o outro antes do roteiro.
- Para um gatilho rodar só uma vez, não precisa de flag: gatilhos são únicos por padrão (ver MAPAS.md).
- O jogo não trava com erro de roteiro: o problema aparece no console do navegador e o roteiro é
  encerrado. Rode **`npm test`**, que valida todos os roteiros e mapas e mostra o caminho do erro
  (ex.: `steps.4.options.1.goto: label "a" não existe`).
- Exemplo completo de todos os passos: `content/dialogues/teste.json`.
