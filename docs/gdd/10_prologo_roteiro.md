# 10 — Prólogo: roteiro cena a cena

> **"A noite em que Valesol apagou"**
> Duração-alvo: **10–15 min** no caminho direto (decidido pelo autor); quem examinar todas as casas
> da manhã chega a ~18 min. Sem batalhas. Sem violência explícita.
> As falas completas estão em `content/dialogues/prologo_*.json`; aqui fica a direção de cada cena:
> o que o jogador faz, o que sente, e o que cada cena planta para o resto do jogo.

## Visão geral

| # | Cena | Mapa | Jogabilidade | Duração | Emoção |
|---|---|---|---|---|---|
| 0 | Manhã em Valesol | `prologo_casa_icaro`, `prologo_vila_manha` + 3 interiores | Tutorial de andar e examinar; casas exploráveis | 2–3 min (até 6 explorando) | Rotina, afeto ranzinza |
| 1 | Cafezal ao entardecer | `prologo_cafezal` | Colheita (prévia de treino de força), correr | 2–3 min | Aconchego, humor |
| 2 | A fumaça / estrada | `prologo_estrada` | Corrida curta | 1 min | Alarme |
| 3 | Vila em chamas | `prologo_vila` | Furtividade (3 trechos) | 3–4 min | Tensão (com alívio cômico) |
| 4 | O pai | `prologo_vila` (casa em ruínas) | Cutscene com escolhas | 3 min | Coração do prólogo |
| 5 | O túnel | `prologo_tunel` | Caminhada no escuro | 1 min | Luto, primeiro passo |
| 6 | Os sobreviventes | `prologo_bambuzal` | Cutscene | 2 min | Acolhimento, promessa |

Nomes do prólogo (Valesol, Tadeo e Aurora decididos pelo autor; os demais são propostas desta sessão): **Valesol** (a vila),
**Tadeo** (o pai), **Aurora** (a mãe), **Tonho** (colega de colheita), **Nina** (irmã do Tonho),
**Dona Zefa** (capataz do cafezal), **Dona Custódia** e a galinha **Pamonha** (vizinhas),
**Seu Juca** (padeiro), **Dona Ermelinda** (bibliotecária),
**Capitão Toucim** (oficial Caligosuin atrapalhado), **Sargento Íris Candeia** (Guarda de Luminaer),
**"Alento"** (a magia de cura de iniciante), **rego seco** (o túnel de irrigação abandonado).

---

## Cena 0 — Manhã em Valesol (casas exploráveis)

**Diálogos:** `prologo_00_abertura`, `prologo_00b_cafe_com_pai`, `prologo_00c_porta_sem_cafe`,
`prologo_00d_saida_vila`; examináveis `prologo_casa_*`; vizinhos `prologo_viz_*`.

**Por que esta cena existe (decisão do autor):** o jogador precisa **entrar nas casas** e
conhecer a vida de Ícaro antes de perdê-la. A vila que queima na Cena 3 é a mesma por onde ele
andou de manhã; a casa onde o pai está caído é a mesma onde tomaram café.

**Abertura (tela preta).** Quatro frases de narração: a luz de Luminaer "nunca dorme", o cajado
na torre, Aurelius Solis. E o corte de tom: *"Em Valesol, a gente pensa em café."*

**A casa de Ícaro** (`prologo_casa_icaro`: uma peça só, com cozinha, dois catres e a porta dos
fundos para o terreiro). Ícaro acorda com uma página colada na bochecha; o pai grita da cozinha.

*Café com o pai (`prologo_00b_cafe_com_pai`, obrigatório para sair):* o conflito inteiro em um
minuto — "parágrafo não enche saca", "três mil cobres e sobrenome comprido", **"mago é coisa de
quem nasceu em casa de dois andares"**, "as coisas são como são". E o afeto que ele não diz:
empurra o último pedaço de broa para o filho e fala que já comeu. Uma escolha (ficar quieto /
"A mãe não achava isso") muda duas falas e deixa o pai sem resposta. Última linha: *"...Vai com
cuidado."*

