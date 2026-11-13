# 07 — Cidades, casas e serviços

Decisões do autor que este documento atende (ver `docs/COORDENACAO.md`):
- O jogador **entra em casas** ao longo do caminho para conhecer a história dos personagens.
- Cada personagem principal tem a sua **casa** (Ícaro, Valéria, Celly, Silvano) e **cada
  vila/cidade/reino tem mais 1 ou 2 casas extras**, com moradores, objetos examináveis e um
  gancho (fofoca, pista do mundo ou missão secundária).
- Toda cidade tem **lojas** (estoque que melhora com a região), **pousada** e **locais de
  treino** de **força** e de **magia**, com minijogos curtos e fofos.

Regras de treino, preços e economia: `05_sistemas.md` (seções 7 e 10). NPCs de rua e missões:
`06_npcs.md`. Os textos abaixo são a base para os diálogos definitivos em `content/dialogues/`.

**Padrão de toda cidade**

| Serviço | Regra |
|---|---|
| Casa principal do capítulo | Interior completo, 6–10 examináveis, moradores |
| 1–2 casas extras | Interior pequeno, 2–4 examináveis, 1 gancho |
| Mercearia + Ferraria/Ateliê | Estoque da faixa da região; ganha itens quando a história avança |
| Pousada | Descansar, curar, cozinhar, conversa de grupo. **Não é necessária para salvar** |
| Treino de força + treino de magia | 3 sessões de cada por capítulo; 1ª grátis |
| Lampião dourado | Cura e viagem rápida |

---

## 1. Valesol (Prólogo; reconstruída no pós-jogo)

Detalhe completo, com todos os textos já em JSON: `10_prologo_roteiro.md` (Cena 0).

| Lugar | Tipo | Resumo |
|---|---|---|
| **Casa de Ícaro** | Casa principal | Uma peça só, terreiro nos fundos. Colchão com livros escondidos, retrato a carvão, **caixinha de costura da mãe**, cadeira de balanço em que ninguém senta, pote "TELHADO", enxada com dois nomes, alçapão do túnel. Morador: o pai |
| **Casa da Dona Custódia** | Casa extra | Galinha Pamonha, retrato do finado Zé, barril de melado, crochê para galinha. Gancho: o pai parado em frente à biblioteca |
| **Padaria do Seu Juca** | Casa extra / comércio | Forno que nunca apagou, receita borrada, desenho "ICARO MAGO". Gancho: a luz da torre piscou |
| **Biblioteca** | Prévia de treino de magia | Gratuita, mas livros de magia só para matriculados na Faculdade (ordem da capital). Dona Ermelinda empresta sem ficha; o Volume 2, encomendado para o filho do dono das terras; biografia de Aurelius com três espirais; a ficha "Aurora" |
| **Casas trancadas** | Casas extras (só fachada) | Laudelina, Orlando, Quim e Quitéria, Lindalva, Rosário; Empório Prado (vitrine de livros caros) e o armazém de café dos Prado — lista em `11_prologo_marcadores.md` |
| **Cafezal** | Prévia de treino de força | A colheita do tutorial |

Sem loja e sem números no prólogo (só prévias). No pós-jogo (primordial), a vila é reconstruída
em 6 etapas e cada casa reabre com moradores e falas novas — ver `03_fases.md`, seção 6.

---

## 2. Áurea, capital de Luminaer (Capítulo 1; base do jogo)

### Casa principal — **Alojamento do comandante Lucian** (Quartel da Muralha)
É onde Ícaro mora durante o jogo: Lucian cede o quartinho dos fundos.

**Cômodos:** sala de mapas · quarto de Lucian · quartinho de Ícaro.

