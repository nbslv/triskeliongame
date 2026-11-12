# 05 — Sistemas

Números aqui são **valores iniciais para balanceamento**: devem ir para `content/` como dados
(`characters.json`, `enemies.json`, `items.json`) e ser ajustados em teste. Princípio geral:
**simples de entender, rápido de jogar no celular, e cada herói com um jeito próprio.**

Decisões do autor que guiam este documento (ver `docs/COORDENACAO.md`):
- **Duração:** jogo completo de 8–24 h; história principal de ~10–14 h.
- **Dificuldade:** a versão inicial tem **só a Tranquila** (fácil). Todos os números abaixo são
  dela. Outras dificuldades ficam como nota de expansão (seção 12).
- **Clima:** majoritariamente aconchegante, com momentos de tensão e batalha.
- **Salvar a qualquer momento.**

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

### Valores por nível (sem contar treino e equipamento)

| Herói | Nível | PV | PM | FOR | MAG | DEF | ESP | AGI |
|---|---|---|---|---|---|---|---|---|
| Ícaro | 1 | 42 | 14 | 7 | 8 | 5 | 6 | 7 |
| Ícaro | 10 | 105 | 50 | 21 | 28 | 18 | 22 | 21 |
| Ícaro | 20 | 175 | 90 | 37 | 50 | 32 | 40 | 37 |
| Ícaro | 30 | 245 | 130 | 53 | 72 | 46 | 58 | 53 |
| Ícaro | 40 | 315 | 170 | 69 | 94 | 60 | 76 | 69 |
| Silvano | 6 (entra) | 86 | 30 | 18 | 15 | 14 | 19 | 11 |
| Silvano | 20 | 198 | 78 | 46 | 40 | 36 | 50 | 28 |
| Silvano | 40 | 358 | 148 | 86 | 76 | 68 | 94 | 52 |
| Valéria | 10 (entra) | 159 | — | 33 | — | 31 | 13 | 18 |
| Valéria | 20 | 269 | — | 59 | — | 55 | 23 | 31 |
| Valéria | 40 | 489 | — | 111 | — | 103 | 43 | 57 |
| Celly | 15 (entra) | 100 | 88 | 11 | 45 | 17 | 42 | 40 |
| Celly | 20 | 125 | 113 | 14 | 58 | 22 | 54 | 51 |
| Celly | 40 | 225 | 213 | 26 | 110 | 42 | 102 | 95 |

Fórmula: `valor = nível 1 + crescimento × (nível − 1)`, arredondado.

| Herói | Nível 1 (PV/PM/FOR/MAG/DEF/ESP/AGI) | Por nível |
|---|---|---|
| Ícaro | 42 / 14 / 7 / 8 / 5 / 6 / 7 | +7 / +4 / +1,6 / +2,2 / +1,4 / +1,8 / +1,6 |
| Silvano | 46 / 12 / 8 / 6 / 6 / 8 / 5 | +8 / +3,5 / +2,0 / +1,8 / +1,6 / +2,2 / +1,2 |
| Valéria | 60 / 0 / 10 / 0 / 9 / 4 / 6 | +11 / 0 / +2,6 / 0 / +2,4 / +1,0 / +1,3 |
| Celly | 30 / 18 / 3 / 9 / 3 / 8 / 9 | +5 / +5 / +0,6 / +2,6 / +1,0 / +2,4 / +2,2 |

## 2. Níveis e XP

- Nível máximo: **50**. Nível esperado ao terminar a história principal: **~40**.
- XP para o próximo nível: `XP(N) = arredondar(20 × N^1,3)`.

| Nível | XP p/ o próximo | XP acumulado |
|---|---|---|
| 1 | 20 | 0 |
| 5 | 162 | 273 |
| 9 | 348 | 1.190 |
| 14 | 618 | 3.456 |
| 18 | 857 | 6.280 |
| 21 | 1.047 | 9.039 |
| 25 | 1.313 | 13.621 |
| 29 | 1.593 | 19.289 |
| 34 | 1.959 | 27.978 |
| 40 | 2.419 | 40.871 |
| 49 | 3.150 | 65.535 |

