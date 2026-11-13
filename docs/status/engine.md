# Status — Motor (engine)

Branch: `claude/triskelion-engine`

## Feito

- **Projeto**: Phaser 3.80.1 + TypeScript strict + Vite 5 (versões exatas), `base: './'`, scripts
  `dev`/`build`/`preview`/`typecheck`/`test`. `index.html` sem zoom, safe-area, tela cheia no 1º toque
  (desligável nas Opções), aviso "gire o aparelho" em retrato. Fonte pixel VT323 (OFL) embutida.
- **Cenas**: Boot, Preload (barra), Senha, Título (Novo jogo/Continuar/Opções), Mundo, Diálogo (sobreposta),
  Menu de pausa (continuar/salvar/carregar/opções/título), Espaços (save/load), Opções, Controles (toque).
- **Input unificado** (`src/core/input.ts`): joystick analógico que nasce onde o dedo toca (metade esquerda),
  A/B/MENU à direita, multitoque por `pointerId`; teclado setas/WASD, Z/Enter, X/Esc. Controles somem sem tela de toque.
- **Diálogo/cutscene**: todos os 19 tipos do contrato + extensões `checkpoint`, `autosave`, `call`.
  `move` aceita `[x,y]` em tiles ou marcador da camada `markers`. Digitação, nome, retrato opcional,
  toque/A avança ou completa, B acelera. Esquema zod estrito + checagem de labels. Roteiro continua após
  troca de mapa (`scene.map`). Doc: `docs/tecnico/DIALOGO.md`.
- **Furtividade**: patrulha por polilinha/polígono (ou sentinela que gira), cone de visão desenhado no chão e
  cortado por paredes, esconderijos por tile (`hide`) ou objeto `esconderijo`, checkpoints; visto → `!`,
  fade e volta ao último checkpoint. Doc: `docs/tecnico/MAPAS.md`.
- **Core**: barramento tipado, flags + condições (`a && !b`, `n >= 2`), save em localStorage (3 + auto,
  versão 2, migração v1→v2), áudio com crossfade e volumes (música/efeitos) nas Opções.
- **Placeholders** gerados por código: personagens (Ícaro loiro, pai, Caligosuin, NPC por cor), tileset de 16
  tiles (também exportado em `assets/tilesets/placeholder.png` para abrir no Tiled), retratos com inicial,
  música e efeitos por Web Audio.
- **Conteúdo de teste** (não é história): `content/maps/teste.json` + `teste2.json` (NPC, Caligosuin
  patrulhando, sentinela, arbustos/barris, área de esconderijo, checkpoint, gatilho de cutscene, saída),
  `content/dialogues/teste.json` (exercita todos os passos), `teste_npc.json`, `teste_placa.json`,
  `content/jogo.json` (mapa/marcador inicial).
- **Qualidade**: 60 testes Vitest (executor, esquema, flags/condições, save/migração, SHA-256, validação de
  todo `content/`). `npm run typecheck` e `npm run build` limpos. Teste no Chromium 844×390 com toque
  (`scripts/testar-navegador.mjs`): senha, título, joystick, multitoque (joystick + B), diálogo com NPC,
  cutscene completa com troca de mapa, esconderijo, ser visto e voltar ao checkpoint, botão MENU — tudo OK.
  Capturas em `docs/tecnico/capturas/`.

## Ciclo 2 (pedidos da coordenação — todos atendidos)

- **Save (crítico)**: versão 3, gravação atômica (`.tmp` → `.bak` → principal), leitura com queda para a
  última cópia válida; salvar a qualquer momento pelo menu (3 espaços, bloqueado em cutscene); autosave na
  troca de mapa, em checkpoint, no início e no fim de cutscenes, após atividades e a cada 60 s de exploração;
  **save de retomada** em `visibilitychange`/`pagehide` (+`beforeunload`/`freeze` de reforço) e
  "Retomar de onde parou" no título (local + horário). Retomada no meio de cutscene volta ao início dela
  (estado de antes + replay do roteiro). Exportar/importar (arquivo ou texto) em Título → "Backup do save".
- **Dificuldade**: `state.difficulty` no save (`tranquila` padrão); sem opção na tela.
- **Inventário, moedas e atributos** tipados no save (`state`), helpers em `session`; sem interface.
- **Atividades**: `src/systems/activity/` — objeto Tiled com `activity` (+ `param_*`) ou passo `activity`
  abre cena registrada; resultado (flags, moedas, itens, atributos, recorde) aplicado e autosalvo.
  Exemplo: `TestActivityScene` / objeto `altar_teste` em `teste2`.