| Objeto | Texto ao examinar | O que revela |
|---|---|---|
| Mapa na parede | "Luminaer inteira, com alfinetes. Um alfinete azul está espetado numa vila pequena demais para ter nome no mapa. Alguém escreveu a lápis: 'Valesol'." | Lucian acompanhava a vila de longe |
| Vassoura de piaçava, pendurada como um troféu | "Uma vassoura velha, numa moldura. Plaquinha: 'Recebida em combate. Mereci.'" | A vassoura com que Tadeo o expulsou (revelado no Cap. 9) |
| Escrivaninha | "Rascunhos de um regulamento: 'Da proibição de magia sem supervisão em local público'. Quinze versões. Todas com o carimbo: INDEFERIDO — Conselho da Faculdade." | Ele luta há anos por causa do acidente |
| Luva esquerda sobre a cama | "Uma luva de couro mais grossa que a direita. Por dentro, forrada de lã." | A cicatriz; o braço lento |
| Gaveta trancada (abre no Cap. 9) | "Um desenho a carvão, amassado e alisado muitas vezes: uma moça rindo, com a mão erguida, e uma luz saindo da mão." | Aurora, no dia do acidente |
| Cama de Ícaro | "Um catre de quartel com um cobertor bom demais para ser de quartel." | O cuidado de Lucian |
| Prateleira de Ícaro | "Vazia. Por enquanto." (enche de lembranças a cada capítulo) | O progresso da jornada |

**Nota:** Lucian desconfia da linhagem Solis de Aurora e **não conta nada a Ícaro**; os objetos
desta casa deixam o jogador desconfiar antes do protagonista.

**Morador:** Lucian. — "O quarto é pequeno, mas a janela dá para a torre. Achei que você ia gostar."

### Casas extras
**Casa da Dona Abigail (sobrado da mercearia).** Moradores: Dona Abigail e o neto Tico.
- *Pote de vidro:* "Balas de café. Uma plaquinha: 'Uma por freguês. Tico, isso inclui você.'"
- *Livro-caixa:* "Uma coluna inteira de 'fiado'. Quase todos os nomes são do Bairro dos Refugiados. Nenhum está riscado como dívida: estão riscados como 'deixa'."
- **Gancho (missão "Fiado"):** entregar 5 cestas pelo bairro. Recompensa: desconto permanente.

**Sobrado dos Montalvão (Bairro Alto).** Moradores: os pais do aluno Otávio.
- *Retrato de família:* "Seis gerações de magos formados. O sétimo quadro já está pendurado, vazio, com a plaquinha: 'Otávio'."
- *Carta sobre a mesa:* "'...três mil cobres não são nada para garantir a vaga do menino...'"
- **Gancho (fofoca):** a mãe comenta, baixando a voz, que "o Diretor nunca foi o mesmo depois
  daquele acidente na feira, uns quinze, dezoito anos atrás". Pista do passado de Eusébio.

### Lojas e pousada
| Loja | Dono | Estoque |
|---|---|---|
| Mercearia "Grão e Cia." | Dona Abigail | Rapadura, Broa, Café Coado, chás; no Ato 3, tudo |
| Ferraria | Mestre Bigorna | Faixa 1 (Cap. 1), faixa 2 (após Cap. 3), faixa 4 (Ato 3) |
| Banca de pergaminhos | Madame Lia | Amuletos; 1 item novo por capítulo |
| Bazar da Praça | Seu Honorato | Decoração de acampamento |
| **Pousada do Relógio** | Dona Clementina | 15 cobres; cozinha; conversas de grupo |

### Treino
| Tipo | Local | Mestre | Minijogo | 1º Ouro |
|---|---|---|---|---|
| **Força** | Pátio da Guarda | Sargento Íris | **Duelo amigo** com boneco de palha; depois, **Carregar** baldes pela muralha | Amuleto *Fivela da Guarda* (+10% DEF ao defender) |
| **Magia** | Biblioteca da Faculdade | Dona Clotilde | **Carregar** pilhas de livros sem derrubar; depois, **Fôlego** ("leia devagar") | *Flecha de Luz* antecipada |
| **Magia** (Ato 3) | Torre Alta | Zelador Fausto | **Fôlego**, ao lado do pedestal do cajado | +1 de Calma inicial |

---

## 3. Ganso Tonto e Mosteiro da Serra Calma (Capítulo 2)

Um povoado de beira de estrada (a hospedaria e três casas) e o mosteiro no alto.

### Casa principal — **A cela do Irmão Silvano** (Mosteiro)
**Cômodo único**, igual a todas as outras celas. Só que não.