| Objeto (A para examinar) | Diálogo | O que revela |
|---|---|---|
| Colchão de Ícaro | `prologo_casa_colchao` | Três livros "enfiados de qualquer jeito" — à noite estarão **empilhados com capricho** |
| Retrato a carvão | `prologo_casa_retrato` | A mãe "ria até em retrato" |
| **Caixinha de costura** (prateleira alta) | `prologo_casa_caixa_costura` | Era da mãe; o pai tira o pó todo domingo e não deixa encostar. **É onde está o colar** |
| Cadeira de balanço | `prologo_casa_cadeira` | Ninguém senta; "ela não range" — o luto do pai |
| Fogão e bule | `prologo_casa_fogao` | O pai não comeu a broa dele: guardou para o filho levar |
| Pote "TELHADO" | `prologo_casa_pote` | Quarenta cobres e um botão; "a viga do meio reclama" — a pobreza e a viga que vai cair |
| Enxada do pai | `prologo_casa_ferramentas` | Dois nomes riscados no cabo: "Tadeo" e "Aurora" |
| Alçapão do terreiro | `prologo_casa_alcapao` | O túnel do rego seco: proibido desde os sete anos, usado "desde os sete e um dia" — **a rota de fuga** |

**A vila de manhã** (`prologo_vila_manha`: o mesmo desenho de `prologo_vila`, inteiro e com
sol). Três portas abertas, todas opcionais. As outras casas estão **trancadas**, cada uma com
dono e um detalhe de uma linha (`prologo_trancada_*`, lista em `11_prologo_marcadores.md`), e os
moradores na rua usam as falas padrão (`padrao_*`, ver `docs/status/narrativa.md`).

- **Casa da Dona Custódia** (`prologo_viz_custodia` + retrato, barril, crochê): dá os Ovos da
  Pamonha; conta que viu o pai **parado em frente à biblioteca, sem entrar**; apresenta o barril
  de melado "onde cabe uma pessoa" (ela estará dentro dele na Cena 3).
- **Padaria do Seu Juca** (`prologo_viz_juca` + forno, receita, desenho): dá o Pão de Ontem;
  fofoca do mundo — **a luz da torre da capital "piscou"** semana passada; o desenho da Nina,
  "ICARO MAGO".
