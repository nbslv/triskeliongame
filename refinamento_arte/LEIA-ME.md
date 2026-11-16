# Refinamento de arte

Esta pasta tem uma cópia de toda a arte do jogo para você editar e refinar.

- As subpastas são as mesmas do jogo: `sprites` (personagens e animações), `portraits`
  (retratos dos diálogos), `tilesets` (cenários e mapas), `images` (itens, objetos ampliados,
  emotes, título) e `icons` (ícone do jogo).
- Cada arquivo tem o **nome original + o tamanho em pixels**, por exemplo
  `icaro_triste__64x64.png` é o `icaro_triste.png` do jogo, com 64×64 pixels.
- `INDICE.csv` lista todos os arquivos, com o tamanho total, o tamanho de cada quadro (nas
  folhas de animação e nos tilesets) e o arquivo original correspondente no jogo.

## Regras para a arte voltar ao jogo sem quebrar nada

1. **Mantenha o nome do arquivo**, inclusive o sufixo `__LARGURAxALTURA`.
2. **Mantenha o tamanho exato** (mesma largura e altura). Em folhas de animação e tilesets,
   mantenha também a grade: cada quadro no mesmo lugar e com o mesmo tamanho.
3. Mantenha o fundo transparente onde ele já é transparente.

Para trazer a arte refinada de volta para o jogo:

    python3 tools/arte/refinamento.py importar

O comando copia cada imagem de volta para `assets/` com o nome original e recusa (listando o
motivo) qualquer imagem que tenha mudado de tamanho.

Para atualizar esta pasta com arte nova do jogo:

    python3 tools/arte/refinamento.py

Arquivos que você já editou (mais novos que o original) não são sobrescritos.