| Objeto | Texto ao examinar | O que revela |
|---|---|---|
| Espelho | "Todas as celas têm um catre e um banquinho. Esta tem um catre, um banquinho e um espelho de corpo inteiro com moldura dourada." | Vaidade (e de onde veio um espelho desses?) |
| Escovas | "Sete escovas de cabelo, em ordem de tamanho. A menor tem um brasão raspado a faca." | Primeira pista do príncipe |
| Garrafas sob o catre | "Vazias. Arrumadas com muito capricho. Uma tem um bilhete: 'Devolver à Dona Fridolina. Um dia.'" | A conta da hospedaria |
| Caderno | "'Ensinamentos, anotados por mim'. Página 1: 'O monge não causará dano por feitiço.' Na margem, com outra tinta: 'bastão não é feitiço!!'" | A piada vira doutrina |
| Embrulhos na janela | "Pãezinhos embrulhados, com nomes: 'viúva do moinho', 'os três do celeiro', 'menino da ponte'." | Ele alimenta meio povoado, escondido |

**Morador:** Silvano (antes de entrar no grupo). — "Não repare na bagunça. É uma bagunça de luxo."

### Casas extras
**Casa da Dona Fridolina (fundos da hospedaria).** Moradores: Fridolina e o ganso Tonto.
- *Quadro de contas:* "Um quadro-negro: 'SILVANO DEVE'. Os números vão até o teto. No cantinho, em letra menor: 'paga em conserto, em remédio e em companhia. Vai ficando.'"
- **Gancho (missão "O ganso sumiu"):** achar o Ganso Tonto na estrada. Recompensa: receita.

**Casa do Lavrador Chico (trigal).** Moradores: Chico e a filha Rosinha.
- *Espantalho na varanda:* "Um espantalho de vestido. Rosinha jura que ele pisca."
- **Gancho:** missão "Espantalho de volta" (em `06_npcs.md`).

### Lojas e pousada
| Loja | Dono | Estoque |
|---|---|---|
| Balcão da hospedaria | Dona Fridolina | Consumíveis da faixa 1; Tacho de Doce |
| Carroça do Caixeiro Aníbal | Aníbal | Faixa 1 completa + 1 peça da faixa 2, cara |
| Horta do mosteiro | Irmã Dulce | Pomadas, chás, ingredientes |
| **Hospedaria do Ganso Tonto** | Dona Fridolina | 15 cobres |

### Treino
| Tipo | Local | Mestre | Minijogo | 1º Ouro |
|---|---|---|---|---|
| **Força** | Lenheiro do mosteiro | Irmão Tobias | **Ritmo**: partir lenha | Silvano aprende *Giro do Peregrino* antes do nível |
| **Magia** | Jardim de pedra | Abade Plácido (e Silvano, depois) | **Fôlego**: meditar; **Sequência**: os sinos | Ícaro aprende *Alento* de verdade; amuleto *Contas do Abade* |

---

## 4. Bravaferro: Forja-Alta e a Vila da Bigorna (Capítulo 3)

**Forja-Alta** é a cidade murada (arena, salão, comércio). A **Vila da Bigorna** é o bairro de
ferreiros colado à muralha, onde mora a família de Valéria.

### Casa principal — **Casa dos Lâmina de Ferro** (Vila da Bigorna)
**Cômodos:** forja no térreo · cozinha/sala · quarto dos pais · quarto de Valéria · quarto da
Livinha (no sótão). **Dois andares.**