- **Biblioteca** (`prologo_viz_biblioteca` + estante, fichário). Reescrita depois do teste do
  autor, para ficar claro e ligado ao tema da desigualdade:
  - a biblioteca de Valesol é **gratuita**; mas, por **ordem da Faculdade da capital**, livros de
    **magia** só podem ser emprestados a **alunos matriculados** — e a matrícula custa 3.000
    cobres;
  - Dona Ermelinda burla a regra por carinho: empresta a Ícaro **sem anotar na ficha** ("Eu não
    empresto nada. Eu esqueço livros em cima do balcão.");
  - o **Volume 2** chegou encomendado para o **Rodrigo**, filho do **Seu Otaviano Prado**, dono do
    cafezal, que estuda na capital e só chega nas férias. Ela vai "esquecer" o livro no balcão ao
    fechar, para Ícaro ler à noite e devolver antes que deem falta;
  - Ícaro diz em palavras simples o que está acontecendo: *"Ler aqui é de graça. Mas ler magia é
    só pra quem pode pagar a faculdade."* e *"O filho do dono do cafezal ganha o livro novo de
    presente. Eu leio emprestado, escondido, à luz de vela. Mas eu leio."*;
  - na estante, a biografia de Aurelius com **três espirais rabiscadas**; no fichário, a ficha de
    Ícaro sem nenhum livro de magia e, no fundo, a ficha antiga de **"Aurora"**, de antes da ordem
    da capital, só com livros de magia ("E naquele tempo ela podia.").
  - Naquela noite a biblioteca queima com o Volume 2 dentro (fala de exame `prologo_exame_biblioteca`).
- **Vitrine do Empório Prado** (`prologo_emporio_vitrine`, examinável na fachada; a loja está
  fechada): livros de magia da capital a 450 e 600 cobres. Ícaro: *"Aqui o livro de magia está à
  venda pra quem pode pagar. Na biblioteca, a capital proíbe. Pra gente, sobra o vidro."*

**Saída.** No portão da vila, `prologo_00d_saida_vila` pergunta se o jogador quer ir para o
cafezal (aviso gentil de que a manhã acaba). Corte narrado: "O dia passou como passam os dias de
colheita".

**O que esta cena planta:** o pai antes da tragédia; a caixinha; a viga; o alçapão; o barril;
a mãe na biblioteca; as três espirais; a luz que piscou. Tudo volta.

---

## Cena 1 — O cafezal ao entardecer

**Diálogos:** `prologo_01_abertura`, `prologo_02_tonho_tutorial`, `prologo_03_pe_de_cafe`,
`prologo_03b_pe_verde`, `prologo_04_zefa`, `prologo_05_livro`, `prologo_06_colheita_fim`.

**Imagem.** Luz dourada de fim de tarde, fileiras de pés de café em morro suave, frutos
vermelhos. Ícaro está sentado num toco, lendo, com o cesto vazio do lado. Tonho grita o nome
dele; Ícaro esconde o livro no cesto (animação `esconder_livro`).

**Jogabilidade — a colheita (prévia leve do "treino de força"):**
1. **Andar:** ir até o Tonho (marcador `marcador_cafezal_tonho`).
2. **Interagir (A):** colher **5 pés de café maduros** (os que brilham em vermelho). Pés verdes
   dão uma fala engraçada e não contam. O primeiro pé colhido dispara uma lembrança do pai
   ("café bom a gente conhece pelo peso na mão").
3. **Correr (B):** ensinado aqui de leve e reforçado na estrada.

Ao colher o 5º pé, o motor marca `prologo.colheita_completa`. Falar com a Dona Zefa na balança
com essa flag dispara `prologo_06_colheita_fim` (sem a flag, dispara `prologo_04_zefa`).
Na pesagem, uma dica avisa que **trabalho pesado fortalece a Força** e que haverá campos de
treino adiante; no livro escondido, que **estudar fortalece a Magia** (prévias, sem loja e sem
números no prólogo).

**Opcionais (recompensam curiosidade, plantam história):**
- **O cesto de Ícaro** (`prologo_05_livro`): o livro emprestado sem ficha, com o carimbo
  "RESERVADO. Somente para alunos matriculados";
  o capítulo de **"Alento"** — *"requer calma, respiração firme e mãos quentes"* — que é
  exatamente o que vai faltar na Cena 4; e a matrícula de 3.000 cobres contra os 12 de Ícaro.
- **Dona Zefa** (`prologo_04_zefa`): o pai teimoso com dor nas costas; a mãe "com o nariz numa
  página"; *"seu pai não gosta que a gente fale"*.

**Fim da cena.** Pesagem (18 kg do Ícaro, 6 kg do Tonho — "dois são pedra"), pagamento, a piada
dos "dois mil novecentos e setenta e seis" que faltam, e a fala que resume o conflito com o pai:
*"mago é coisa de quem nasceu em casa de dois andares"*. A música some. Pássaros fogem. Cheiro
de "ovo podre com fogueira". A câmera sobe para a coluna de fumaça preta. O sino da vila toca.

**O que esta cena planta:** a rotina e a pobreza sem melodrama; o sonho da faculdade; o pai
ranzinza (ausente da cena, presente em todas as conversas); a mãe; a magia "Alento"; Tonho e Nina.

---

## Cena 2 — A estrada

**Diálogos:** `prologo_07_estrada` (ao entrar), `prologo_07b_estrada_fugitivos` (gatilho no meio).

Mapa estreito, da direita para a esquerda, céu passando de laranja para roxo sujo. O jogador
corre (B). No meio, dois moradores fugindo dão as três informações que o jogador precisa:
1. O nome do inimigo: **Caligosuins**, "os focinhos-de-brasa".
2. O destino final: os soldados estão juntando gente **no bambuzal, atrás do morro**.
3. Por que Ícaro entra na vila: o pai "mal anda com aquelas costas".

Tonho se separa para buscar a irmã (a casa dele é fora da vila). A despedida é uma piada
("você me deve um terço de dezoito quilos") — o jogo não deixa a tensão virar desespero ainda.

---

## Cena 3 — A vila em chamas (furtividade)

**Diálogos:** `prologo_08_vila_entrada`, `prologo_09_visto`, `prologo_09b_perdeu_de_vista`,
`prologo_10_praca`, `prologo_11_custodia`, e os examináveis `prologo_exame_*`.

**Tom (decisão do autor):** na vila destruída **não há piada** com Ícaro, com os moradores nem
com o cenário. O único humor permitido vem dos Caligosuins entre si — perdendo Ícaro de vista,
achando que viram alguma coisa, uma troca curta de falas — e sem forçar. O humor da manhã e do
cafezal fica onde está; o contraste é o que dói.

**Imagem.** A mesma vila da manhã, queimando. A panorâmica nomeia os lugares que o jogador
acabou de visitar ("a padaria, a venda, a rua do chafariz"). O fogo é **preto com
borda roxa** e "não ilumina nada": a luz da cena vem do céu e de brasas comuns.

**Primeiro Caligosuin.** Porco de pé, manto, presas enormes. Ele para, acha que ouviu alguma
coisa, olha para o lado errado e decide que "foi o vento" — é a regra da raça, **fofo-ameaçador**.
Em seguida Ícaro o vê encostar a tocha num lampião: o ferro derrete. Desatentos, não inofensivos.

### Regras da furtividade (para o motor e para a sessão de mapas)

- Cada Caligosuin tem um **cone de visão** visível (luz roxa no chão, ~5 tiles de alcance,
  ~60° de abertura) e uma rota de patrulha fixa em laço (marcadores `patrulha_*`).
- **Esconderijos** (carroças, barris, pilhas de sacas de café, muretas): encostado em um deles,
  do lado oposto ao inimigo, Ícaro fica agachado e o cone não o detecta.
- **Ser visto** = `prologo_09_visto` (duas falas, fade) e volta ao **último ponto seguro**
  (marcadores `checkpoint_*`). Sem "game over", sem contagem de falhas, sem dano.
- **Quase visto** (opcional, no máximo uma vez por trecho): quando Ícaro escapa de um cone por
  pouco, os dois soldados mais próximos trocam as falas de `prologo_09b_perdeu_de_vista`
  ("Fumaça não tem cabelo." / "...Então foi fumaça.") sem tirar o controle do jogador.
- Correr (B) é permitido e não faz barulho — é o prólogo; a regra é uma só e simples.
- Dificuldade: paciência, não reflexo. Toda patrulha tem uma janela folgada (≥ 2 s).
- Acessibilidade: depois de 3 detecções no mesmo trecho, o cone daquele trecho encolhe um tile.

### Os três trechos

| Trecho | De → até | Inimigos | Ideia |
|---|---|---|---|
| A — Rua da Venda | entrada → `checkpoint_praca` | 1 patrulha em linha reta | Ensinar: esperar atrás da carroça, atravessar |
| B — Praça do Chafariz | `checkpoint_praca` → `checkpoint_beco` | 2 patrulhas + Toucim parado (cone fixo, que gira a cada 4 s) | Ensinar: ler o ritmo; cutscene do Toucim no começo |
| C — Rua do Terreiro | `checkpoint_beco` → casa | 2 patrulhas cruzadas + sacas de café como cobertura | Combinar tudo; Dona Custódia no barril no meio |

**Cutscene da praça (`prologo_10_praca`).** Escondido, Ícaro ouve o **Capitão Toucim**. A cena faz
três trabalhos: (1) exposição — eles procuram **livros e magia** a mando de **Madame Trufa**;
"a barreira caiu, o cajado apagou"; (2) ameaça sem imagem — "ordens do General: nada fica de
pé"; (3) um único respiro, entre eles: "esta vila só cheira a café" / "então tragam o café" /
"pra quê, capitão?" / "soldado não pergunta pra quê". Depois, a câmera mostra a **biblioteca**
queimando: a perda pessoal de Ícaro.

**Dona Custódia (`prologo_11_custodia`, opcional mas no caminho).** Escondida no barril de
melado que o jogador viu de manhã, com a galinha. Sem graça nenhuma, só medo. Dá a informação
que dói: o pai **já estava a salvo e voltou para dentro de casa buscar alguma coisa**. Ícaro a
manda para o bambuzal — primeira vez que ele cuida de alguém em vez de ser cuidado.

**Examináveis:** biblioteca, chafariz, padaria, sacas de café (uma linha cada, tom sóbrio).

---

## Cena 4 — O pai

**Diálogos (em sequência, sem devolver o controle entre eles, exceto onde indicado):**
`prologo_12_pai_confissao` → `prologo_13_cura` → `prologo_14_promessa`.
Antes de se aproximar do pai, o jogador pode examinar `prologo_exame_retrato` e
`prologo_exame_colchao` (os livros "empilhados com capricho": o pai sempre soube).

**Imagem.** A casa de Ícaro: duas peças, meio telhado caído. Tadeo está preso da cintura para
baixo por uma viga em brasa (fogo comum, alaranjado — o único canto "quente" da vila).
Na mão, uma **caixinha de costura** de madeira. Nenhum ferimento é mostrado; o retrato
`pai_ferido` tem fuligem, suor e cansaço, nada além disso. A música para; entra `tema_pai`.

**Batida 1 — Por que ele voltou.** *"Vim buscar isto. A caixinha de costura da sua mãe."*

**Batida 2 — A confissão.** A mãe não morreu de febre: estudantes ricos, magia proibida numa
praça da capital, três atingidos, dois mortos. *"A Aurora foi uma delas."* O pai sabia dos
livros o tempo todo: *"Quase toda noite você dormia em cima de um. Eu apagava a vela e te
cobria."* (Eco da manhã, quando Ícaro acorda com uma página colada no rosto, e do colchão
arrumado que o jogador pode examinar logo antes.) E a revelação: Ícaro é "fora da curva" como a mãe; a repressão
era medo.

