# 05 — Sistemas

Números aqui são **valores iniciais para balanceamento**: devem ir para `content/` como dados
(`characters.json`, `enemies.json`, `items.json`) e ser ajustados em teste. Princípio geral:
**simples de entender, rápido de jogar no celular, e cada herói com um jeito próprio.**

## 1. Atributos

| Sigla | Nome | O que faz |
|---|---|---|
| **PV** | Pontos de Vida | Chegou a 0, o herói **desmaia** (ninguém morre). |
| **PM** | Pontos de Magia | Custo das magias. Valéria não tem. |
| **FOR** | Força | Dano físico. |
| **MAG** | Magia | Dano mágico. |
| **DEF** | Defesa | Reduz dano físico. |
| **ESP** | Espírito | Reduz dano mágico e **aumenta as curas**. |
| **AGI** | Agilidade | Ordem dos turnos; chance de fugir. |

### Valores por nível (base + crescimento)

| Herói | Nível | PV | PM | FOR | MAG | DEF | ESP | AGI |
|---|---|---|---|---|---|---|---|---|
| Ícaro | 1 | 42 | 14 | 7 | 8 | 5 | 6 | 7 |
| Ícaro | 10 | 105 | 50 | 21 | 28 | 18 | 22 | 21 |
| Ícaro | 20 | 175 | 90 | 37 | 50 | 32 | 40 | 37 |
| Ícaro | 30 | 245 | 130 | 53 | 72 | 46 | 58 | 53 |
| Bento | 5 (entra) | 78 | 26 | 16 | 13 | 12 | 17 | 10 |
| Bento | 10 | 118 | 44 | 26 | 22 | 20 | 28 | 16 |
| Bento | 20 | 198 | 78 | 46 | 40 | 36 | 50 | 28 |
| Bento | 30 | 278 | 114 | 66 | 58 | 52 | 72 | 40 |
| Valéria | 8 (entra) | 137 | — | 28 | — | 26 | 11 | 15 |
| Valéria | 10 | 159 | — | 33 | — | 31 | 13 | 18 |
| Valéria | 20 | 269 | — | 59 | — | 55 | 23 | 31 |
| Valéria | 30 | 379 | — | 85 | — | 79 | 33 | 44 |
| Celly | 11 (entra) | 80 | 68 | 9 | 35 | 13 | 32 | 31 |
| Celly | 20 | 125 | 113 | 14 | 58 | 22 | 54 | 51 |
| Celly | 30 | 175 | 163 | 20 | 84 | 32 | 78 | 73 |

Crescimento por nível (somar ao valor de nível 1 e arredondar):

| Herói | Nível 1 (PV/PM/FOR/MAG/DEF/ESP/AGI) | Por nível |
|---|---|---|
| Ícaro | 42 / 14 / 7 / 8 / 5 / 6 / 7 | +7 / +4 / +1,6 / +2,2 / +1,4 / +1,8 / +1,6 |
| Bento | 46 / 12 / 8 / 6 / 6 / 8 / 5 | +8 / +3,5 / +2,0 / +1,8 / +1,6 / +2,2 / +1,2 |
| Valéria | 60 / 0 / 10 / 0 / 9 / 4 / 6 | +11 / 0 / +2,6 / 0 / +2,4 / +1,0 / +1,3 |
| Celly | 30 / 18 / 3 / 9 / 3 / 8 / 9 | +5 / +5 / +0,6 / +2,6 / +1,0 / +2,4 / +2,2 |

## 2. Níveis e XP

- Nível máximo: **30**. Nível esperado no fim: **27**.
- XP para o próximo nível: `XP(N) = arredondar(20 × N^1,3)`.

| Nível | XP p/ o próximo | XP acumulado |
|---|---|---|
| 1 | 20 | 0 |
| 2 | 49 | 20 |
| 5 | 162 | 273 |
| 10 | 399 | 1.538 |
| 15 | 676 | 4.074 |
| 20 | 983 | 8.056 |
| 24 | 1.245 | 12.376 |
| 27 | 1.451 | 16.316 |

- **Todos ganham o XP inteiro** de cada batalha (não divide; desmaiados também ganham).
- Quem entra no grupo chega **no nível de Ícaro**.
- Subir de nível **recupera todo o PV e PM** (pequena alegria, ajuda o ritmo).
- Meta de ritmo: 2 batalhas por nível no começo, 5–6 no fim; ~110 batalhas comuns no jogo.