- **Todos ganham o XP inteiro** de cada batalha (não divide; desmaiados também ganham).
- Quem entra no grupo chega **no nível de Ícaro**.
- Subir de nível **recupera todo o PV e PM**.
- Ritmo: 2 batalhas por nível no começo, 6–8 no fim; **~200 batalhas comuns** na história
  principal (o treino e as missões cobrem o resto — seção 7).

## 3. Batalha por turnos

### Fluxo
1. Encostar num inimigo no mapa → transição → batalha (até 4 heróis × até 5 inimigos).
2. Cada **rodada**: o jogador escolhe a ação de cada herói; depois todos agem em ordem de AGI.
3. Vitória: XP, cobres, às vezes item ou ingrediente.

### Comandos comuns
| Comando | Efeito |
|---|---|
| **Atacar** | Golpe básico com a arma (Físico). |
| **Técnica / Magia** | Lista própria do herói. |
| **Defender** | Dano recebido ÷2 até o próximo turno. |
| **Encorajar** | Remove Medo de um aliado; +1 Confiança em Celly; +10 Fúria em Valéria. |
| **Item** | Usa um item do inventário. |
| **Fugir** | Na Tranquila, **sempre funciona** (exceto contra chefes). |
| **AUTO** / **2×** | Botões sempre visíveis (seção 6). |

### Fórmulas
- **Dano físico** = `(FOR + ataque da arma) × poder − DEF do alvo ÷ 2`
- **Dano mágico** = `(MAG + foco) × poder − ESP do alvo ÷ 2`
- **Cura** = `(ESP + foco) × poder`
- Variação aleatória de ±10%. Dano mínimo 1. **Crítico:** 5% de chance, ×1,5.
- **Fraqueza** ×1,5; **resistência** ×0,5 (elementos em `04_inimigos_e_chefes.md`).
- Precisão base 95%; *Tonto* reduz para 50%.

### Inimigos — régua por nível N (inimigo comum, dificuldade Tranquila)
`PV = 12 + 10N` · `ataque = 4 + 1,6N` · `DEF/ESP = 2 + 1,2N` · `AGI = 4 + 1,3N` ·
`XP = 4 + 2,2N` · `cobres = 3 + 1,5N`.
**Chefes:** PV ×6 a ×8; ataque ×1,25; XP ×10; cobres ×12; agem 1 vez por rodada (2 na fase final).

| N | PV | Ataque | DEF | AGI | XP | Cobres |
|---|---|---|---|---|---|---|
| 1 | 22 | 6 | 3 | 5 | 6 | 4 |
| 5 | 62 | 12 | 8 | 10 | 15 | 10 |
| 10 | 112 | 20 | 14 | 17 | 26 | 18 |
| 15 | 162 | 28 | 20 | 24 | 37 | 26 |
| 20 | 212 | 36 | 26 | 30 | 48 | 33 |
| 25 | 262 | 44 | 32 | 36 | 59 | 40 |
| 30 | 312 | 52 | 38 | 43 | 70 | 48 |
| 35 | 362 | 60 | 44 | 50 | 81 | 56 |
| 40 | 412 | 68 | 50 | 56 | 92 | 63 |

### Regras gentis da Tranquila
- **Depois de cada batalha vencida**, heróis desmaiados acordam com 25% do PV.
- **Perder uma batalha comum:** o grupo "acorda" no mesmo mapa, a poucos passos, com 50% de
  PV/PM. Não perde XP, itens nem cobres. O inimigo continua lá.
- **Perder para um chefe:** "Tentar de novo" na hora, com PV/PM cheios, da fase em que caiu.
  Depois de 2 derrotas seguidas, aparece a opção **"Uma mãozinha"**: +25% de PV e dano para o
  grupo naquela luta (sem custo, sem vergonha).
