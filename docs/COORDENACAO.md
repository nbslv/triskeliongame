# Coordenação do projeto Triskelion

Este documento é o contrato entre as sessões de trabalho. Toda sessão LÊ este arquivo antes de
começar e NÃO altera decisões marcadas como "Decidido" sem passar pela coordenação.

## 1. Decisões do produto (Decidido)

| Tema | Decisão |
|---|---|
| Plataforma | Navegador. Celular em **modo horizontal** (landscape) é o alvo principal; desktop também funciona. Tela pede para girar o aparelho se estiver em pé. |
| Idioma | Português do Brasil em todos os textos. |
| Tom | Aventura, fantasia, aconchegante ("cozy"), leve, com humor. Momentos tristes existem (prólogo), mas nada de violência explícita: a morte do pai é só subentendida. |
| Gênero | RPG de exploração com batalhas por turnos; opção de **batalha automática** (botão AUTO) e acelerar (2x). |
| Controles | Joystick virtual (esquerda) + botões na tela (A = interagir/confirmar, B = voltar/correr, MENU). Teclado no desktop (setas/WASD, Z/Enter, X/Esc). |
| Privacidade | Código em repositório **privado**. Jogo publicado em link não divulgado com **senha na entrada**. |
| Primeira entrega | **Fatia vertical do Prólogo** (vila em chamas → reencontro com o pai → fuga → grupo de sobreviventes). Sem batalhas no prólogo, por decisão de história. |
| Protagonista | Ícaro (cabelo loiro). O final do briefing cita "Makoto": tratado como erro de digitação, é o **Ícaro** quem coloca o triskelion no cajado. |
| Monge | **Irmão Silvano** (nome de monge; "Silvano" ecoa o cabelo prateado). O nome real de príncipe é revelado no fim — definido pela sessão de narrativa. |
| Duração | Prólogo: 10–15 min. Jogo completo: **8–24 h** (história principal ~10–14 h; o resto em missões secundárias, exploração e extras). |
| Salvamento | Crítico. Autosave frequente (troca de mapa, após cutscenes e batalhas) + 3 espaços manuais + pontos de save no mundo. Nunca perder mais que ~5 min de progresso. |
| Público | Projeto pessoal do autor, compartilhado com outras pessoas (inclusive quem não joga muito RPG). Tutoriais claros, dificuldade selecionável (Tranquila / Aventura / Desafio), batalha AUTO. |
| Clima e música | Majoritariamente **aconchegante e fofo** (estilo cozy de fazenda/vilarejo), com momentos de tensão e batalha. Trilha **original**, composta como dados e pré-renderizada em OGG/MP3 com loop: instrumentos suaves (violão dedilhado, marimba, flauta, celesta, cordas leves, pads). Batalha e tensão usam a mesma paleta de instrumentos com mais ritmo e tons menores — nunca agressivo. Responsabilidade da sessão de Arte e Áudio. |

## 2. Stack técnica (Decidido)

- **Phaser 3** (versão fixa 3.80.1) + **TypeScript** + **Vite**. Sem backend.
- Resolução lógica **640×360** (16:9), pixel art com escala inteira, `pixelArt: true`, `Scale.FIT`.
- Tiles 16×16, personagens 16×24 (ou 16×32), 4 direções, 3–4 quadros de caminhada.
- Salvamento em `localStorage` (3 espaços + autosave), com versão de esquema.
- Áudio: música e efeitos gerados por código (Web Audio) ou arquivos livres de direitos; nada de material protegido.
- Arte: original. Até a sessão de arte entregar, usar placeholders gerados por código.

## 3. Arquitetura e contratos entre sessões