**Batida 3 — A cura que não vem (`prologo_13_cura`).** Ícaro tenta "Alento". O jogador participa:
três escolhas seguidas (todas levam ao mesmo resultado — a luz acende, treme e apaga). A fala do
livro vira um mantra que desmonta: *"calma, respiração firme, mãos quentes"* → *"eu não consigo
respirar"*. O pai o consola: *"ninguém acende lampião no meio da ventania"*.
**Planta do colar:** na segunda tentativa, algo dentro da caixinha **pisca junto** com a magia
(efeito `brilho_colar`, 1 segundo). A narração diz só: "Ninguém viu."

**Batida 4 — Eles estão vindo.** Câmera na rua de cima: Toucim e dois soldados descendo com
tochas pretas. O pai **empurra** Ícaro e manda ir para a capital.

**Batida 5 — A viga (`prologo_14_promessa`).** Ícaro tenta erguer a madeira (tremor de tela,
som de madeira). Não sai. O pai indica a fuga: **a adega do terreiro, o túnel do rego seco**,
onde Ícaro brincava escondido.

**Batida 6 — Perdão e promessa.** O pedido de desculpas; as duas promessas — **sobreviver e
procurar o comandante Lucian Alvorada**; e **viver, não só sobreviver**. Uma escolha de duas
opções equivalentes ("Eu prometo." / "...Eu prometo, pai.") faz o jogador dizer a promessa
com o próprio dedo. Ícaro pergunta de onde o pai conhece um comandante: *"História comprida.
Ele te conta."* (gancho para o Ato 1).