- Estados negativos **somem ao fim da batalha**.
- Chefes **anunciam** o golpe forte um turno antes (texto e pose), para dar tempo de defender.
- Todo tutorial pode ser revisto no menu, em **"Caderno do Ícaro"**.

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
| 6 | **Alento** (com Silvano) | 5 PM | Cura ×2,0, um aliado |
| 10 | **Golpe Firme** (com Valéria) | 3 PM | Físico ×1,7 com o cajado; 30% Atordoa |
| 13 | **Flecha de Luz** | 6 PM | Luz ×1,3; ignora resistência a Físico e a Luz |
| 17 | **Lumnia: Clarão** | 10 PM | Luz ×1,3, todos; remove Queimadura negra do grupo |
| 22 | **Runa-Broto** (com Celly) | 8 PM | Escudo: absorve 1 golpe de um aliado |
| 27 | **Lumnia: Amanhecer** | 16 PM | Luz ×2,4, um alvo; dissipa bônus do inimigo |
| 33 | **Chuva de Estrelas** | 22 PM | Luz ×1,8, todos |
| Final | **Lumnia: Triskelion** | cena | Só na batalha final, com 3 de Calma |

### Silvano — **Graça** (0 a 5)
- Cada **bastonada** que acerta dá +1 Graça (+2 se crítico).
- Curas básicas custam só PM; as fortes custam PM **e** Graça.
- Não tem nenhuma magia de dano. ("Nada nos ensinamentos proíbe bater com o bastão.")

| Nível | Habilidade | Custo | Efeito |
|---|---|---|---|
| 6 | **Bastonada** | 0 | Físico ×1,0; +1 Graça |
| 6 | **Bênção Ligeira** | 4 PM | Cura ×2,2, um aliado |
| 8 | **Golinho** | 0 | +15% do PM; +25% FOR e −25% precisão por 2 turnos |
| 11 | **Purificar** | 5 PM, 1 Graça | Remove um estado negativo |
| 14 | **Giro do Peregrino** | 6 PM | Físico ×0,9 em todos; +1 Graça por alvo atingido |
| 18 | **Roda de Oração** | 12 PM, 2 Graça | Cura ×1,6, todos |
| 21 | **Sermão** | 6 PM | Um inimigo fica Tonto (ele fala demais) |
| 25 | **Levanta, Irmão!** | 14 PM, 3 Graça | Reanima um desmaiado com 50% do PV |
| 31 | **Bastão dos Ensinamentos** | 5 Graça | Físico ×3,0, um alvo; "tecnicamente não é feitiço" |
| 36 | **Milagre de Taverna** | 30 PM, 5 Graça | Cura total do grupo + remove estados |

### Valéria — **Fúria** (0 a 100)
- +15 ao causar dano; +10 ao receber; +25 ao proteger um aliado com Guarda; começa em 20.
- Sem PM. Todas as técnicas gastam Fúria. Não cai entre turnos; zera ao fim da batalha.

| Nível | Habilidade | Custo | Efeito |
|---|---|---|---|
| 10 | **Corte Limpo** | 0 | Físico ×1,0 |
| 10 | **Guarda** | 0 | Recebe os golpes no lugar de um aliado, com dano ÷2, por 1 turno |
| 12 | **Quebra-Elmo** | 30 | Físico ×1,6; −30% DEF do alvo por 3 turnos |
| 15 | **Grito de Guerra** | 20 | Atrai todos os ataques de um alvo só para ela por 2 turnos |
| 19 | **Varredura** | 40 | Físico ×1,2, todos |
| 24 | **Postura de Ferro** | 25 | +50% DEF e contra-ataca golpes físicos por 2 turnos |
| 29 | **Dona Justa** | 60 | Físico ×2,6, um alvo |
| 35 | **Juramento** | 100 | Físico ×3,5; se derrotar o alvo, o grupo recupera 15% do PV |