```
src/
  main.ts                # bootstrap do Phaser
  config/                # constantes (resolução, cores, chaves de input)
  core/                  # serviços sem dependência de cena
    events.ts            # barramento de eventos tipado
    save.ts              # salvar/carregar (localStorage)
    flags.ts             # flags de história (ex.: "prologo.encontrou_pai")
    input.ts             # teclado + joystick virtual unificados
    audio.ts
  scenes/                # Boot, Preload, Senha, Titulo, Mundo, Dialogo, Batalha, Menu
  systems/
    dialogue/            # executor de roteiros de diálogo/cutscene (JSON)
    battle/              # batalha por turnos (só a partir do Ato 1)
    inventory/
  ui/                    # caixa de diálogo, menus, HUD, joystick
content/                 # DADOS — editados pelas sessões de conteúdo, lidos pelo motor
  dialogues/*.json
  maps/*.json            # mapas no formato Tiled (JSON)
  characters.json
  enemies.json
  items.json
assets/                  # sprites, tilesets, áudio
docs/
  COORDENACAO.md         # este arquivo
  BRIEFING_ORIGINAL.md   # texto original do autor
  gdd/                   # Game Design Document (sessão de narrativa/design)
```

**Regra de ouro:** conteúdo (história, falas, mapas, números de balanceamento) vive em `content/`
como dados. O motor (`src/`) nunca tem falas escritas no código. Assim as sessões trabalham em
paralelo sem conflito.

### Formato de diálogo/cutscene (contrato)

`content/dialogues/<id>.json`:

```json
{
  "id": "prologo_pai",
  "steps": [
    { "type": "say", "speaker": "pai", "portrait": "pai_ferido", "text": "Ícaro... você veio." },
    { "type": "choice", "options": [ { "text": "Pai! Aguenta firme!", "goto": "a" } ] },
    { "type": "label", "name": "a" },
    { "type": "move", "actor": "icaro", "to": [12, 8] },
    { "type": "wait", "ms": 500 },
    { "type": "sfx", "id": "madeira_quebrando" },
    { "type": "shake", "ms": 300 },
    { "type": "fade", "to": "black", "ms": 800 },
    { "type": "flag", "set": "prologo.pai_despedida" },
    { "type": "end" }
  ]
}
```

Tipos mínimos: `say`, `choice`, `label`, `goto`, `if` (por flag), `flag`, `move`, `face`,
`emote`, `wait`, `sfx`, `music`, `shake`, `fade`, `camera`, `spawn`, `despawn`, `scene`, `end`.
O motor pode adicionar tipos; deve documentá-los em `docs/tecnico/DIALOGO.md`.

## 4. Frentes de trabalho (sessões)

| # | Frente | Branch | Modelo | Responsabilidade única |
|---|---|---|---|---|
| 0 | Coordenação | `claude/triskelion-game-coord-wbvqiu` | Opus | Decisões, divisão, integração, revisão |
| 1 | Narrativa e Game Design | `claude/triskelion-narrativa` | Fable (topo, criativo) | GDD, bíblia da história, personagens, fases, inimigos, NPCs, roteiro do prólogo |
| 2 | Motor (engine) | `claude/triskelion-engine` | Opus | Projeto Phaser, cenas, input/joystick, diálogo, save, tela de senha, build |
| 3 | Arte e Áudio | `claude/triskelion-arte` | Fable (criativo) | Sprites, tilesets, retratos, paleta, música/SFX — *começa depois do GDD* |
| 4 | Fases/Mapas | `claude/triskelion-mapas` | Sonnet | Monta mapas Tiled e cutscenes a partir do GDD — *começa depois do motor* |
| 5 | Batalha | `claude/triskelion-batalha` | Opus | Sistema por turnos + AUTO — *Ato 1 em diante* |
| 6 | Publicação | `claude/triskelion-deploy` | Sonnet | Deploy privado com senha — *quando houver build jogável* |

Cada sessão trabalha **apenas** nas pastas da sua frente. A coordenação integra os branches.

## 5. Convenções

- Commits em português, mensagens curtas e descritivas.
- Nada de nomes, personagens, músicas ou arte de jogos existentes.
- Identificadores de código em inglês; textos para o jogador em PT-BR.
- Toda sessão termina com um resumo em `docs/status/<frente>.md` (o que foi feito, o que falta,
  dúvidas para o autor).