| Objeto | Texto ao examinar | O que revela |
|---|---|---|
| A escada | Ícaro: "(Dois andares.)" — Valéria: "Que foi?" — Ícaro: "Nada." — Valéria: "Fala." — Ícaro: "Meu pai dizia uma coisa sobre casa de dois andares. Ele estava errado. E um pouco certo." | A diferença de posses entre os dois; ela repara pela primeira vez |
| Ganchos vazios na parede da forja | "Doze ganchos. Onze vazios. No último, um peitoral pequeno demais para um adulto, com um bilhete: 'Esse eles não quiseram. — L.'" | O saque; o peitoral de panela da Livinha |
| Espada sobre a lareira | "A espada do avô. Sem fio: 'Uma Lâmina de Ferro só amola a espada no dia em que precisar dela.' Hoje ela está amolada." | A honra da família; a decisão de Valéria |
| Batente da porta | "Marcas de altura a canivete. 'Val, 6 anos'. 'Val, 9'. 'Val, 12 (parou de deixar medir)'. Bem embaixo: 'Livinha, 8 — na ponta do pé, não vale'." | Infância; as duas irmãs |
| Mesa da cozinha | "Posta para quatro. A mãe de Valéria põe o quarto prato todo dia, com ela em casa ou não." | Ela é esperada |
| Quarto de Valéria: baú ao pé da cama | "Tudo dobrado em quadrados perfeitos. No fundo, embaixo das túnicas: 'A Dama e o Escudeiro, volume 3'. Com marcador." — Valéria: "É da Livinha." — "A Livinha tem oito anos." — "Ela é precoce." | Ela é romântica e morreria antes de admitir |
| Quarto de Valéria: parede | "Uma única coisa pendurada: um desenho de giz de uma cavaleira ruiva enorme derrotando um dragão do tamanho de um gato. Assinado: 'pra mana'." | O que ela guarda |
| Quarto da Livinha: castelo de cobertores | "Um castelo de lençóis com torre, ponte e placa: 'Proibido porco'." | Como uma criança processa o saque |
| Quarto da Livinha: caixa de sapato | "Cartas prontas, com selo desenhado: 'Pra mana, quando ela estiver longe'. São quarenta. Ela se adiantou." | As cartas que chegam ao longo do jogo |
| Livro de contas da mãe | "Encomendas canceladas depois do saque. E uma linha nova: 'Espadas para a guarda de Luminaer — sem cobrar.'" | A aliança começa em casa |

**Moradores e falas:**
- **Dona Berta (mãe):** "Come pouco, esse menino. Valéria, por que você trouxe um menino que
  come pouco?" / (depois das Minas) "Você devolveu o brilho no olho da minha filha. Coma."
- **Seu Hildo (pai):** fala pouco, martela muito. "Aço bom se conhece pelo som. Gente também."
  (Ícaro: "Meu pai dizia isso do café.")
- **Livinha:** "Você é o mago da mana? Ela falou que você é fraquinho mas tem jeito."

### Casas extras
**Casa do Mestre Tenaz (ao lado da arena).** Morador: o velho mestre de armas.
- *Parede de escudos:* "Um escudo para cada aluno. O de Valéria é o mais amassado. 'Ela não defendia. Ela discutia com o golpe.'"
- **Gancho (missão "O escudo que falta"):** um escudo foi levado no saque; está nas Minas.

**Casa da Viúva Ferrolho (Vila da Bigorna).** Moradora: fabricante de cadeados.
- *Porta com nove trancas:* "Ela abre as nove de cor, sem olhar."
- **Gancho (pista do mundo):** os Caligosuins não levaram ouro — levaram **aço e carvão**.
  "Quem rouba aço não quer ficar rico. Quer fazer guerra."

### Lojas e pousada
| Loja | Dono | Estoque |
|---|---|---|
| Forja da Guta | Ferreira Guta | Faixa 2; desconto depois das Minas |
| Armazém do Passo | Seu Calço | Consumíveis; Bolo de Fubá |
| Bazar da Arena | — | Decoração: bandeirinhas, escudinho de parede |
| **Pousada:** a casa dos Lâmina de Ferro | Dona Berta | Grátis. "Pousada é pra estranho." |

### Treino
| Tipo | Local | Mestre | Minijogo | 1º Ouro |
|---|---|---|---|---|
| **Força** | Arena dos Juramentos | **Valéria** (e Mestre Tenaz) | **Duelo amigo**: treinar com Valéria, que comenta cada erro; **Ritmo**: malhar ferro com Seu Hildo | Ícaro aprende *Golpe Firme* antes do nível. Cena curta do romance discreto |
| **Força** (fofo) | Quintal dos Lâmina de Ferro | **Livinha** | **Duelo amigo** de espada de madeira — ela sempre ganha | *Fita da Livinha* |
| **Magia** | Não há santuário: "aqui não tem dessas coisas". Ícaro medita no **Mirante da Bigorna** | Silvano | **Fôlego**, com os guerreiros olhando torto | +3 PM; um recruta pede para aprender também |

---

## 5. Borda da Floresta dos Sussurros (Capítulo 4)

Não é uma cidade: são três casas na clareira antes da mata.