### Celly — **Confiança** (0 a 5)
- **Chance de falha** das magias: 25% / 15% / 5% / 0% / 0% / 0% (Confiança 0 a 5).
  Uma magia que falha **não gasta PM** (na Tranquila, falhar é só um "ops").
- Com Confiança 4–5, as magias ganham +20% / +40% de poder.
- +1 quando uma magia dá certo; +1 com *Encorajar* de um aliado; −1 ao perder mais de 25% do PV
  num golpe; −1 quando uma magia falha.
- **Confiança inicial em cada batalha** (sobe com a história): Floresta 0 → Caverna 1 →
  Brumaflor 2 → Fortaleza (despertar) **3 e nunca mais falha**.
- **Runas ficam em campo** por 3 turnos (máximo de 3 ao mesmo tempo).

| Nível | Habilidade | Custo | Efeito |
|---|---|---|---|
| 15 | **Pólen** | 0 | Feérico ×0,8; 30% de deixar Tonto |
| 15 | **Runa-Broto** | 6 PM | Runa: escudo que absorve 1 golpe de um aliado |
| 16 | **Orvalho** | 5 PM | Runa: o grupo recupera 6% do PV por turno |
| 19 | **Raiz Teimosa** | 7 PM | Um inimigo fica Enraizado e perde 25% de AGI |
| 22 | **Espinheiro** | 9 PM | Feérico ×1,6, um alvo |
| 25 | **Runa-Girassol** | 10 PM | Runa: +25% MAG e ESP para o grupo |
| 29 | **Ciranda** | 14 PM | Feérico ×1,2, todos; 30% de Enraizar |
| 32 | **Florescer** | 18 PM | Remove estados do grupo e enfraquecimentos de campo |
| Cap. 8 | **Nymphalion** | 30 PM, Confiança 5 | Círculo por 3 turnos: o grupo fica **imune a Sombra**, e inimigos de Sombra perdem 20% de ataque |

Habilidades extras vêm de **treino** (seção 7), missões e chefes — nunca só de nível.

## 5. Itens, inventário e equipamento

### Inventário
- Abas: **Consumíveis**, **Ingredientes**, **Equipamentos**, **Decoração**, **Itens-chave**.
- Consumíveis e ingredientes empilham até **20**. Itens-chave não podem ser vendidos.
- Equipamento: 3 espaços por herói — **Arma**, **Veste**, **Amuleto**.
  O **Colar da Mãe** ocupa o Amuleto de Ícaro durante o jogo todo (não removível; +5% PM e
  "fica morno").

### Consumíveis
| Item | Efeito | Preço |
|---|---|---|
| Rapadura | +30 PV | 10 |
| Broa de Milho | +80 PV | 30 |
| Bolo de Fubá | +200 PV | 80 |
| Tacho de Doce | +150 PV, grupo todo | 180 |
| Café Coado | +20 PM | 25 |
| Café Forte | +60 PM | 70 |
| Café Valesol (raro) | PV e PM totais de um herói | não se vende; baús, missões, cozinha |
| Chá de Boldo | cura Enjoo e Tonto | 15 |
| Pomada de Arnica | cura Queimadura negra | 20 |
| Água de Cheiro | cura Murcho e Medo | 20 |
| Sais de Vinagre | reanima um desmaiado com 50% do PV | 90 |
| Mel Feérico (raro) | reanima com PV total | 300 (só Brumaflor) |

### Equipamento por faixa
| Faixa | Capítulos | Arma (ataque) | Veste (defesa) | Preço médio |
|---|---|---|---|---|
| 1 | 1–2 | +3 a +6 | +2 a +4 | 40–100 |
| 2 | 3–4 | +10 a +14 | +8 a +11 | 200–400 |
| 3 | 5–6 | +19 a +24 | +15 a +19 | 600–900 |
| 4 | 7–8 | +30 a +36 | +24 a +29 | 1.200–1.800 |
| 5 | 9–10 | +44 (únicas, de chefes, missões e treino) | +36 | não se compram |

