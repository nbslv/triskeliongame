# Status — Mapas (frente 4)

Branch: `claude/triskelion-mapas`. O Prólogo está **jogável do começo ao fim**: `content/jogo.json` começa na casa de Ícaro.

## Feito

- **10 mapas** em `content/maps/` (Tiled JSON, tilesets embutidos de `docs/arte/tilesets/`):
  `prologo_casa_icaro` (14×10 + terreiro 14×8, no mesmo arquivo), `prologo_vila_manha`, `prologo_casa_custodia`,
  `prologo_padaria`, `prologo_biblioteca`, `prologo_cafezal`, `prologo_estrada`, `prologo_vila` (em chamas, **mesma planta** da manhã),
  `prologo_tunel` (escuro), `prologo_bambuzal` (com a capital ao longe).
- Os mapas são **gerados por código** (`tools/mapas/*.mjs`, rode `npm run mapas:gerar`) e abrem normalmente no Tiled.
  Editar à mão no Tiled funciona, mas o próximo `mapas:gerar` sobrescreve; escolham um dos dois fluxos.
  `node tools/mapas/renderizar.mjs <id> [saida.png]` desenha o mapa com marcadores/zonas (Chromium/Playwright).
- **Validador** `tools/mapas/validar.mjs` (ligado ao `npm test` por `tests/mapas.test.ts`): diálogos citados existem; todo marcador, ator e
  `scene.spawn` usado pelos roteiros existe no mapa certo (seguindo `scene` e `spawn`); portas com destino/entrada válidos; esconderijos e
  checkpoints são retângulos; patrulhas têm rota (≥ 2 marcadores `<rota>_pN`) ou `turn`; **BFS** por tiles livres da entrada até cada
  saída, gatilho, checkpoint, NPC e examinável de cada mapa.
- **Furtividade verificável**: `tools/mapas/furtividade.mjs` simula as patrulhas do motor (mesmas regras de `Patrol.ts`) e procura por busca em
  tempo × tiles um caminho sem ser visto nos trechos A, B e C, também com margem (+8 px de alcance, +10° de cone). Todos os trechos têm solução.
- **Robô de playtest** `scripts/jogar-prologo.mjs` (Chromium 844×390, teclado/clique): joga de “Novo jogo” até “prólogo concluído”
  (manhã nas 4 casas, café com o pai, porta trancada antes do café, colheita de 5 pés, Zefa, estrada, vila, pai, túnel, bambuzal).
  Última execução: **todas as verificações ✔, 0 erros de console**. Capturas em `docs/mapas/capturas/`.
  **Joga a furtividade de verdade** (0 capturas): a cada passo congela o jogo (`scene.pause`), lê o estado real das patrulhas, planeja com
  `tools/mapas/simulador.mjs` (busca em tempo × tiles a cada 62 ms, com margem) e dá um passo. `SEM_FURTIVIDADE=1` desliga a detecção (só para depurar).
  `CPU=4` emula CPU lenta (CDP); `START=vila` começa direto na vila em chamas.
  Medido: o movimento das patrulhas **não depende da taxa de quadros** (mesma velocidade por segundo de relógio a 60, 30 e 15 fps); as falhas em máquina
  lenta eram do robô (latência entre ler e agir), não do jogo. Nada foi alterado em `src/`.

## Tempo medido

- Robô, caminho direto (sem examinar tudo, sem cones): **~5 min** de andar + cutscenes com toques instantâneos.
- Texto obrigatório do caminho direto: ~11,5 mil caracteres (≈ 8–11 min de leitura a 17–25 car/s). Total estimado **11–15 min**, dentro da meta.
  Quem examina todas as casas e objetos fica por volta de 18 min.

## Decisões / desvios da especificação (11_prologo_marcadores.md)

- `gatilho_porta_sem_cafe` não existe como gatilho: a porta da frente usa `locked_if`/`locked_dialogue` (o próprio motor roda o diálogo).
- Atores de roteiro: o pai da manhã chama-se `pai` (o roteiro usa `actor: pai`), não `npc_pai_mesa`. Os demais moradores mantêm os nomes da spec e usam `sprite`.
- `barril_custodia` é um `examinar` (não NPC); `caixa_costura` não existe como ator (as `anim` dela são ignoradas pelo motor).
- Tonho na estrada já está no meio do caminho (não há “seguidor” no motor), junto ao gatilho dos fugitivos.
- `gatilho_casa` fica 4 tiles dentro da casa (linha do pai), não na soleira, para que dê tempo de examinar retrato e colchão antes; um `checkpoint_casa` com autosave fica na soleira.
- Porta da frente da casa de Ícaro sem `return: true`: as idas ao terreiro também gravam o ponto de retorno e levariam o jogador de volta ao terreiro.
- Os patrulheiros chamam-se `cali_a1`, `cali_b1`, `cali_b2`, `cali_c1`, `cali_c2` e `toucim_posto` (não colidem com `cali_1`, `cali_4`, `cali_5` e `toucim`, que os roteiros criam com `spawn`).
- A vila de manhã e à noite compartilham a planta; a casa de Ícaro à noite é a ruína aberta com os móveis nas mesmas posições (a mesa vira a viga caída).

## Pendências / problemas

- **Motor**: nada ainda roda `prologo_09_visto` / `prologo_09b_perdeu_de_vista` quando o jogador é visto (hoje só há o susto + fade + volta ao checkpoint).
  Acessibilidade “3 detecções → cone menor” também não existe no motor.
- **Motor**: `anim` de poses (`agachar`, `ajoelhar`…) depende da arte; sem ela, ignoradas.
- **Furtividade**: ficou *tranquila* (cone legível, 17–23 % da área vista a cada instante, solução em poucos segundos). Para deixar mais tenso
  basta ajustar `speed/vision/angle/wait` em `tools/mapas/vila.mjs` e conferir com `npm run mapas:furtividade`.
- Música: os mapas citam ids (`tema_casa`, `tema_cafezal`, `tema_tensao`, `tema_vila`, `tema_vila_em_chamas`, `tema_tunel`, `tema_noite_esperanca`);
  se algum não existir em `assets/audio/music/` o motor usa o provisório. A vila de manhã usa `tema_casa` (não há `tema_vila`).
- Fogo animado: os mapas só colocam tiles de `tiles_fogo`; as animações vêm do JSON do tileset (embutimos o JSON da arte no momento de gerar:
  rode `npm run mapas:gerar` de novo quando a arte atualizar `docs/arte/tilesets/tiles_fogo.json`).

## Conteúdo novo da narrativa (merge e9c21b0/cef5cd8)

- `prologo_vila_manha`: 7 `porta_trancada` (Laudelina, Orlando, Quim e Quitéria, Empório Prado, Lindalva, armazém, Rosário; `dono` + roteiros `prologo_trancada_*`)
  sobre as portas reais, a vitrine do Empório (`emporio_vitrine`, `examinar`) e nada disso na vila em chamas.
- NPCs com `tipo` (sem `dialogue`): `morador_1..4` (aldeao/aldea/idoso), `galinha_1..3`, `soldado_1`, `sobrevivente_1/2` e `figurante_1..3` no bambuzal.
- Propriedade de mapa `periodo`: casa/casas/vila_manha = manha; cafezal/estrada = tarde; vila/túnel/bambuzal = noite.
- O robô confere `prologo.abertura_vista` ao chegar ao cafezal.