| Lugar | Tipo | Conteúdo |
|---|---|---|
| **Cabana da Vó Jurema** | Casa extra + loja | *Ervas penduradas:* "Cada maço tem uma etiqueta. 'Pra tosse'. 'Pra susto'. 'Pra saudade (não funciona, mas cheira bem)'." *Cadeira vazia:* "Do finado. Ela conversa com a cadeira. A cadeira, diz ela, responde melhor que ele." **Loja:** chás, pomadas, ingredientes. **Gancho:** a mata "tá gripada" desde a noite em que as runas murcharam |
| **Casa do Lenhador Bino** | Casa extra | *Machado na parede, com um laço:* "Aposentado até a mata sarar." *Coleção de folhas:* "Uma de cada árvore que ele não cortou." **Gancho:** missão "Lanternas da clareira" |
| **O toco da Celly** | Abrigo | *Toco oco, uma folha por cobertor:* "Alguém pequeno mora aqui. Há uma fileira de pedrinhas na entrada, cada uma com um risquinho. São muitos risquinhos." (dias de banimento). *Bilhete numa casca:* "'Desculpa por usar o toco. Eu saio se alguém precisar.'" |

**Pousada:** rede na varanda da Vó Jurema (grátis; conversa de grupo: Celly aparece e some).

| Treino | Local | Mestre | Minijogo | 1º Ouro |
|---|---|---|---|---|
| **Força** | Lenheiro do Bino | Bino | **Carregar** lenha caída (sem cortar nada) | +5 PV; decoração *Banquinho de toco* |
| **Magia** | Clareira das Lanternas | A Coruja | **Sequência**: acender lanternas na ordem | *Lamparina de Bolso* |

---

## 6. Brumaflor, reino das fadas (Capítulo 6)

### Casa principal — **O lar de Celly: a Casa da Guardiã**
Pela tradição, a guardiã do Nymphalion deixa o casarão do clã e vai morar sozinha, com
simplicidade, ao lado do canteiro da magia. A casa de Celly é um **botão de rosa que nunca
abriu**, colado ao **Canteiro Vazio**. Na porta, uma fita cinza: **"DESPETALADA"**. Celly demora
a ter coragem de entrar. O grupo, encolhido, entra com ela — e continua achando que "guardiã"
era um posto de sentinela.

**Cômodos:** salinha · quarto · canteiro de treino nos fundos.

| Objeto | Texto ao examinar | O que revela |
|---|---|---|
| A fita na porta | "'DESPETALADA — por decisão do Conselho. Nome e clã riscados.' Embaixo, em giz, com outra letra: 'volta logo'." | A pena; alguém não desistiu dela (Dona Margarida) |
| Parede de listas | "Papeizinhos presos com espinhos. 'Coisas pelas quais pedir desculpa hoje'. A lista de segunda-feira tem trinta e um itens. O último é 'pela lista estar tão comprida'." | A insegurança, por escrito |
| Estante | "Todos os manuais de guardiã que existem. Lidos, sublinhados, com abas coloridas. 'Guardar: teoria', 'Guardar: prática', 'Guardar para quem tem medo de guardar' — este, o mais gasto." | Ela não era incapaz: era a que mais estudava |
| Quadro de votos | "O voto da guardiã, bordado: 'Deixo a casa grande pela casa pequena. Deixo o nome pelo dever.' Na moldura há uma linha de nomes, um por geração. O último foi raspado." — Ícaro: "Quem eram?" — Celly: "As de antes de mim." | **Pista:** o posto passa de geração em geração. Ninguém pergunta "na mesma família?" |
| Diário (três páginas) | "'Hoje uma senhora elegante de chapéu veio ver o Nymphalion. Disse que eu parecia cansada e que ela seguraria um minutinho. Foi tão gentil.' / (página seguinte, borrada) 'Eu só queria que alguém fosse gentil.' / (o resto do caderno está em branco)" | Como Madame Trufa a enganou |
| Vaso na janela | "Uma muda, verde e regada. Depois de tantos meses, alguém vem aqui regar." | Dona Margarida |
| Cama de pétala | "Feita, com o travesseiro afofado. E um casaquinho de crochê por cima, novo." | Idem |
| Calço da porta | "Um medalhão de prata pesado, usado para a porta não bater. Tem uma rosa de cinco pétalas gravada." — Valéria: "Isso é prata de verdade." — Celly: "É coisa de família. Pesa bem. Segura a porta." | **Pista principal:** o brasão da Casa da Rosa-Primeira, tratado como peso de porta. Ela muda de assunto |
| Canteiro dos fundos | "Runas-broto treinadas em fileira. Todas murchas. Uma, no cantinho, ainda tem cor." | A magia dela nunca morreu de todo |