Armas por herói: **Ícaro** — arcos (Físico) e o Cajado de Luminaer (dá *foco*; cresce com a
história, não se troca); **Silvano** — bastões; **Valéria** — espadas de duas mãos; **Celly** —
varinhas de ramo (foco).
Amuletos dão efeitos, não números brutos (ex.: *Fita da Livinha* — Valéria começa com 40 de
Fúria; *Contas do Abade* — Silvano começa com 2 de Graça; *Dedal Amassado* — imunidade a Medo).

## 6. Batalha automática (AUTO) e velocidade

- **AUTO** liga/desliga a qualquer momento, inclusive no meio da rodada (vale a partir do
  próximo herói). **2×** acelera animações e texto. As duas opções ficam salvas.
- Na Tranquila, o AUTO **vence qualquer batalha comum** com o grupo no nível esperado, e vence
  a maioria dos chefes (mais devagar do que na mão). É uma opção legítima para quem não joga RPG.
- O AUTO **nunca usa** itens raros (Café Valesol, Mel Feérico) nem *Fugir*.

### Regras de IA (em ordem de prioridade; a primeira que valer é usada)

**Todos:**
1. Aliado desmaiado e tenho como reanimar → reanimar.
2. Algum aliado com PV < 40% e tenho cura (magia; se não, item comum) → curar o mais ferido.
3. Aliado com estado negativo grave (Queimadura negra, Atordoado, Medo) e tenho como curar → curar.
4. O chefe anunciou um golpe forte e meu PV < 60% → *Defender*.

**Ícaro:** 5. PM < 20% → *Respirar*. 6. Inimigo com fraqueza a Luz e PM suficiente → a magia de
Luz mais barata que alcance todos, se houver 3+ inimigos; senão *Centelha*. 7. *Tiro Certeiro*
no inimigo com menos PV.

**Silvano:** 5. Dois ou mais aliados com PV < 60% e Graça ≥ 2 → *Roda de Oração*. 6. Senão,
*Bastonada* no inimigo com menos PV. (Nunca usa *Golinho* no AUTO.)

**Valéria:** 5. Aliado com PV < 35% e sem cura disponível no turno → *Guarda* nele.
6. Fúria ≥ 40 e 3+ inimigos → *Varredura*. 7. Fúria ≥ 30 e inimigo com armadura →
*Quebra-Elmo*. 8. *Corte Limpo* no inimigo com menos PV.

**Celly:** 5. Confiança ≤ 1 e outro herói livre → pede *Encorajar* (o próximo aliado sem ação
urgente a encoraja). 6. Sem runa de escudo em campo e algum aliado com PV < 60% → *Runa-Broto*.
7. Sem *Orvalho* em campo e 3+ inimigos → *Orvalho*. 8. Inimigo com fraqueza a Feérico →
*Espinheiro*. 9. *Pólen*.

**Alvo padrão:** o inimigo com menos PV; em empate, o de maior ataque. Feiticeiros e Tambores
têm prioridade de alvo (marcados nos dados como `prioridade: alta`).

## 7. Treino (força e magia)

Toda cidade tem **um local de treino de força** e **um de magia** (lista completa em
`07_cidades_e_servicos.md`). O treino é um **complemento** à XP de batalha: quem não gosta de
lutar evolui treinando; quem só luta não fica para trás.