## 3. Batalha por turnos

### Fluxo
1. Encostar num inimigo no mapa → transição → batalha (até 4 heróis × até 5 inimigos).
2. Cada **rodada**: o jogador escolhe a ação de cada herói; depois todos agem em ordem de AGI.
3. Vitória: XP, cobres, às vezes item. Derrota: ver `03_fases.md` (sem punição pesada).

### Comandos comuns
| Comando | Efeito |
|---|---|
| **Atacar** | Golpe básico com a arma (Físico). |
| **Técnica / Magia** | Lista própria do herói. |
| **Defender** | Dano recebido ÷2 até o próximo turno. |
| **Encorajar** | Remove Medo de um aliado; +1 Confiança em Celly; +10 Fúria em Valéria. |
| **Item** | Usa um item do inventário. |
| **Fugir** | Chance = 50% + (AGI do grupo − AGI dos inimigos) × 2%. Impossível contra chefes. |
| **AUTO** / **2×** | Botões sempre visíveis (ver seção 6). |

### Fórmulas
- **Dano físico** = `(FOR + ataque da arma) × poder − DEF do alvo ÷ 2`
- **Dano mágico** = `(MAG + foco) × poder − ESP do alvo ÷ 2`
- **Cura** = `(ESP + foco) × poder`
- Variação aleatória de ±10%. Dano mínimo 1. **Crítico:** 5% de chance, ×1,5.
- **Fraqueza** ×1,5; **resistência** ×0,5 (elementos em `04_inimigos_e_chefes.md`).
- Precisão base 95%; *Tonto* reduz para 50%.

### Inimigos — régua por nível N (inimigo comum)
`PV = 14 + 11N` · `ataque = 5 + 1,9N` · `DEF/ESP = 2 + 1,3N` · `AGI = 4 + 1,3N` ·
`XP = 4 + 2,2N` · `cobres = 3 + 1,5N`.
**Chefes:** PV ×6 a ×8; ataque ×1,3; XP ×10; cobres ×12; agem 1 vez por rodada (2 na fase final).

| N | PV | Ataque | DEF | AGI | XP | Cobres |
|---|---|---|---|---|---|---|
| 1 | 25 | 7 | 3 | 5 | 6 | 4 |
| 6 | 80 | 16 | 10 | 12 | 17 | 12 |
| 12 | 146 | 28 | 18 | 20 | 30 | 21 |
| 18 | 212 | 39 | 25 | 27 | 44 | 30 |
| 24 | 278 | 51 | 33 | 35 | 57 | 39 |
| 27 | 311 | 56 | 37 | 39 | 63 | 44 |

## 4. A dinâmica própria de cada herói

### Ícaro — **Calma** (0 a 3)
- **Respirar:** gasta o turno; +1 Calma; recupera 10% do PM.
- Magias de **Lumnia** consomem toda a Calma: ×1,0 / ×1,4 / ×1,8 / ×2,4 de poder (0/1/2/3).
- Levar um golpe crítico tira 1 Calma.
- Estilo: paciência recompensada — ou flechadas baratas enquanto junta fôlego.

| Nível | Habilidade | Custo | Efeito |
|---|---|---|---|
| 1 | **Tiro Certeiro** | 0 | Arco; Físico ×1,0; nunca erra |
| 3 | **Lumnia: Centelha** | 4 PM | Luz ×1,6, um alvo |
| 5 | **Alento** (com Bento) | 5 PM | Cura ×2,0, um aliado |
| 8 | **Golpe Firme** (com Valéria) | 3 PM | Físico ×1,7 com o cajado; 30% Atordoa |
| 9 | **Flecha de Luz** | 6 PM | Luz ×1,3; ignora resistência a Físico e a Luz |
| 12 | **Lumnia: Clarão** | 10 PM | Luz ×1,3, todos; remove Queimadura negra do grupo |
| 16 | **Runa-Broto** (com Celly) | 8 PM | Escudo: absorve 1 golpe de um aliado |
| 19 | **Lumnia: Aurora** | 16 PM | Luz ×2,4, um alvo; dissipa bônus do inimigo |
| 23 | **Chuva de Estrelas** | 22 PM | Luz ×1,8, todos |
| Final | **Lumnia: Triskelion** | cena | Só na batalha final, com 3 de Calma |

