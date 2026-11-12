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

- Batalha por turnos (frente própria), inventário, HUD de exploração.
- Bundle de 1,6 MB (Phaser inteiro); dá para separar o Phaser em chunk próprio se o carregamento pesar.
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