### Regras
| Regra | Valor |
|---|---|
| Custo | **Grátis** na primeira sessão de cada tipo em cada visita; as seguintes custam cobres (tabela) |
| Limite | **3 sessões de força + 3 de magia por cidade, por capítulo.** O limite renova quando a história avança um capítulo (os mestres dizem "volte quando tiver vivido mais um pouco") |
| Duração | 30–60 s por sessão. Sempre um minijogo de toque simples |
| Resultado | **Bronze / Prata / Ouro**. Não existe "falhar": Bronze é garantido só por participar |
| Quem treina | O jogador escolhe **um herói** por sessão (força: Ícaro, Silvano, Valéria; magia: Ícaro, Silvano, Celly) |
| Acessibilidade | Todo minijogo tem o botão **"Treinar no automático"**: resultado Prata, sem jogar |

### Ganhos por sessão
| Resultado | Atributo | XP de treino |
|---|---|---|
| Bronze | +1 no atributo principal | 40% do XP de uma batalha comum da região |
| Prata | +1 no principal, +1 no secundário | 70% |
| Ouro | +2 no principal, +1 no secundário | 100% |

- **Força:** principal FOR; secundário DEF ou PV (+5).
- **Magia:** principal MAG; secundário ESP ou PM (+3).
- Custo das sessões pagas: `10 × número do capítulo` cobres (2ª) e o dobro (3ª).
- **Teto:** o treino soma no máximo **+25% sobre o valor-base** de cada atributo naquele nível
  (o medidor fica "cheio por enquanto" e volta a encher quando o herói sobe de nível).
- **Habilidades de treino:** o **1º Ouro** em cada local ensina uma habilidade ou dá um amuleto
  (ex.: Arena dos Juramentos → Ícaro aprende *Golpe Firme* antes do nível; Biblioteca da
  Faculdade → *Flecha de Luz* antecipada; Círculo Feérico → Celly aprende *Orvalho Duplo*).
- Conta total: quem fizer todos os treinos chega ao fim com cerca de **+20% de atributos** e
  ~3 níveis a mais do que quem não fizer nenhum. O jogo é vencível sem treinar.

### Os minijogos (cinco modelos, reaproveitados com roupagens diferentes)
| Modelo | Como se joga | Roupagens |
|---|---|---|
| **Ritmo** | Tocar A quando o marcador passa pelo alvo (8–12 batidas) | Partir lenha; malhar ferro na forja; acertar runas no compasso; socar pilão de café |
| **Sequência** | Repetir uma ordem de 3 a 6 itens que acende e apaga | Acender lanternas na ordem; tocar os sinos do mosteiro; cristais da caverna |
| **Carregar** | Levar algo de A até B equilibrando no joystick, sem derrubar | Sacas de café; baldes d'água; pilha de livros da biblioteca |
| **Fôlego** | Segurar e soltar A acompanhando um círculo que respira (o *Respirar* do Ícaro) | Meditar com Silvano; ouvir a floresta; "calma, respiração firme, mãos quentes" |
| **Duelo amigo** | 3 trocas de "pedra-papel-tesoura" com dicas visuais (ataque, defesa, finta) | Treinar com Valéria; espada de madeira com a Livinha; boneco de palha |

