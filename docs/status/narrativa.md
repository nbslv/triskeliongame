# Status — Frente 1: Narrativa e Game Design

Branch: `claude/triskelion-narrativa`, com o merge do branch de coordenação até o commit
`cab53df` (inclui `docs/DECISOES_AUTOR.md`, o motor e os testes).

## 1. Estado das entregas

| Arquivo | Conteúdo | Estado |
|---|---|---|
| `content/dialogues/prologo_*.json` | 49 roteiros, 326 falas | Passam em `npm test` (236 testes); cópia em `tests/fixtures/prologo/` atualizada |
| `docs/gdd/10_prologo_roteiro.md` | Roteiro em 7 cenas, furtividade, flags, autosaves | Atualizado |
| `docs/gdd/11_prologo_marcadores.md` | 10 mapas, marcadores, gatilhos, atores | Atualizado |
| `docs/gdd/12_prologo_lista_assets.md` | Sprites, 29 retratos, tilesets, 10 músicas, 28 efeitos | Atualizado |
| `docs/gdd/01` a `07` | Mundo, personagens, fases, inimigos, sistemas, NPCs, cidades | Atualizados |

**Não feito:**
- Falas em JSON existem só para o prólogo. Os capítulos 1–11 e as casas de `07` estão em
  Markdown (resumo, textos de exame e falas-base).
- `content/characters.json`, `enemies.json` e `items.json` não foram criados; os números estão
  em `05_sistemas.md` e `04_inimigos_e_chefes.md`.
- Nada foi jogado: durações e balanceamento são estimativas.
- A lista de inimigos de `04` não foi ampliada para o jogo de ~12 h; só os níveis dos chefes.
- Não toquei em `content/maps/`, `src/` nem em `docs/COORDENACAO.md` / `docs/BRIEFING_ORIGINAL.md`.

## 2. Decisões do autor aplicadas

### Rodada das mensagens da coordenação
| Decisão | Onde |
|---|---|
| Monge = **Irmão Silvano**; nome real **Silvério Augusto de Argêntia** | todo o GDD |
| Duração 8–24 h (história ~10–14 h) | `03`, `05` |
| Só a dificuldade **Tranquila** | `05` |
| Clima cozy; músicas por clima e instrumentos | `05` seção 8; `12` |
| Salvar a qualquer momento; gravar ao sair da página | `05` seção 9; `03`, `06`, `10` |
| Casas exploráveis; 1–2 casas extras, lojas e treinos por cidade | `07`; prólogo (Cena 0) |

### `docs/DECISOES_AUTOR.md` (rodada 1)
| Item | O que mudou | Onde |
|---|---|---|
| q2 | Torrinha → **Valesol**, Anselmo → **Tadeo**, Helena → **Aurora**. Ids de falante (`pai`, `mae`) mantidos. Nenhum id, flag, marcador ou mapa continha "torrinha" | diálogos; todo o GDD |
| q6 | Província de nomes de luz e sol; clima ensolarado, cafezais em encostas e vales altos; **café Valesol**; a família de Ícaro é só de peões | `01`; falas do pai e da Zefa |
| q1 | Argêntia tem uma das 3 melhores escolas de magia, a **Escola de Cura de Pratamar**; Silvano se recusa a usar magia de ataque | `01`, `02`, `07` |
| q9 | Lucian só **desconfia** da linhagem Solis e **não conta nada** a Ícaro; admite apenas depois da carta | `01`, `02`, `03`, `07` |
| q11 | A carta seria entregue no **aniversário de 18 anos**; a mãe escondeu a linhagem por preferir a família à glória | `01`, `03` |
| q16 | O pós-jogo é a reconstrução de **Valesol** | `01`, `03` |
| q8 | Caligosuins **maus por escolha**; terceira espiral = **Ferro/Coragem**; **Toucim** é desertor individual e cômico; sem redenção coletiva | `01`, `02`, `04`, `06`, `07` |
| q12 | Nova origem de Celly, **aprovada**: Celestia da Rosa-Primeira, herdeira do clã cujo dever é guardar o Nymphalion; o *Despetalar* riscou nome e clã; o grupo só descobre no epílogo | `01`, `02`, `03`, `06`, `07` |
| q17 | Valéria tem **19**; Silvano **nunca** flerta com ela; ela dá bronca quando ele flerta com outras, sem sentimento por ele | `01`, `02` |
| q18 | Sem humor na vila destruída, exceto entre os Caligosuins (perdem Ícaro de vista, acham que viram algo, uma troca curta) | diálogos 08, 09b (novo), 10, 11 e examináveis; `10` |
| q3, q4, q5, q7, q10, q13, q14, q15, q19 | Aprovadas como estavam; marcas de "proposta" removidas | `01`, `02`, `03` |

### Consequências que valem conferir
- Para cumprir q8 saíram do GDD: os "Suínos da Brasa", o inimigo Leitão Fagulha e o cozinheiro
  Caligosuin simpático. O cozinheiro Banha virou um **humano capturado**; o dormitório dos
  leitões virou uma **Sala dos Troféus**.
- Para não colidir com o nome da mãe: a magia "Lumnia: Aurora" virou **Lumnia: Amanhecer** e a
  prisioneira "Aurora" virou **Alvina**. "Morgrunho, o Sem-Aurora" ficou.
- No prólogo saíram o espirro na bandeira, a discussão "tragam o café / queimem o café", a
  biblioteca queimada por um espirro e as piadas da Dona Custódia no barril.

## 3. Para as outras sessões

- **Motor:** novo roteiro `prologo_09b_perdeu_de_vista`, para um evento opcional de "quase
  visto" na furtividade (no máximo 1 vez por trecho, sem tirar o controle). O efeito
  `cali_espirro` deixou de ser usado.
- **Arte:** o Caligosuin soldado troca a animação `espirrar` por `olhar_em_volta`.
- **Mapas:** nenhum marcador mudou de nome; `11` só ganhou a linha do evento acima.
- O GDD pede vários sistemas além de batalha (5 minijogos de treino, cozinhar, pescar,
  acampamento, caixas de correio). A ordem de implementação é decisão da coordenação.

## 4. Respostas do autor nesta conversa (13/11/2026)

- **Fala do pai sobre o colchão:** o autor achou pouco natural. Trocada por *"Sabia. Quase toda
  noite você dormia em cima de um. Eu apagava a vela e te cobria."* em
  `prologo_12_pai_confissao` (e na cópia de testes), `10` e `02`.
- **Nomes dos NPCs e lugares menores:** aprovados (lugares da província, Escola de Cura de
  Pratamar, Mestra Serena, NPCs de `06` e `07`).
- **Treinos e minijogos, conversas de fogueira e acampamento:** aprovados como descritos em
  `05` (seções 7 e 8) e `07`.

- **Cozinha e pesca:** entram, mas **opcionais e lúdicas**, para ver a interação dos
  personagens; nada no jogo exige comida feita em casa ou peixe (`05` seção 8; `03`).
- **Pós-jogo (reconstruir Valesol):** **primordial**. Detalhado em 6 etapas, 2–3 h, sem
  batalhas, até a Festa da Colheita e a escola de magia de Valesol (`03` seção 6; `01`; `07`).

## 5. Pendências para o autor

Nenhuma no momento.