**Batida 7 — O colar.** Dentro da caixa, um cordão gasto e "uma pedrinha opaca, do tamanho de um
grão de café". *"Pediu pra eu te entregar quando você estivesse pronto. Eu nunca achei que
você estivesse. Era eu que não estava."*
**Flashback (4 segundos, tela branca, `tema_mae`):** a voz da mãe — *"Tá sentindo, meu solzinho?
Fica morninha perto do peito. É pra você nunca sentir frio."* Nada é explicado. ("Solzinho" é um
apelido carinhoso que só ganha segundo sentido no fim do jogo.)
Ícaro recebe o item-chave **Colar da Mãe** (não pode ser vendido nem removido).

**Batida 8 — Despedida.** *"Eu também te amo, filho. Desde o primeiro berro." / "Tenho orgulho
de você. Devia ter dito antes. Tô dizendo agora." / "Vai viver, Ícaro."*
Ícaro corre pela porta dos fundos até o alçapão do terreiro. **A câmera segue Ícaro e nunca
volta para o pai.** Fade para preto.

> **Regra de direção (decisão do autor):** a morte do pai não é mostrada nem descrita. No túnel,
> ouvem-se passos e uma porta, abafados; depois, a narração diz apenas *"Lá em cima, o barulho
> parou. Depois, só o fogo."*