- **Interiores**: portas com `entry` ou `return: true` (volta ao ponto de onde entrou), porta trancada
  (`locked_if` + `locked_dialogue`), examináveis (`examinar`, com `alt_dialogue`/`alt_if`, `glow`, `once`),
  moradores, fade. Casa de teste `teste_casa` (dois cômodos). Padrão documentado em MAPAS.md.
- **UI**: com controles de toque a caixa de diálogo termina antes dos botões A/B; toque em qualquer lugar da
  caixa avança; estilos de `narrador`, `tutorial` ("Dica") e pensamento; nomes com acento via
  `content/characters.json`; Phaser em chunk próprio (`phaser-*.js` 1,46 MB + jogo 161 kB).
- **Prólogo**: os 48 roteiros de `origin/claude/triskelion-narrativa` validam e rodam até o fim
  (`tests/prologo-compat.test.ts`, cópia em `tests/fixtures/prologo/`, atualizar com
  `scripts/atualizar-fixture-prologo.sh`). Suporte a `anim` (toca se houver arte, senão ignora), `title`,
  falantes `narrador`/`tutorial` e todos os campos do fim de `10_prologo_roteiro.md` (via aliases, ver DIALOGO.md).
  Contador de colheita genérico (`counter`/`counter_goal`/`counter_flag`), máscara de escuridão com
  círculo de luz (`escuro`/`luz_raio` + passo `light`), gatilhos `activation: load`, diálogo condicional de
  NPC (`alt_dialogue`/`alt_if`), roteiros encadeados (`"a,b,c"`), patrulha por marcadores `<rota>_pN`.
- **Testes**: 174 no Vitest. Teste de navegador ampliado (32 verificações, todas OK): porta trancada, casa,
  acentos na fonte e nos nomes, caixa x botões, colheita, atividade, túnel escuro, salvar pelo menu e
  **recarregar a página e voltar à mesma posição**.

### Incompatibilidades com o prólogo

Nenhuma bloqueante. Observações para as outras frentes:
- `content/characters.json` foi criado pelo motor só com os nomes do prólogo — **a narrativa é dona do arquivo**.
- Para a sessão de mapas: colheita = 5 objetos `examinar` com `dialogue: prologo_03_pe_de_cafe`,
  `counter: prologo.colheita`, `counter_goal: 5`, `counter_flag: prologo.colheita_completa`, `glow: true`;
  Zefa = `npc` com `dialogue: prologo_04_zefa`, `alt_dialogue: prologo_06_colheita_fim`, `alt_if: prologo.colheita_completa`;
  `gatilho_casa` com `dialogue: "prologo_12_pai_confissao,prologo_13_cura,prologo_14_promessa"`;
  túnel com `escuro: true`; porta da casa de manhã com `locked_if: "!prologo.cafe_com_pai"` e
  `locked_dialogue: prologo_00c_porta_sem_cafe`.

## Ciclo 3

- **Tiles animados** no formato padrão do Tiled (`animation` no tileset embutido), sincronizados pelo relógio
  global; testes unitários (`tests/tiles.test.ts`). O que a arte deve preencher em `tiles_fogo.json` está em
  MAPAS.md ("Tiles animados").
- **Tilesets da arte** conferidos: todos os `docs/arte/tilesets/tiles_*.json` têm imagem correspondente em
  `assets/tilesets/` e propriedades válidas (teste automático). Mapa `content/maps/teste_arte.json`
  (`tiles_exterior_noite` + `tiles_fogo` com animações) carrega sem avisos; fogo anima; `collides` (fogo, cerca)
  e `hide` (arbusto) funcionam — verificado no Chromium (`docs/tecnico/capturas/07-tilesets-arte.png`).

## Ciclo 4 (pedidos da arte em docs/status/arte.md)

- **Poses**: todo `assets/sprites/*.json` com `alvo` + `anims` vira animação `<alvo>:<nome>` no Preload; o passo
  `anim` toca a pose (procura `<sprite>:<anim>`, `<id>:<anim>` e o sprite equivalente) e a mantém até o ator andar,
  virar ou receber `anim: "normal"`. Folhas de outro tamanho (`pai_deitado` 24×16) mantêm a origem nos pés.
- **Sprites**: `toucim` usa `toucim` (16×32); `cali_1`…`cali_N` e `cali_soldado` usam `cali_soldado`;
  `caligosuin` ↔ `cali_soldado` são equivalentes. Objetos de uma linha (`caixa_costura`, `barril_custodia`)
  funcionam como atores (quadro 0 parado + poses).
- **Emotes por ícone** (`assets/images/emote_<nome>.png`), com texto de reserva.
- **Teste** `tests/arte.test.ts`: todos os retratos (64×64), poses e emotes usados nos 48+ roteiros do prólogo
  existem nos assets — nenhum faltando. Teste de navegador: +4 verificações (poses criadas e tocadas,
  `cali_N`/`toucim`, ícones). Captura `docs/tecnico/capturas/08-poses-emotes.png`.