**Moradores:** ninguém, até o epílogo. **Visita:** Dona Margarida entra com um bolo. — "Eu
sabia que você ia voltar, minha... menina." (Ela quase diz o nome. A lei não deixa.) "Só não
sabia que ia trazer gente tão grande. Encolheram bem, viu?"

**O que a casa revela agora:** quem Celly é por dentro. **O que só se entende no epílogo:** o
quadro de votos e o medalhão. Quando o Conselho devolve o nome — *Celestia da Rosa-Primeira* —,
a casa abre como flor, enche de visitas, e o nome raspado da moldura é bordado de novo.

### Casas extras
**Doceria e casa da Dona Margarida.**
- *Livro de receitas:* "Uma receita marcada com uma pétala: 'Bolinho de néctar da menina — ela come o glacê e deixa o bolo'. O nome foi coberto com um pingo de calda. De propósito, e com pena."
- *Avental pendurado, com um broche pequeno:* "Uma rosa de cinco pétalas. Margarida põe a mão em cima quando percebe que alguém está olhando."
- **Gancho (pista):** Margarida serviu "numa casa grande" antes de abrir a doceria e foi ama
  "de uma menina que media tudo antes de fazer". Não pode dizer de quem. "Lei é lei. Bolo é bolo.
  Leva um."

**Casa-escola dos Brotinhos.** Moradores: a professora Violeta e as fadas crianças.
- *Mural "Quem já despertou":* "Estrelinhas ao lado de alguns nomes. Os sem estrela foram escritos mais embaixo."
- **Gancho:** missão "Aula de coragem" (Celly ensina).

### Lojas e pousada
| Loja | Dono | Estoque |
|---|---|---|
| Ateliê de Pétalas | Tio Narciso | Faixa 3 ("ajusta ao sair") |
| Doceria de Néctar | Dona Margarida | Mel Feérico, Água de Cheiro, doces |
| Feira de Sementes | — | Ingredientes raros; decoração: lampiões de papel, vaso de muda |
| **Pousada Dente-de-Leão** | Seu Trevo | 40 cobres; camas que balançam com o vento |

### Treino
| Tipo | Local | Mestre | Minijogo | 1º Ouro |
|---|---|---|---|---|
| **Magia** | Círculo Feérico | Anciã Dália | **Ritmo**: acertar as runas no compasso enquanto florescem | Celly aprende *Orvalho Duplo*; Ícaro, *Runa-Broto* |
| **Força** | Pátio das Sentinelas | Guardiã Espinheira | **Duelo amigo** em tamanho de fada (montados em besouros) | Amuleto *Espinho de Honra* (contra-ataque 10%) |

---

## 7. Pratamar, porto de Argêntia (Capítulo 7; palácio no Epílogo)