---

## Cena 5 — O túnel do rego seco

**Diálogos:** `prologo_15_tunel_inicio`, `prologo_15b_tunel_brinquedo` (opcional).

Preto total, sons abafados, silêncio longo (deixar o silêncio durar — ~4 s). Ícaro encolhido.
O colar acende sozinho, "cor de fim de tarde", morno "igual ela dizia". Jogabilidade: uma
caminhada curta com um círculo de luz ao redor de Ícaro (a luz **é** o colar — o jogador usa o
objeto mais importante do jogo sem saber). Sem inimigos, sem quebra-cabeça.

**Opcional:** um cavalinho de sabugo com um "I" riscado. O pai passou uma tarde inteira
procurando esse brinquedo com ele, "reclamando, sem parar de procurar". É a última imagem do pai
no prólogo: não a do ferido, a do pai de sempre.

Saída: gatilho no fim do túnel → `scene` para `prologo_bambuzal`.

---

## Cena 6 — O bambuzal e os sobreviventes

**Diálogo:** `prologo_16_sobreviventes`.

Noite, grilos, bambus, uma dúzia de pessoas com cobertores. Dois soldados e a **Sargento Íris
Candeia**. A pergunta protocolar — *"Tem mais alguém vindo atrás de você?"* — e o *"...Não."*
é onde o jogador entende, sem ninguém dizer, o que aconteceu.

O acolhimento vem em três gestos pequenos (o "cozy" depois da perda):
- a sargento oferece água e cobertor, "não tem muito mais que isso";
- Dona Custódia põe a galinha no colo dele, "o jeito dela de dar um abraço";
- Tonho fica sem piada pela primeira vez na vida e só senta do lado; Nina dá uma **Rapadura
  Amassada** (primeiro item de cura do inventário — cura 20 PV no Ato 1).

A câmera mostra a capital ao longe: clarões nos portões e **uma luzinha na torre mais alta,
"teimando em não apagar"** (o cajado). Ícaro pergunta pelo comandante Lucian Alvorada — *"é ele
que tá segurando aquele portão"* — segura o colar: *"Eu fiz uma promessa."*

Fecho narrado em três frases, cartão de título **TRISKELION — Fim do Prólogo**,
flag `prologo.concluido`, autosave, a narração "A história de Ícaro continua..." e volta à
tela de título (`scene: "Titulo"`), com o save pronto para o Ato 1.

---

## Salvamento no prólogo

O jogador pode **salvar a qualquer momento pelo menu** (fora de cutscene). Além disso, o roteiro
prevê **autosave** nestes pontos, para ninguém perder mais que um minuto:

| Momento | Onde |
|---|---|
| Depois do café com o pai | Cena 0 |
| Ao sair da vila para o cafezal | Cena 0 → 1 |
| Ao completar a colheita | Cena 1 |
| Ao entrar na estrada e ao entrar na vila em chamas | Cenas 2 e 3 |
| Em cada checkpoint da furtividade (entrada, praça, beco) | Cena 3 |
| Na soleira da casa, **antes** da sequência do pai | Cena 4 (a sequência 12→13→14 não é interrompida) |
| Ao entrar no túnel e ao chegar ao bambuzal | Cenas 5 e 6 |
| No cartão de título | fim |

Se o jogador fechar a página no meio da cena do pai, retoma do autosave da soleira.