### Bento — **Graça** (0 a 5)
- Cada **bastonada** que acerta dá +1 Graça (+2 se crítico).
- Curas básicas custam só PM; as fortes custam PM **e** Graça.
- Não tem nenhuma magia de dano. ("Nada nos ensinamentos proíbe bater com o bastão.")

| Nível | Habilidade | Custo | Efeito |
|---|---|---|---|
| 5 | **Bastonada** | 0 | Físico ×1,0; +1 Graça |
| 5 | **Bênção Ligeira** | 4 PM | Cura ×2,2, um aliado |
| 6 | **Golinho** | 0 | +15% do PM; +25% FOR e −25% precisão por 2 turnos |
| 8 | **Purificar** | 5 PM, 1 Graça | Remove um estado negativo |
| 10 | **Giro do Peregrino** | 6 PM | Físico ×0,9 em todos; +1 Graça por alvo atingido |
| 13 | **Roda de Oração** | 12 PM, 2 Graça | Cura ×1,6, todos |
| 15 | **Sermão** | 6 PM | Um inimigo fica Tonto (ele fala demais) |
| 18 | **Levanta, Irmão!** | 14 PM, 3 Graça | Reanima um desmaiado com 50% do PV |
| 22 | **Bastão dos Ensinamentos** | 5 Graça | Físico ×3,0, um alvo; "tecnicamente não é feitiço" |
| 25 | **Milagre de Taverna** | 30 PM, 5 Graça | Cura total do grupo + remove estados |

### Valéria — **Fúria** (0 a 100)
- +15 ao causar dano; +10 ao receber; +25 ao proteger um aliado com Guarda; começa em 20.
- Sem PM. Todas as técnicas gastam Fúria. Não cai entre turnos; zera ao fim da batalha.

| Nível | Habilidade | Custo | Efeito |
|---|---|---|---|
| 8 | **Corte Limpo** | 0 | Físico ×1,0 |
| 8 | **Guarda** | 0 | Recebe os golpes no lugar de um aliado, com dano ÷2, por 1 turno |
| 9 | **Quebra-Elmo** | 30 | Físico ×1,6; −30% DEF do alvo por 3 turnos |
| 11 | **Grito de Guerra** | 20 | Atrai todos os ataques de um alvo só para ela por 2 turnos |
| 14 | **Varredura** | 40 | Físico ×1,2, todos |
| 17 | **Postura de Ferro** | 25 | +50% DEF e contra-ataca golpes físicos por 2 turnos |
| 20 | **Dona Justa** | 60 | Físico ×2,6, um alvo |
| 24 | **Juramento** | 100 | Físico ×3,5; se derrotar o alvo, o grupo recupera 15% do PV |

### Celly — **Confiança** (0 a 5)
- **Chance de falha** das magias: 30% / 20% / 10% / 0% / 0% / 0% (Confiança 0 a 5).
- Com Confiança 4–5, as magias ganham +20% / +40% de poder.
- +1 quando uma magia dá certo; +1 com *Encorajar* de um aliado; −1 ao perder mais de 25% do PV
  num golpe; −1 quando uma magia falha.
- **Confiança inicial em cada batalha** (sobe com a história): Floresta 0 → Caverna 1 →
  Brumaflor 2 → Fortaleza (despertar) **3 e nunca mais falha**.
- **Runas ficam em campo** por 3 turnos (máximo de 3 ao mesmo tempo).

| Nível | Habilidade | Custo | Efeito |
|---|---|---|---|
| 11 | **Pólen** | 0 | Feérico ×0,8; 30% de deixar Tonto |
| 11 | **Runa-Broto** | 6 PM | Runa: escudo que absorve 1 golpe de um aliado |
| 12 | **Orvalho** | 5 PM | Runa: o grupo recupera 6% do PV por turno |
| 14 | **Raiz Teimosa** | 7 PM | Um inimigo fica Enraizado e perde 25% de AGI |
| 16 | **Espinheiro** | 9 PM | Feérico ×1,6, um alvo |
| 18 | **Runa-Girassol** | 10 PM | Runa: +25% MAG e ESP para o grupo |
| 21 | **Ciranda** | 14 PM | Feérico ×1,2, todos; 30% de Enraizar |
| 23 | **Florescer** | 18 PM | Remove estados do grupo e enfraquecimentos de campo |
| Cap. 8 | **Nymphalion** | 30 PM, Confiança 5 | Círculo por 3 turnos: o grupo fica **imune a Sombra**, e inimigos de Sombra perdem 20% de ataque |