### Casa principal — **O Palácio de Pratamar** (reino de origem do Irmão Silvano)
No Capítulo 7 o palácio só é visto de fora e pelo esgoto (ele se recusa a entrar: "Tenho
alergia a mármore"). **No Epílogo, depois da revelação**, o jogador o explora inteiro, com o
príncipe **Silvério Augusto** de guia — pela primeira vez sem piada pronta.

**Cômodos:** Galeria dos Retratos · Sala do Trono · Gabinete · Cozinhas · Jardim da Capela ·
Aposentos do Príncipe.

| Objeto | Texto ao examinar | O que revela |
|---|---|---|
| Galeria: retrato oficial aos 12 anos | "Um menino bochechudo de cabelo prateado, sufocado numa gola de renda, segurando um cetro como quem segura um peixe." — Silvano: "Três meses posando. Pintaram a gola com mais carinho do que a mim." | O pavor de retratos oficiais; a infância de vitrine |
| Galeria: moldura vazia | "Plaquinha: 'Sua Alteza, o Príncipe Herdeiro — aos 25'. A tela nunca foi pintada." | O ano em que ele fugiu |
| Sala do Trono: dois tronos e um banquinho | "O banquinho fica um degrau abaixo. Tem as iniciais 'S.A.' riscadas com alguma coisa pontuda. Várias vezes." | O tédio do menino nas audiências |
| Gabinete: livro-caixa do reino | "Anotações na letra dele, de anos atrás: 'Imposto do Cais Baixo: subiu. Imposto da Cidade Alta: isento (?)'. 'Perguntei ao Conselheiro. Ele riu.' 'Perguntei de novo. Ele parou de rir.'" | A desigualdade que ele viu de perto |
| Gabinete: carta nunca enviada | "'Pai, não é que eu não queira a coroa. É que eu não quero *esta*. Volto quando souber usar outra. — S.'" | Por que foi um "período sabático" e não uma renúncia |
| Cozinhas: prateleira baixa | "Cestos vazios com um pano por cima. A cozinheira os enchia de sobras toda noite. De manhã estavam vazios. Ninguém no palácio fazia perguntas." — Dona Benta: "Eu sabia pra onde iam. Eu punha mais." | Ele já levava comida ao Cais Baixo antes de fugir |
| Jardim da Capela: banco de pedra | "Gravado: 'Irmão Tomé ensinava aqui'. Um bastão de carvalho menor, de criança, encostado no banco." | Onde ele aprendeu o bastão e a ser monge (a cura ele aprendeu na Escola) |
| Gabinete: diploma enrolado, nunca emoldurado | "'Escola de Cura de Pratamar — com a mais alta distinção'. No verso, na letra dele: 'Curamos quem paga. Hoje recusaram um menino do Cais Baixo. Eu curei escondido. Fui advertido.'" | Por que ele largou a escola e o palácio; por que não usa magia para ferir |
| Aposentos: penteadeira | "Catorze escovas de cabelo. Sete estão faltando do estojo." — Ícaro: "As do mosteiro." — Silvano: "Um homem precisa de prioridades na fuga." | A vaidade é real; a piada também |
| Aposentos: debaixo da cama | "Um hábito de monge cor de açafrão, costurado à mão, torto. Tamanho de menino de dez anos." | Ele sonhava com isso desde criança |
| Aposentos: janela | "Daqui se vê o porto inteiro. As palafitas do Cais Baixo ficam bem embaixo. É impossível olhar por esta janela e não vê-las." | "Eu olhei durante vinte anos. Um dia eu vi." |

**Moradores e falas:**
- **Rainha-mãe Perpétua:** "Você fugiu." — "Fugi." — "Voltou mais magro, mais queimado de sol e
  mais gente. ...Seu pai está doente e teimoso. Vocês têm muito o que conversar."
- **Rei Argêncio VI** (acamado): "Disseram que meu filho virou monge e bêbado." — "As duas
  coisas, pai. Com dedicação." — "...E príncipe?" — "Isso eu estou aprendendo agora."
- **Dona Prata (a ama):** "Silvano! Meu Silvano!" — Ícaro: "Então o apelido..." — "Fui eu que
  dei, quando ele não sabia falar 'Silvério'. Ele nunca conseguiu se esconder direito, esse menino."
- **Mordomo Leopoldo:** anuncia todo mundo, inclusive a fada ("Sua Pequeneza, a Senhora Celestia").
- **Capitã Salina:** "Ordens, Alteza?" — "Abram os celeiros do palácio para o Cais Baixo.
  E me chama de Silvano."

**O que o palácio revela:** que a vaidade e a bebida eram disfarce e também verdade; que ele
ajudava os mais fracos muito antes de ser monge; que recusa magia de ataque porque viu o poder
virar extorsão; que fugiu por vergonha do reino, não por
preguiça da coroa; e que volta para mudá-lo.

### Casas extras
**Palafita da Dona Maré (Cais Baixo).** Moradores: Maré e os netos.
- *Marca na parede:* "Riscos de maré alta, um por ano. Os dos últimos anos estão mais altos que a cama."
- *Bastão de carvalho quebrado, guardado como relíquia:* "'Um moço de capuz consertava nosso telhado e deixou isso. Faz anos. Tinha uma mania de cabelo.'"
- **Gancho:** ela reconhece o monge e finge que não. Missão "Rede furada" (pesca).

**Casa do Arquivista Honório (Cidade Alta).**
- *Fichas genealógicas:* "Uma família que troca de sobrenome a cada geração: Solis → Soares → Sales → (rasurado). Na margem: 'Por que alguém se esconderia de um nome tão bom?'"
- **Gancho (pista principal):** o rastro dos Solis.

### Lojas e pousada
| Loja | Dono | Estoque |
|---|---|---|
| Armeira Cotinha (Cais Baixo) | Cotinha | Faixa 4, preço justo |
| Arsenal Valverde (Cidade Alta) | — | Faixa 4, o dobro do preço, com laço |
| Joalheria | Tibério | Amuletos; a fita "que estava barata" |
| Peixaria | Dona Maré | Consumíveis; iscas; compra peixe |
| **Pousada da Maré** | Dona Maré | 40 cobres (Cais Baixo) · **Hotel Argênteo** 200 cobres, mesma cura, toalha melhor |

### Treino
| Tipo | Local | Mestre | Minijogo | 1º Ouro |
|---|---|---|---|---|
| **Força** | Docas | Capitã Salina | **Carregar** caixotes pelo trapiche; **Ritmo**: puxar corda no compasso | Amuleto *Nó de Marinheiro* (imune a Enraizado) |
| **Magia** | **Escola de Cura de Pratamar** (uma das 3 melhores escolas de magia do mundo) | Mestra Serena, antiga professora de Silvano | **Fôlego** e **Ritmo**: curar bonecos de pano no compasso. Silvano espera do lado de fora, de capuz | Ícaro aprende *Alento Maior* (cura ×3,0); a mestra pergunta "quem te ensinou essa postura?" |
| **Magia** | Farol Velho | Faroleiro Lumiar | **Sequência**: acender as lentes do farol na ordem | Amuleto *Lente do Farol* (+10% de dano de Luz); de lá se vê o Charco ao longe |
| **Magia** (Epílogo) | Jardim da Capela | **Silvano** | **Fôlego**: meditar com ele, no banco do Irmão Tomé | *Milagre de Taverna* antecipado; conversa final dos dois |

---

## 8. Lugares sem cidade

| Lugar | Serviços |
|---|---|
| **Caverna dos Ecos** (Cap. 5) | Tenda do Eremita Baltazar (loja pequena, rede para descansar). Treino de magia: **Sequência** nos cristais. Sem treino de força ("aqui não se bate em nada, que desaba") |
| **Fortaleza Fuligem** (Cap. 8) | Cozinhas do Cozinheiro Banha (humano capturado): loja de comida e "pousada" (um canto escondido atrás do forno). **Sala dos Troféus** como casa extra — *examinável:* "Prateleiras de coisas roubadas, etiquetadas com capricho: um sino de mosteiro, um escudo de Bravaferro, uma placa de madeira: 'Silêncio. E limpe os pés.'" Gancho: eles não roubam por precisão; colecionam. Ícaro leva a placa de volta |
| **Ruínas de Valesol** (Cap. 9) | Sem serviços. Um lampião dourado no cafezal, com a Dona Zefa |
| **Acampamento do grupo** | Descanso, cozinha, decoração, conversas de fogueira (`05_sistemas.md`, seção 8) |

---

## 9. Tabela-resumo de serviços por região

| Região | Casa principal | Casas extras | Faixa das lojas | Treino de força | Treino de magia |
|---|---|---|---|---|---|
| Valesol (prólogo) | Casa de Ícaro | Custódia; padaria | — (sem loja) | Cafezal (prévia) | Livro escondido (prévia) |
| Áurea | Alojamento de Lucian | Dona Abigail; os Montalvão | 1 → 2 → 4 | Pátio da Guarda | Biblioteca; Torre |
| Ganso Tonto / Mosteiro | Cela de Silvano | Fridolina; Chico | 1 | Lenheiro | Jardim de pedra; sinos |
| Bravaferro | Casa dos Lâmina de Ferro | Mestre Tenaz; Viúva Ferrolho | 2 | Arena (com Valéria); quintal (Livinha) | Mirante (meditação) |
| Borda da Floresta | Toco da Celly | Vó Jurema; Bino | consumíveis | Lenheiro do Bino | Clareira das Lanternas |
| Caverna dos Ecos | — | Tenda do Eremita | consumíveis | — | Cristais |
| Brumaflor | Casa da Guardiã (lar de Celly) | Dona Margarida; Brotinhos | 3 | Pátio das Sentinelas | Círculo Feérico |
| Pratamar | Palácio (Epílogo) | Dona Maré; Arquivista | 4 | Docas | Escola de Cura; Farol; Jardim da Capela |
| Fortaleza Fuligem | — | Sala dos Troféus | comida | — | — |