- O pedido 4 da arte (tiles animados) foi atendido no ciclo 3; falta a arte preencher `animation` em
  `tiles_fogo.json` (tabela em MAPAS.md). Alternativa `fx_fogo*` como ator decorativo também funciona
  (`spawn` com `sprite: "fx_fogo"` + `anim: "queimar"`).

## Ciclo 5 (áudio e arte final)

- **Música**: carregada sob demanda via Web Audio (o boot não baixa ~5 MB de trilha), respeitando o
  `assets/audio/music/manifest.json`: `loop`, `loopStart`, `loopEnd`; `tema_lenda` e `tema_mae` tocam uma vez.
  Crossfade mantido; sem arquivo, melodia provisória.
- **Bips de fala por falante** (`fala_grave`/`fala_aguda`/`fala_ronco`/`fala_media`; narrador/tutorial = `texto`),
  sobrescrevível por `voz` em characters.json. SFX de interface usam os arquivos da arte com os mesmos ids.
- **Título** com `titulo_fundo` + `simbolo_triskelion` (painel translúcido atrás do menu para contraste);
  **cartão de título** com `cartao_titulo_fundo`.
- **Favicon, apple-touch-icon e manifest de PWA** (`display: fullscreen`, `orientation: landscape`) gerados no build
  a partir de `assets/icons/`.
- Testes: `tests/audio.test.ts` (manifesto, vozes, SFX existentes). Teste de navegador: 45 verificações OK
  (inclui arte do título, manifest/ícones servidos, laço das músicas). Capturas 09 e 10.

## Decisões

- **Senha**: `VITE_GAME_PASSWORD` é lida no `vite.config.ts`, que embute só o **SHA-256** (o texto não vai
  para o bundle — conferido). Comparação no cliente com SHA-256 em JS puro (funciona em `http://` na rede
  local, onde `crypto.subtle` não existe). Também aceita `VITE_GAME_PASSWORD_HASH`. Sem variável → sem tela
  de senha. Proteção leve; a forte é do deploy.
- **Escala**: `Scale.FIT` (pedido), portanto em celulares mais largos que 16:9 há faixas laterais e a escala
  não é inteira; com `image-rendering: pixelated` fica nítido.
- **Assets por convenção de pastas** (`import.meta.glob`), sem manifesto manual. Spritesheet de personagem:
  4 linhas (baixo, esquerda, direita, cima) × 3–4 colunas, 16×24 por padrão (sidecar `.json` muda o tamanho).
- **Mapa inicial** e id do jogador em `content/jogo.json` (a sessão de mapas troca para o prólogo).
- **Classes Tiled** em português com aliases em inglês; propriedades idem.
- **Gatilhos são únicos por padrão** (flag automática `gatilho.<mapa>.<nome>`).
- Mudar de mapa reinicia a cena Mundo (estado de NPCs não persiste; o que importa deve virar flag).

## Propostas ao contrato (implementadas de forma compatível)

- Novos tipos de passo: `checkpoint`, `autosave`, `call`.
- `if`: além de `flag` + `goto`, aceita `cond` (expressão), `equals`, `then` (lista) e `else` (label ou lista).
- `choice.options[]`: `steps` (alternativa a `goto`) e `if` (condição de exibição).
- `goto` usa o campo `label`. Ator especial `self` (o NPC com quem se falou).
- `say.auto` (avança sozinho), `move.wait=false` (andar em paralelo), `fade.to` com `"clear"`/cor.

## Pendente / próximos passos

- Batalha por turnos (frente própria), interface de inventário/loja, HUD de exploração.
- Iluminação/efeitos da vila em chamas (partículas de fogo, fumaça) quando houver arte.
- Pathfinding nos `move` (hoje é linha reta; use marcadores intermediários).
- Testar em iPhone/Android reais (só emulado no Chromium).

## Como testar

```bash
npm install
npm test && npm run typecheck
npm run dev                      # http://localhost:5173 — sem senha em dev
# no celular (mesma rede): http://<ip-da-máquina>:5173
VITE_GAME_PASSWORD=teste123 npm run build && npx vite preview --port 4173 &
SENHA=teste123 node scripts/testar-navegador.mjs   # teste automatizado com toque
```

No jogo de teste: fale com o aldeão (A de frente), siga o caminho para a direita — o gatilho roda o roteiro de
teste completo (troca para `teste2` e volta) —, passe pelo checkpoint e atravesse a área do Caligosuin se
escondendo nos arbustos/barris. Se ele te vir, você volta ao checkpoint.