## 5. Itens, inventário e equipamento

### Inventário
- Uma lista só, dividida em abas: **Consumíveis**, **Equipamentos**, **Itens-chave**.
- Consumíveis empilham até **9** de cada. Itens-chave não podem ser vendidos.
- Equipamento: 3 espaços por herói — **Arma**, **Veste**, **Amuleto**.
  O **Colar da Mãe** ocupa o Amuleto de Ícaro durante o jogo todo (não removível; +5% PM e
  "fica morno").

### Consumíveis
| Item | Efeito | Preço |
|---|---|---|
| Rapadura | +20 PV | 10 |
| Broa de Milho | +60 PV | 30 |
| Bolo de Fubá | +150 PV | 80 |
| Tacho de Doce | +120 PV, grupo todo | 180 |
| Café Coado | +15 PM | 25 |
| Café Forte | +40 PM | 70 |
| Café da Torrinha (raro) | PV e PM totais de um herói | não se vende; baús e missões |
| Chá de Boldo | cura Enjoo e Tonto | 15 |
| Pomada de Arnica | cura Queimadura negra | 20 |
| Água de Cheiro | cura Murcho e Medo | 20 |
| Sais de Vinagre | reanima um desmaiado com 25% do PV | 90 |
| Mel Feérico (raro) | reanima com PV total | 300 (só Brumaflor) |
| Sininho de Fuga | fuga garantida | 40 |

### Equipamento por faixa (ataque/defesa aproximados e preço)
| Faixa | Capítulos | Arma (ataque) | Veste (defesa) | Preço médio |
|---|---|---|---|---|
| 1 | 1–2 | +3 a +5 | +2 a +3 | 40–80 |
| 2 | 3–4 | +8 a +11 | +6 a +8 | 150–250 |
| 3 | 5–6 | +14 a +17 | +11 a +13 | 350–500 |
| 4 | 7–8 | +21 a +25 | +17 a +20 | 650–900 |
| 5 | 9–10 | +30 (únicas, de chefes e missões) | +25 | não se compram |

Armas por herói: **Ícaro** — arcos (Físico) e o Cajado de Luminaer (dá *foco*; cresce com a
história, não se troca); **Bento** — bastões; **Valéria** — espadas de duas mãos; **Celly** —
varinhas de ramo (foco).
Amuletos dão efeitos, não números brutos (ex.: *Fita da Livinha* — Valéria começa com 40 de
Fúria; *Contas do Abade* — Bento começa com 2 de Graça; *Dedal Amassado* — imunidade a Medo).

## 6. Batalha automática (AUTO) e velocidade

- **AUTO** liga/desliga a qualquer momento, inclusive no meio da rodada (vale a partir do
  próximo herói). **2×** acelera animações e texto. As duas opções ficam salvas.
- O AUTO é **bom, não ótimo**: resolve inimigos comuns; em chefes, quem joga na mão se sai melhor.
- O AUTO **nunca usa** itens raros (Café da Torrinha, Mel Feérico) nem *Fugir*.

### Regras de IA (em ordem de prioridade; a primeira que valer é usada)

**Todos:**
1. Aliado desmaiado e tenho como reanimar → reanimar.
2. Algum aliado com PV < 35% e tenho cura (magia; se não, item comum) → curar o mais ferido.
3. Aliado com estado negativo grave (Queimadura negra, Atordoado, Medo) e tenho como curar → curar.

**Ícaro:** 4. PM < 20% → *Respirar*. 5. Inimigo com fraqueza a Luz e PM suficiente → a magia de
Luz mais barata que alcance todos, se houver 3+ inimigos; senão *Centelha*. 6. *Tiro Certeiro*
no inimigo com menos PV.

**Bento:** 4. Dois ou mais aliados com PV < 60% e Graça ≥ 2 → *Roda de Oração*. 5. Graça < 3 →
*Bastonada* no inimigo com menos PV. 6. Senão, *Bastonada*. (Nunca usa *Golinho* no AUTO.)

**Valéria:** 4. Aliado com PV < 35% e sem cura disponível no turno → *Guarda* nele.
5. Fúria ≥ 40 e 3+ inimigos → *Varredura*. 6. Fúria ≥ 30 e inimigo com armadura →
*Quebra-Elmo*. 7. *Corte Limpo* no inimigo com menos PV.

