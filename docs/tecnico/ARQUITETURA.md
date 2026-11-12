# Arquitetura do motor

Phaser 3.80.1 + TypeScript (strict) + Vite. Resolução lógica 640×360, `pixelArt`, `Scale.FIT`.
Regra de ouro: **nenhuma fala, mapa ou número de história no código**. Tudo vem de `content/` e `assets/`.

```
src/
  main.ts                 configuração do Phaser e lista de cenas
  style.css               página: sem zoom/rolagem, aviso "gire o aparelho", campo de senha
  config/constants.ts     resolução, cores, profundidades, nomes de cena, velocidades
  content/index.ts        carrega content/*.json e lista assets/** (import.meta.glob, em tempo de build)
  core/                   serviços sem cena (singletons)
    events.ts             barramento de eventos tipado (bus.on / bus.emit)
    flags.ts              flags de história + avaliador de condições
    save.ts               localStorage: espaços 1–3 + auto + retomada; atômico; migrações; exportar/importar
    session.ts            estado da partida (posição, checkpoint, tempo, inventário/moedas/atributos)
    resume.ts             save de retomada ao ocultar/fechar a aba
    settings.ts           opções do jogador (volumes, velocidade do texto, tela cheia)
    input.ts              teclado + joystick virtual + botões A/B/MENU (multitoque)
    audio.ts              música com crossfade e efeitos; provisórios por Web Audio
    password.ts, sha256.ts  tela de senha (proteção leve)
  scenes/
    BootScene             inicia serviços, espera a fonte
    PreloadScene          barra de progresso, carrega assets/, gera placeholders
    PasswordScene         senha (campo HTML sobre o canvas)
    TitleScene            Novo jogo / Continuar / Opções
    WorldScene            exploração, colisão, câmera, NPCs, gatilhos, saídas, furtividade
    DialogueScene         caixa de texto e escolhas (sobreposta)
    PauseMenuScene        pausa: continuar, salvar, carregar, opções, título
    SlotsScene            escolher espaço de save/load
    BackupScene           exportar/importar saves (HTML sobre o canvas)
    TitleCardScene        cartão de título (passo `title`)
    TestActivityScene     atividade de exemplo
    OptionsScene          volumes, velocidade do texto, tela cheia
    ControlsScene         desenha joystick/botões (sempre no topo; some sem tela de toque)
  systems/
    dialogue/types.ts     tipos dos passos
    dialogue/schema.ts    validação (zod + checagens de labels/call)
    dialogue/runner.ts    executor puro (sem Phaser) — testado no Vitest
    dialogue/director.ts  liga o executor ao Mundo e à caixa de diálogo; sobrevive à troca de mapa
    world/Actor.ts        personagem (sprite + física + animação + emote)
    world/tiled.ts        leitura/validação do JSON do Tiled (sem Phaser)
    activity/             registro de atividades (lojas/treinos/minijogos)
    stealth/Patrol.ts     patrulha e cone de visão
    stealth/vision.ts     geometria do cone (pura)
  ui/                     MenuList, painéis/textos, texturas provisórias
content/                  DADOS (outras sessões)
assets/                   arte/áudio (sessão de arte)
tests/                    Vitest
scripts/                  gerador do mapa de teste, teste no navegador
```

## Fluxo de cenas

`Boot → Preload → (Senha) → Titulo → Mundo ⇄ (Dialogo, Menu → Espacos/Opcoes)`.
`Controles` roda o tempo todo por cima. O Mundo é **reiniciado** (`scene.restart`) a cada troca de mapa.

## Input

`input` (src/core/input.ts) é global e não depende de cena:
- `input.axis()` → vetor analógico (teclado ou joystick).
- `input.isDown('B')` → segurado (correr). `input.consume('A')` → um pressionamento.
- `input.consumeTap()` → toque livre na tela (avançar diálogo).
- O joystick aparece onde o dedo toca na metade esquerda; é desligado em menus/diálogos
  (`input.setJoystickEnabled(false)`) para que toques virem seleção.
- Teclado: setas/WASD; **A** = Z/Enter/Espaço; **B** = X/Shift/Esc; **MENU** = Esc/M/Tab/P.
- Tela cheia é pedida no primeiro toque (opção desligável); iPhone não suporta a API — sem problema.

## Como adicionar…

### Um mapa
1. Crie no Tiled seguindo `docs/tecnico/MAPAS.md` e salve em `content/maps/<id>.json`.
2. Tileset: `assets/tilesets/<nome-do-tileset>.png` (ou use o `placeholder`).
3. Ligue-o com uma `saida` de outro mapa (`map: "<id>"`) ou com `scene` num roteiro.
   Para ser o mapa inicial: `content/jogo.json → startMap/startMarker`.
4. `npm test` (valida) e `npm run dev`.

### Um diálogo/cutscene
1. Crie `content/dialogues/<id>.json` (formato em `docs/tecnico/DIALOGO.md`).
2. Dispare por um NPC (`dialogue` no objeto), por um `gatilho`, por `call` em outro roteiro,
   ou ao iniciar o jogo (`content/jogo.json → startDialogue`).
3. `npm test`.

### Personagens
`content/characters.json` (sessão de narrativa). O motor lê, se existir, `id`, `name`/`nome`
e `sprite` — aceita lista, `{ "personagens": [...] }` ou objeto `{ "<id>": {...} }`.

### Arte e áudio (sessão de arte)
Basta colocar os arquivos; o build encontra sozinho:

| Pasta | Chave | Uso |
|---|---|---|
| `assets/sprites/<id>.png` (+ opcional `<id>.json` com `{"frameWidth":16,"frameHeight":24}`) | `<id>` | Spritesheet de personagem: **4 linhas** (baixo, esquerda, direita, cima) × 3 ou 4 colunas (coluna 0 = parado). Padrão 16×24. |
| `assets/portraits/<chave>.png` | `portrait:<chave>` | Retrato 64×64 do `say.portrait`. |
| `assets/tilesets/<nome>.png` | `tileset:<nome>` | Tileset com o mesmo nome do Tiled. |
| `assets/images/<id>.png` | `<id>` | Imagens avulsas. |
| `assets/audio/music/<id>.ogg|mp3` | `music:<id>` | Música (`music` nos roteiros, `music` no mapa). Pode ter .ogg e .mp3 juntos. |
| `assets/audio/sfx/<id>.ogg|mp3` | `sfx:<id>` | Efeitos. Ids usados pelo motor: `confirmar`, `cancelar`, `cursor`, `texto`, `alerta`. |

Enquanto um arquivo não existe, o motor gera um provisório (bonecos coloridos, bipes, melodia).

### Uma cena nova (ex.: Batalha)
1. `src/scenes/MinhaScene.ts` estendendo `Phaser.Scene`, chave em `SCENES` (`config/constants.ts`).
2. Registre em `src/main.ts` (antes de `ControlsScene`).
3. Use `input`, `audio`, `flags`, `bus` dos serviços em `src/core/`.
4. Para chamar a partir de um roteiro: passo `scene` com `"scene": "<chave>"` (ou proponha um tipo novo).

## Senha de entrada (proteção LEVE)

- Defina `VITE_GAME_PASSWORD` em `.env.local` (não versionado; ver `.env.example`) ou no ambiente do build.
- O `vite.config.ts` calcula o **SHA-256** no build; só o hash vai para o bundle (o texto não).
  Alternativa: `VITE_GAME_PASSWORD_HASH` com o hash pronto.
- O cliente compara o hash do que foi digitado (SHA-256 em JS puro, funciona também em `http://` na rede local)
  e lembra o desbloqueio no `localStorage`.
- **É só uma cortina**: qualquer pessoa técnica com o link pode contornar. A proteção de verdade
  (autenticação no servidor/CDN) fica com a frente de deploy.
- Sem variável definida, a tela de senha é pulada (desenvolvimento).

## Salvamento (crítico: nunca perder mais que ~1 min)

`localStorage`, chaves `triskelion.save.{1,2,3,auto,retomada}` (`src/core/save.ts`, versão 3). Registro:

```ts
{ version, savedAt, playtimeMs,
  position{map,x,y,facing}, checkpoint{…}, returnPoint?{…},
  flags{},
  state{ difficulty, coins, inventory{id:qtd}, attributes{forca,magia,…} },
  resumeDialogue? }   // roteiro a recomeçar se gravado no meio de uma cutscene
```

- **Gravação atômica**: escreve `<chave>.tmp`, confere, move a anterior para `<chave>.bak`, troca a principal.
  Leitura: principal → `.tmp` → `.bak` (save corrompido cai para a última cópia válida e é restaurado).
- **Quando grava**: menu de pausa (3 espaços manuais, a qualquer momento fora de cutscene); autosave ao
  entrar em mapa, em checkpoint, no início e no fim de cutscenes, depois de atividades e a cada 60 s de
  exploração; **retomada** em `visibilitychange`(hidden)/`pagehide` (`beforeunload` como reforço) —
  `src/core/resume.ts`. No título, se a retomada for o save mais recente, aparece "Retomar de onde parou".
- **Backup**: Título → "Backup do save" baixa/copia um JSON com todos os espaços e importa de arquivo ou
  texto colado (validado antes de gravar).
- **Dificuldade**: `state.difficulty` (`tranquila` | `aventura` | `desafio`). Versão inicial: sempre
  `tranquila`, sem opção na tela.
- Mudou o formato? Incremente `SAVE_VERSION` e adicione `MIGRATIONS[versão_antiga]` (teste em `tests/save.test.ts`).

## Extensão: atividades (lojas, treinos, minijogos)

Ponto de entrada genérico em `src/systems/activity/`:

1. Crie a cena (ex.: `src/scenes/TreinoMagiaScene.ts`). Ela recebe `ActivityLaunch` em `create(data)`:
   `{ id, params, state (moedas/inventário/atributos, só leitura), finish(resultado) }`.
2. Registre em `src/main.ts` (lista de cenas) e em `src/systems/activity/index.ts`:
   `registerActivity('treino_magia', { sceneKey: 'TreinoMagia' })`.
3. Dispare por um objeto Tiled com a propriedade `activity: "treino_magia"` (+ `param_<nome>` → `params.<nome>`)
   ou por um passo de roteiro `{ "type": "activity", "id": "treino_magia", "params": { ... } }`.
4. Ao terminar, chame `data.finish({ completed, flags?, coins?, items?, attributes?, score? })`.
   O motor aplica no estado (moedas/itens/atributos são **deltas**), marca `atividade.<id>.concluida`,
   soma `atividade.<id>.vezes`, guarda recorde em `atividade.<id>.melhor`, fecha a cena, retoma o Mundo e faz autosave.

Exemplo funcional: `src/scenes/TestActivityScene.ts` (id `teste`, objeto `altar_teste` em `teste2`).
Estado e helpers: `session.state`, `session.addItem/addCoins/addAttribute` (`src/core/session.ts`).
Ainda sem interface de inventário/loja.

## Depuração

`window.__TRISKELION__` é o `Phaser.Game`. Ex. no console:
`__TRISKELION__.scene.getScene('Mundo').debugState()`.
