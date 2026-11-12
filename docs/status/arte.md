# Status — Arte e Áudio

Branch: `claude/triskelion-arte`. Tudo é gerado por código e pode ser regerado/ajustado:

```bash
python3 tools/arte/gerar_tilesets.py    # assets/tilesets + docs/arte/TILESET.md + montagens
python3 tools/arte/gerar_sprites.py     # assets/sprites + ícones/emotes em assets/images
python3 tools/arte/gerar_retratos.py    # assets/portraits (29 retratos 64×64)
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
- Teste de navegador (`scripts/testar-navegador.mjs`, Chromium 844×390 com toque): 32 verificações OK com os
  assets novos. Capturas em `docs/arte/capturas/` (`mock_*.png`, `sprites.png`, `retratos.png`, `jogo/`).

## Pedidos ao motor (não editei `src/`)

1. **Poses (`anim`)**: o motor toca `<sprite>:<anim>` se a animação existir, mas não a cria. Proposta: no Preload,
   para cada `assets/sprites/*.json` que tenha `anims`, criar `this.anims.create({ key: `${alvo}:${nome}`,
   frames: frames.map(f => ({ key: <arquivo>, frame: f })), frameRate, repeat })`. As folhas de pose já carregam
   como spritesheet pelo `frameWidth`/`frameHeight` do JSON. Ao tocar uma pose de outra textura/tamanho
   (`pai_deitado` é 24×16), manter a origem nos pés (0.5, 1).
2. **Sprite por ator**: `cali_1`…`cali_5` devem usar `cali_soldado` (ou `caligosuin`, idêntico); `toucim` usa
   `toucim` (16×32). Hoje `content/characters.json` aponta `toucim` para `caligosuin`.
3. **Emotes**: trocar o texto/emoji pelo ícone `emote_<nome>` de `assets/images/` quando existir (o `suor` hoje é 💧).
4. **Tiles animados**: o fogo de `tiles_fogo` tem 3 quadros por tile; sem suporte a animação de tile, fica parado.
   Alternativa já pronta: sprites `fx_fogo`, `fx_fogo_negro`, `fx_fumaca` (16×32, 3 quadros) como objetos decorativos.
5. **Objetos animados** `caixa_costura` e `barril_custodia`: são spritesheets de uma linha (não têm 4 direções);
   como ator, usar só o quadro 0 parado e as animações do JSON.

## Dúvidas para o autor

- Os Caligosuins estão "fofo-ameaçadores" o bastante? (ver `docs/arte/capturas/sprites.png` e `retratos.png`)
