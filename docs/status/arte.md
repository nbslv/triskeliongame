# Status — Arte e Áudio

Branch: `claude/triskelion-arte`. Tudo é gerado por código e pode ser regerado/ajustado:

```bash
python3 tools/arte/gerar_tilesets.py    # assets/tilesets + docs/arte/TILESET.md + montagens
python3 tools/arte/gerar_sprites.py     # assets/sprites + ícones/emotes em assets/images
python3 tools/arte/gerar_retratos.py    # assets/portraits (29 retratos 64×64)
python3 tools/arte/gerar_titulo.py      # tela de título, símbolo e ícones
python3 tools/audio/musicas.py [id...]  # assets/audio/music (OGG + MP3 + manifest.json)
python3 tools/audio/sfx.py [id...]      # assets/audio/sfx (OGG)
```

## Feito

- **Tilesets** (guia completo em `docs/arte/TILESET.md`): `tiles_exterior` (+ `_tarde`, `_noite`, mesmos índices),
  `tiles_interior` (+ `_noite`), `tiles_fogo`, `tiles_tunel`, `tiles_panorama`. JSON de tileset para embutir no
  Tiled em `docs/arte/tilesets/`.
- **Sprites** 16×24, 4 linhas (baixo, esquerda, direita, cima) × 4 colunas (0 = parado), em `assets/sprites/`:
  `icaro`, `pai`, `tonho`, `zefa`, `juca`, `ermelinda`, `custodia` (com a galinha), `nina`, `aldeao`, `aldea`,
  `aldeao_2`, `sobrevivente_1`, `sobrevivente_2`, `soldado_1`, `sargento`, `cali_soldado` (= `caligosuin`, a chave
  padrão dos inimigos), `toucim` (16×32, com `toucim.json`), `galinha`.
- **Poses especiais** em folhas separadas `assets/sprites/<nome>.png` + `<nome>.json`
  (`frameWidth`, `frameHeight`, `alvo`, `anims: {nome: {frames, frameRate, repeat}}`): `icaro_poses`, `pai_poses`
  (sentado, beber_cafe), `pai_deitado` (24×16: parado, mostrar_caixa, empurrar, entregar_caixa), `aldeao_poses`
  (varrer), `ermelinda_poses` (carimbar), `sobrevivente_poses`, `cali_poses` (bufar, espirrar, alerta),
  `toucim_poses` (apontar, bronca), `caixa_costura` (fechada, piscar, aberta), `barril_custodia` (fechado, abrir,
  aberto), `fx_fogo`, `fx_fogo_negro`, `fx_fumaca`.
- **Retratos** 64×64 em `assets/portraits/` com os 29 ids da lista (`icaro_neutro`… `toucim_bravo`).
- **Ícones e emotes** 16×16 em `assets/images/`: `item_colar_mae`, `item_rapadura_amassada`, `item_ovos_pamonha`,
  `item_pao_de_ontem`, `item_moeda_cobre`, `item_livro_icaro`, `emote_exclamacao`, `emote_interrogacao`,
  `emote_reticencias`, `emote_suor`; panoramas inteiros `pan_capital`, `pan_vila`, `pan_ceu_tarde`.
- **Tiles animados** (formato do Tiled) já em `docs/arte/tilesets/tiles_fogo.json`: `fogo`, `fogo_alto` (topo e base),
  `fogo_negro`, `fogo_negro_alto`, `fumaca_preta`, `cinzas_caindo`; e a `goteira` em `tiles_tunel.json`.
- **Caligosuins**: chama negra com borda roxa saindo do focinho nos quadros de andar, nas poses `bufar`/`bufar_lado`,
  no efeito avulso `fx_bufo` (16×16, 4 quadros: `bufar`, `respirar`) e nos três retratos. Pose `olhar_em_volta`
  em `cali_poses` (a antiga `espirrar` continua no arquivo, sem uso).
- **Músicas** (`assets/audio/music/`, OGG + MP3): `tema_lenda` (20 s, sem laço), `tema_casa`, `tema_cafezal`,
  `tema_tensao`, `tema_vila_em_chamas`, `tema_pai`, `tema_mae` (leitmotiv de 8 notas, sem laço), `tema_tunel`,
  `tema_noite_esperanca`, `tema_triskelion` e `titulo` (cópia do `tema_triskelion`, a chave que a tela de título
  toca). Laço sem emenda do início ao fim do arquivo (cauda e reverberação dobradas para o começo). Pontos de laço
  em `assets/audio/music/manifest.json`: lista de `{id, arquivo, mp3, loop, loopStart, loopEnd, duracao, bpm}`.