**Celly:** 4. Sem runa de escudo em campo e algum aliado com PV < 60% → *Runa-Broto* nele.
5. Sem *Orvalho* em campo e batalha com 3+ inimigos → *Orvalho*. 6. Inimigo com fraqueza a
Feérico → *Espinheiro*. 7. *Pólen*.

**Alvo padrão:** o inimigo com menos PV; em empate, o de maior ataque. Feiticeiros e Tambores
têm prioridade de alvo (marcados nos dados como `prioridade: alta`).

## 7. Salvamento

- **3 espaços manuais + 1 autosave**, em `localStorage`, com versão de esquema.
- **Lampiões de Aurelius** (pontos de save): pequenos lampiões de pedra espalhados pelo mundo.
  - **Lampião comum:** salva.
  - **Lampião dourado** (cidades e antes de todo chefe): salva **e recupera PV/PM do grupo**.
  - Em alguns lampiões chega uma **carta da Livinha** (texto curto + pequeno bônus).
- **Pousadas** (15 a 60 cobres): recuperam tudo e abrem uma **conversa de fogueira** opcional —
  cenas curtas entre os heróis (é onde o romance discreto e as piadas do grupo acontecem).
- **Autosave:** ao trocar de mapa, ao vencer um chefe, ao concluir um capítulo e ao fim do
  prólogo. Nunca durante batalha ou cutscene.
- O save guarda: mapa e posição, grupo (nível, XP, PV/PM, equipamento), inventário, cobres,
  flags de história, baús abertos, tempo de jogo, opções (AUTO, 2×, volume).

## 8. Moeda, lojas e economia

- Moeda única: **cobres**. (Piada recorrente: a matrícula da faculdade custa 3.000.)
- Lojas: **Mercearia** (consumíveis), **Ferraria/Ateliê** (equipamento), **Pergaminhos**
  (só em Áurea e Brumaflor: amuletos e itens raros). Vende-se por **metade** do preço.
- Renda esperada (inimigos + baús + chefes), acumulada:

| Fim do capítulo | Cobres ganhos (acumulado) | Gasto esperado |
|---|---|---|
| 1 | ~150 | consumíveis; 1 peça de faixa 1 |
| 2 | ~450 | completar a faixa 1 |
| 3 | ~1.000 | 2 peças de faixa 2 |
| 4 | ~1.700 | completar a faixa 2 |
| 6 | ~3.400 | faixa 3 quase inteira |
| 7 | ~4.800 | **aperto proposital**: faixa 4 é cara; escolher 2–3 peças |
| 8 | ~7.000 | completar a faixa 4 |
| 10 | ~9.000 | consumíveis para o final |

- Regra de bolso: o jogador que só segue a história compra **~70%** do equipamento de cada
  faixa; quem explora compra tudo. Nunca falta dinheiro para Rapadura e Café.
- **A matrícula:** perto do fim, o jogador finalmente tem 3.000 cobres. Se oferecer ao Diretor,
  ele recusa — "o senhor já pagou, e caro demais" — e devolve em forma de bolsa para outro
  aluno. (Sem efeito mecânico; conquista/flag de epílogo.)

## 9. Curva de dificuldade (resumo numérico)

| Capítulo | Nível do grupo | Nível dos inimigos | Inimigos por batalha | Rodadas esperadas |
|---|---|---|---|---|
| 1 | 1–4 | 1–3 | 1–2 | 2–3 |
| 2 | 4–7 | 4–6 | 2–3 | 2–3 |
| 3 | 7–10 | 7–9 | 2–4 | 3 |
| 4 | 10–13 | 10–12 | 3–4 | 3 |
| 5 | 13–15 | 13–14 | 2–3 | 3 |
| 6 | 15–17 | 15–16 | 3–4 | 3–4 |
| 7 | 17–20 | 17–19 | 3–4 | 3–4 |
| 8 | 20–24 | 20–23 | 4–5 | 4 |
| 10 | 25–27 | 24–27 | 4–5 | 4 |

- Batalha comum: **30–50 s** em velocidade normal, **15–25 s** em AUTO + 2×.
- Chefe: **3–6 min**; chefe final: **8–10 min** nas duas fases.
- Alvo de consumo: uma masmorra gasta ~60% do PM do grupo e 3–5 consumíveis até o lampião
  dourado do chefe.
- Se o grupo estiver **2+ níveis abaixo** do esperado ao chegar num chefe, o lampião dourado
  mostra uma dica gentil ("Vocês parecem cansados. Que tal treinar um pouco?").