No **prólogo** só há prévias, sem loja e sem números: a colheita no cafezal ("trabalho pesado
fortalece a Força") e o livro escondido ("estudar fortalece a Magia").

## 8. Atividades aconchegantes

O jogo é **majoritariamente cozy**: entre uma masmorra e outra, sempre há uma cidade com coisas
tranquilas para fazer. Tudo aqui é opcional, curto e sem punição.

| Atividade | Onde | Como funciona | O que dá |
|---|---|---|---|
| **Colheita** | Cafezal (Ato 3), hortas, pomares, canteiros feéricos | Andar e apertar A nos pés maduros (como no prólogo) | Ingredientes; cobres ao entregar |
| **Cozinhar** | Fogueira do acampamento, cozinhas de pousada | Escolher receita + ingredientes; minijogo de Ritmo curto (mexer a panela) | Comidas melhores que as de loja; a receita favorita de cada herói dá um bônus só para ele |
| **Pescar** | Rios, o Lago Parado, o cais de Pratamar | Esperar a boia afundar e tocar A; segurar no peixe grande | Peixes (ingrediente/venda); raridades para missões |
| **Ajudar moradores** | Todas as cidades | Recados, entregas, consertos — as missões secundárias de `06_npcs.md` | Cobres, receitas, decoração, amizade |
| **Casas exploráveis** | Todas as cidades | Entrar, examinar objetos, conversar | História dos personagens; ganchos de missão |
| **Acampamento do grupo** | Mapa-múndi (botão "Acampar") e pontos de fogueira | Ver abaixo | Descanso, conversas, decoração |
| **Cartas da Livinha** | Caixas de correio nas cidades | Ler; às vezes responder com uma escolha | Desenhos (decoração), pequenos bônus |
| **Caderno do Ícaro** | Menu | Bestiário desenhado, receitas, tutoriais, resumo da história | Completar páginas dá carimbos (conquistas) |

### O acampamento
- Disponível a partir do Capítulo 2 (quando o grupo passa a ter mais de uma pessoa).
- É um mapa pequeno e fixo: fogueira, barracas, a carroça. Acampar **recupera PV/PM** de graça.
- **Decorar:** itens de decoração (tapete da Dona Custódia, lampiões de papel de Brumaflor,
  bandeirinha de Bravaferro, vaso com muda de café) são colocados em pontos livres.
  Cada herói tem **um cantinho** que ele mesmo arruma conforme o arco avança (o espelho do
  Silvano; a pedra de amolar da Valéria; a casinha de noz da Celly; a pilha de livros do Ícaro).
- **Conversas de fogueira:** cenas curtas (1–2 min) entre dois ou mais heróis. Uma nova fica
  disponível a cada trecho da história; um ícone sobre a fogueira avisa. É aqui que os laços —
  e o **romance discreto de Ícaro e Valéria** — acontecem (roteiro-base em `01_mundo_e_historia.md`).
- **Cozinhar junto:** quem cozinha comenta. (Silvano tempera demais. Valéria só sabe assar.
  Celly mede tudo. Ícaro faz o café — e ninguém mais tem permissão de fazer o café.)

## 9. Salvamento

Decisão do autor: **salvar é crítico; nunca perder mais que ~1 minuto.**

- **Salvar a qualquer momento** pelo menu de pausa: **3 espaços manuais**. Só não é possível no
  meio de uma batalha ou cutscene — nesses casos vale o autosave feito no início dela.
- **Autosave frequente:** ao trocar de mapa; depois de toda cutscene e de toda batalha; a cada
  ~60 s de exploração; ao concluir missão, treino ou atividade; antes de todo chefe.
- **Ao sair da página:** o jogo grava sozinho quando a aba é ocultada ou fechada e, na volta,
  oferece **"Retomar de onde parou"**.
- **Exportar/importar** o save em arquivo (para trocar de aparelho ou guardar cópia).
- **Lampiões de Aurelius:** pequenos lampiões de pedra pelo mundo. Como salvar já é livre, eles
  têm outro papel: marcam **lugares seguros** (inimigos não chegam perto), **recuperam PV/PM**
  (os dourados, antes de chefes e nas cidades) e são **pontos de viagem rápida** dentro de
  masmorras já visitadas. Acender um lampião também faz um autosave.
- **Pousadas** (15 a 80 cobres) servem para **descansar e curar**, cozinhar, e ver as
  **conversas de grupo** da cidade. Não são necessárias para salvar.
- O save guarda: mapa e posição, grupo (nível, XP, PV/PM, equipamento, treinos feitos),
  inventário, cobres, flags de história, baús abertos, decoração do acampamento, tempo de jogo,
  opções (AUTO, 2×, volume).
- **No roteiro:** cada capítulo lista seus autosaves de história; os do prólogo estão em
  `10_prologo_roteiro.md`.

## 10. Moeda, lojas e economia

- Moeda única: **cobres**. (Piada recorrente: a matrícula da faculdade custa 3.000.)
- Em toda cidade: **Mercearia** (consumíveis e ingredientes) e **Ferraria/Ateliê**
  (equipamento). Em algumas: **Pergaminhos/Joalheria** (amuletos) e **Bazar** (decoração).
  Vende-se por **metade** do preço. **O estoque melhora com a região** e também quando a
  história avança (lojas antigas ganham itens novos — vale a pena voltar).
- Fontes de renda: batalhas, baús, missões, venda de peixe e colheita, entregas.
- Renda esperada, acumulada (história principal, sem extras):

| Fim do capítulo | Cobres (acumulado) | Gasto esperado |
|---|---|---|
| 1 | ~300 | consumíveis; 1–2 peças de faixa 1 |
| 2 | ~900 | completar a faixa 1 |
| 3 | ~2.200 | 2–3 peças de faixa 2 |
| 4 | ~4.000 | completar a faixa 2 |
| 6 | ~8.500 | faixa 3 quase inteira |
| 7 | ~12.000 | **aperto leve e proposital**: a faixa 4 é cara (eco do tema da desigualdade) |
| 8 | ~17.000 | completar a faixa 4 |
| 10 | ~22.000 | consumíveis para o final; decoração |

- Regra de bolso (Tranquila): quem só segue a história compra **~80%** do equipamento de cada
  faixa; com atividades cozy, compra tudo e sobra para decoração. Nunca falta dinheiro para
  Rapadura e Café.
- **A matrícula:** no fim, se o jogador oferecer 3.000 cobres ao Diretor, ele recusa — "o senhor
  já pagou, e caro demais" — e transforma o valor em bolsa para outro aluno. (Sem efeito
  mecânico; carimbo no Caderno e uma fala no epílogo.)