- **Efeitos** (`assets/audio/sfx/`, OGG): os 29 de cena da lista, os da interface com os ids do motor (`texto`,
  `cursor`, `confirmar`, `cancelar`, `alerta`) e os bips de fala `fala_grave`, `fala_media`, `fala_aguda`,
  `fala_ronco`. `fogo_crepitar` e `grilos` são laços. (`cali_espirro` ficou no pacote, mas o roteiro não usa mais.)
- **Título e ícone**: `assets/images/titulo_fundo.png` (640×360, entardecer em Valesol com o símbolo no céu),
  `cartao_titulo_fundo.png` (640×360, símbolo bem discreto), `simbolo_triskelion.png` (64×64) e
  `simbolo_triskelion_32.png`; ícones do app em `assets/icons/` (`icone_512`, `icone_192`, `icone_64`,
  `favicon_32`, `favicon_16`). O símbolo são três espirais que nascem do mesmo centro, desenho próprio.
- Teste de navegador (`scripts/testar-navegador.mjs`, Chromium 844×390 com toque): todas as verificações OK com os
  assets novos; `npm test`: 241 testes OK. Capturas em `docs/arte/capturas/` (`mock_*.png`, `sprites.png`, `retratos.png`, `jogo/`).

## Pedidos ao motor (não editei `src/`)

1. **Poses (`anim`)**: o motor toca `<sprite>:<anim>` se a animação existir, mas não a cria. Proposta: no Preload,
   para cada `assets/sprites/*.json` que tenha `anims`, criar `this.anims.create({ key: `${alvo}:${nome}`,
   frames: frames.map(f => ({ key: <arquivo>, frame: f })), frameRate, repeat })`. As folhas de pose já carregam
   como spritesheet pelo `frameWidth`/`frameHeight` do JSON. Ao tocar uma pose de outra textura/tamanho
   (`pai_deitado` é 24×16), manter a origem nos pés (0.5, 1).
2. **Sprite por ator**: `cali_1`…`cali_5` devem usar `cali_soldado` (ou `caligosuin`, idêntico); `toucim` usa
   `toucim` (16×32). Hoje `content/characters.json` aponta `toucim` para `caligosuin`.
3. **Emotes**: trocar o texto/emoji pelo ícone `emote_<nome>` de `assets/images/` quando existir (o `suor` hoje é 💧).
4. **Título**: usar `titulo_fundo` como fundo da TitleScene (o texto e o menu ficam sobre a parte escura) e
   `cartao_titulo_fundo` na TitleCardScene; ligar `assets/icons/favicon_32.png` e `icone_192/512.png` no
   `index.html` (favicon, apple-touch-icon, manifest).
6. **Bips de fala**: tocar `fala_grave` (pai), `fala_aguda` (Nina), `fala_ronco` (Caligosuins) e `fala_media`
   (demais) no lugar de `texto`, conforme o falante.
7. **Laços**: as músicas tocam com `loop: true` do arquivo inteiro, que já é o desejado; `tema_lenda` e `tema_mae`
   têm `loop: false` no manifesto e não deveriam repetir.
5. **Objetos animados** `caixa_costura` e `barril_custodia`: são spritesheets de uma linha (não têm 4 direções);
   como ator, usar só o quadro 0 parado e as animações do JSON.

## Limites conhecidos

- Não tenho como ouvir o áudio: conferi as músicas e os efeitos só por medidas (pico, volume médio, emenda do
  laço, distribuição por faixas de frequência). Vale uma escuta humana, principalmente do equilíbrio entre os
  instrumentos e dos efeitos de voz (galo, galinha, grunhidos).
- A variação `_noite` dos tiles é uma gradação de cor automática; não há iluminação dinâmica em volta do fogo.

## Dúvidas para o autor

- As melodias (tema da casa/pai e o leitmotiv de 8 notas da mãe) agradam? Elas se repetem pelo jogo todo.

- Os Caligosuins estão "fofo-ameaçadores" o bastante? (ver `docs/arte/capturas/sprites.png` e `retratos.png`)