---

## Flags do prólogo

| Flag | Quando é marcada | Marcada por |
|---|---|---|
| `prologo.acordou`, `prologo.cafe_com_pai` | manhã em casa | diálogos 00, 00b |
| `prologo.visitou_custodia`, `prologo.visitou_juca`, `prologo.visitou_biblioteca`, `prologo.volume2_combinado`, `prologo.viu_vitrine` | opcionais da manhã | diálogos `prologo_viz_*`, `prologo_emporio_vitrine` |
| `prologo.saiu_da_vila` | portão da vila | diálogo 00d |
| `prologo.abertura_vista` | começo do cafezal | diálogo 01 |
| `prologo.colheita_iniciada` | Tonho explica a tarefa | diálogo 02 |
| `prologo.colheu_primeiro` | primeiro pé colhido | diálogo 03 |
| `prologo.colheita_completa` | 5º pé colhido | **motor** (contador) |
| `prologo.zefa_conversou`, `prologo.leu_livro` | opcionais do cafezal | diálogos 04, 05 |
| `prologo.viu_fumaca` | fim do cafezal | diálogo 06 |
| `prologo.tonho_separou` | estrada | diálogo 07b |
| `prologo.furtivo_iniciado` | entrada da vila | diálogo 08 |
| `prologo.ouviu_toucim` | praça | diálogo 10 |
| `prologo.falou_custodia` | opcional | diálogo 11 |
| `prologo.encontrou_pai`, `prologo.tentou_cura` | casa | diálogos 12, 13 |
| `prologo.pegou_colar`, `prologo.pai_despedida` | casa | diálogo 14 |
| `prologo.tunel_iniciado`, `prologo.achou_brinquedo` | túnel | diálogos 15, 15b |
| `prologo.concluido` | fim | diálogo 16 |

Flags opcionais que o resto do jogo lê: `prologo.visitou_biblioteca` (o cartão de empréstimo na
Fortaleza Fuligem ganha uma fala a mais), `prologo.visitou_juca` (ele guarda "o sonho que
sobrou" na capital), `prologo.leu_livro` (a bibliotecária da capital comenta o livro atrasado),
`prologo.falou_custodia` (ela agradece na capital e dá um item), `prologo.achou_brinquedo`
(fala extra na cena final da colina).

## Convenções usadas nos JSON (para o motor)

Tudo segue o contrato de `docs/COORDENACAO.md`. Onde o contrato não detalha campos, usei:

| Tipo | Campos usados |
|---|---|
| `say` | `speaker`, `portrait` (opcional), `text`. Falas entre parênteses são **pensamento**. `speaker: "narrador"` = caixa sem nome/retrato. `speaker: "tutorial"` = dica de controle (o motor pode estilizar diferente). |
| `move` | `actor`, `to` (nome de marcador), `speed: "run"` opcional |
| `face` / `emote` | `actor`, `dir` / `emote` (`exclamacao`, `interrogacao`, `reticencias`, `suor`) |
| `camera` | `to` (marcador) **ou** `actor` (volta a seguir o ator), `ms` |
| `spawn` / `despawn` | `actor`, `at` (marcador), `dir` |
| `music` | `id` (`"none"` = silêncio), `fade` em ms |
| `if` | `flag`, `goto`, `not: true` opcional |
| `goto` | `to` (nome de label) |
| `scene` | `map`, `spawn` (marcador de entrada) |
| **`anim`** (tipo novo, proposto) | `actor`, `anim` — troca a pose/animação de um ator ou objeto. Se o motor não tiver, pode ignorar: nenhuma cena depende dele para ser entendida. |
| **`title`** (tipo novo, proposto) | `text`, `subtitle` — cartão de título no fim do prólogo. |

Limite de texto: nenhuma fala passa de 130 caracteres.

## Retratos: regra usada (revisão pós-teste)

- Retrato só quando a fala tem emoção clara e o retrato bate com ela.
- Narrador e pensamentos de exame sem emoção clara ficam **sem retrato** (só o texto).
- Expressões disponíveis: ver `12_prologo_lista_assets.md`, seção 3.