## 11. Curva de dificuldade (Tranquila)

| Capítulo | Nível do grupo | Nível dos inimigos | Inimigos por batalha | Rodadas esperadas |
|---|---|---|---|---|
| 1 | 1–5 | 1–4 | 1–2 | 2 |
| 2 | 5–9 | 4–8 | 2–3 | 2–3 |
| 3 | 9–14 | 8–12 | 2–4 | 2–3 |
| 4 | 14–18 | 12–16 | 3–4 | 3 |
| 5 | 18–21 | 16–19 | 2–3 | 3 |
| 6 | 21–25 | 19–23 | 3–4 | 3 |
| 7 | 25–29 | 23–27 | 3–4 | 3 |
| 8 | 29–34 | 27–32 | 4–5 | 3–4 |
| 10 | 35–40 | 33–38 | 4–5 | 3–4 |

- Na Tranquila os inimigos ficam, em média, **2 níveis abaixo** do grupo.
- Batalha comum: **30–45 s** em velocidade normal, **15–20 s** em AUTO + 2×.
- Chefe: **3–5 min**; chefe final: **8–10 min** nas duas fases.
- Uma masmorra gasta ~40% do PM do grupo e 2–3 consumíveis até o lampião dourado do chefe.
- Se o grupo estiver **3+ níveis abaixo** do esperado ao chegar num chefe, o lampião dourado
  mostra uma dica gentil ("Vocês parecem cansados. Que tal um treino ou um descanso?").

## 12. Nota de expansão: outras dificuldades

A versão inicial **não mostra opção de dificuldade**. Os dados devem prever um multiplicador por
dificuldade para que, no futuro, se possa acrescentar:

| Dificuldade | PV e ataque dos inimigos | Diferenças |
|---|---|---|
| **Tranquila** (atual) | ×1,0 (a régua deste documento) | Regras gentis da seção 3 |
| **Aventura** (futura) | ×1,25 | Fuga com chance; desmaiados não acordam sozinhos; sem "Uma mãozinha" |
| **Desafio** (futura) | ×1,6 | Inimigos no nível do grupo; chefes com um golpe extra; AUTO não recomendado |
