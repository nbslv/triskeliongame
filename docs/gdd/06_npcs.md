# 06 — NPCs por região

Para cada região: quem está lá, onde fica, o que diz (falas de exemplo — as definitivas irão
para `content/dialogues/`), missões secundárias, lojas e dicas. NPCs **mudam de fala** conforme
a história avança; as mudanças mais importantes estão anotadas.

**Casas exploráveis, lojas, pousadas e locais de treino de cada cidade** estão em
`07_cidades_e_servicos.md`; aqui ficam os NPCs de rua, as missões e as dicas.
Nomes principais já aprovados pelo autor (`docs/DECISOES_AUTOR.md`); NPCs menores são propostas desta sessão. Missões secundárias são curtas (3–8 min), nunca obrigatórias,
e sempre contam um pedacinho do mundo.

---

## Prólogo — Cafezal e Valesol
Falas completas em `content/dialogues/prologo_*.json`.

| NPC | Onde | Função |
|---|---|---|
| **Tonho** | Cafezal; depois bambuzal | Amigo de colheita; tutorial; humor |
| **Dona Zefa** | Balança do cafezal | Capataz; planta a mãe e a teimosia do pai |
| **O pai (Tadeo)** | Casa de Ícaro, à mesa (manhã) | Café da manhã; o conflito e o afeto |
| **Dona Custódia** (e a galinha **Pamonha**) | Casa dela (manhã); barril, Rua do Terreiro; bambuzal | Ovos; fofoca do pai na biblioteca; conta por que o pai voltou |
| **Seu Juca** | Padaria (manhã) | Pão de Ontem; "a luz da torre piscou" |
| **Dona Ermelinda** | Biblioteca (manhã) | O livro atrasado; a ficha "Aurora" |
| **Aldeões em fuga** | Estrada | Dão nome ao inimigo e o destino |
| **Sargento Íris Candeia**, **Soldado Dário** | Bambuzal | Escolta; ponte para Lucian |
| **Nina** | Bambuzal | Irmã do Tonho; dá a Rapadura Amassada |

---

## Áurea, capital de Luminaer (Cap. 1; base durante o jogo)

### Bairro dos Refugiados (Poterna Leste)
| NPC | Onde | O que diz / faz |
|---|---|---|
| **Tonho** | Fila da sopa | "Aqui a sopa é de graça e a fila é cara." Depois do Cap. 1, vira ajudante da reconstrução; a cada capítulo conta uma novidade da capital. |
| **Nina** | Perto do poço | Coleciona pedrinhas. **Missão: "Pedrinhas da Nina"** — trazer uma pedra bonita de cada região (7). Recompensa final: *Café Valesol* ×2 e um desenho do grupo. |
| **Dona Custódia** | Canto das galinhas | Se `prologo.falou_custodia`: dá o amuleto *Pena da Pamonha* (+10% de chance de fuga). "Meu Tadeo ia gostar de te ver de pé, menino." |
| **Sargento Íris** | Portão interno | Dicas de batalha. "Defender não é covardia. É matemática." |
| **Seu Juca, o padeiro** | Forno improvisado | Loja: Rapadura, Broa de Milho. "A padaria queimou. A receita, não." |

### Praça do Relógio
| NPC | Onde | O que diz / faz |
|---|---|---|
| **Dona Abigail** | Mercearia "Grão e Cia." | **Loja de consumíveis.** "Café Coado pra magia, Chá de Boldo pro resto." |
| **Mestre Bigorna** | Ferraria | **Loja de equipamento (faixas 1–2; faixa 4 no Ato 3).** Resmunga que arco "é graveto com barbante". |
| **Madame Lia** | Banca de pergaminhos | **Amuletos.** Lê a sorte errado de propósito. |
| **O Relojoeiro** | Sob o relógio | **Missão: "A hora certa"** — o relógio parou na hora do ataque; achar 3 engrenagens pelas muralhas. Recompensa: *Relógio de Bolso* (age primeiro na 1ª rodada). |
| **Crianças** | Chafariz | Brincam de "Lumnia e porquinho". Depois do Cap. 1, uma delas é sempre "o Ícaro". |

### Faculdade de Magia
| NPC | Onde | O que diz / faz |
|---|---|---|
| **Diretor Eusébio Pergaminho** | Gabinete | "Sem matrícula, sem biblioteca." (A matrícula custa 3.000 cobres.) No Ato 3: a confissão. |
| **Dona Clotilde, a bibliotecária** | Biblioteca | Na capital a regra é a mesma: magia só para matriculados. Ela deixa Ícaro "olhar" os livros, "porque o regulamento proíbe emprestar, não proíbe olhar". Se `prologo.visitou_biblioteca`: "Ermelinda de Valesol? Esquecia livros em cima do balcão a vida inteira. Colega minha." **Missão: "Devolução atrasada"** — recuperar 5 livros espalhados pelo mundo (o último, o Volume 2, na Fortaleza Fuligem). Recompensa: magia *Flecha de Luz* antecipada e, no fim, o cartão de sócio. |
| **Otávio e Pérola** | Pátio | Alunos ricos. Começam esnobes ("colhedor de quê?"); depois do Cap. 1, sem graça; no Ato 3, lutam na muralha. |
| **Zelador Fausto** | Escadaria da torre | Conheceu o cajado "antes de ele dar trabalho". Dica: "Ele brilha mais quando o senhor tá calmo. Igual planta." |
| **Anciã Honorata** | Sala do Conselho | Conta a lenda da Pedra de Triskelion. |

### Castelo
| NPC | Onde | O que diz / faz |
|---|---|---|
| **Rei Teobaldo III** | Sala do trono | Oferece chá. Dá a missão principal. |
| **Comandante Lucian Alvorada** | Muralha; Sala de Guerra | Mentor. Entre capítulos, ensina uma lição (e deixa escapar uma lembrança de Aurora por vez). |
| **Camareira Rosa** | Corredor | Fofocas do castelo = resumo da história até ali (serve de "onde eu parei?"). |

---

## Estrada do Trigo e Mosteiro da Serra Calma (Cap. 2)

| NPC | Onde | O que diz / faz |
|---|---|---|
| **Dona Fridolina** | Balcão da Hospedaria do Ganso Tonto | **Pousada (15 cobres, para descansar) e loja.** "O monge? Três semanas de conta. Ele paga em bênção. Bênção não compra farinha." |
| **Silvano** (antes de entrar no grupo) | Mesa do canto | "Meu jovem, sente-se. Você tem cara de quem vai pagar a próxima." |
| **Caixeiro Aníbal** | Estrada (aparece em vários capítulos) | **Mascate ambulante**: vende um item raro por região. "Preço de amigo. De amigo rico." |
| **Abade Plácido** | Mosteiro | Suspira. "O Irmão Silvano é... uma provação que os céus nos enviaram." **Missão: "Os sinos da Serra"** — tocar 3 sinos na ordem certa (dica nos vitrais). Recompensa: *Contas do Abade*. |
| **Irmã Dulce** | Horta do mosteiro | Ensina a Ícaro que cura "é prestar atenção". Vende Pomada de Arnica. |
| **Lavrador Chico** | Trigal | **Missão: "Espantalho de volta"** — acalmar o Espantalho Zangado sem queimá-lo (usar Luz). Recompensa: Tacho de Doce. |

---

## Bravaferro (Cap. 3)

| NPC | Onde | O que diz / faz |
|---|---|---|
| **Livinha** | Casa dos Lâmina de Ferro | "Princesa por fora, cavaleira por dentro." Dá a *Fita da Livinha*. Manda cartas depois. |
| **Dona Berta e Seu Hildo** | Casa dos Lâmina de Ferro | Pais de Valéria; ferreiros. A mãe mede Ícaro com os olhos: "Come pouco, esse menino." **Pousada grátis.** |
| **Marechala Brígida** | Salão das Lâminas | Chefe do conselho. "Magia é atalho. Aqui a gente sobe a pé." Promete tropas ao fim do capítulo. |
| **Mestre Tenaz** | Arena dos Juramentos | **Treinos pagos** (mini-batalhas com regra especial; recompensas em XP). |
| **Ferreira Guta** | Forja-Alta | **Loja de equipamento (faixa 2).** Desconto depois das Minas. |
| **Velho Carvão** | Entrada das minas | **Missão: "Lanterna perdida"** — achar a lanterna da Toupeira Mineira e devolver (ela para de atacar). Recompensa: atalho nas minas + *Capacete de Lanterna*. |
| **Recrutas da arena** | Arena | Apostam em quanto tempo o "magrelo" dura. Depois: pedem autógrafo no escudo. |

---

## Floresta dos Sussurros (Cap. 4)

| NPC | Onde | O que diz / faz |
|---|---|---|
| **Vó Jurema** | Cabana na borda | Erveira. **Loja: chás e pomadas.** "A mata tá gripada. Mata gripada espirra bicho." |
| **Celly** (antes de entrar no grupo) | Atrás de uma folha, sempre | "D-desculpa! Eu não tava seguindo. Eu tava... indo pro mesmo lugar. Atrás de vocês." |
| **Lenhador Bino** | Clareira das Lanternas | Não corta mais nada "até a mata sarar". **Missão: "Lanternas da clareira"** — acender 5 lanternas com *Centelha* para afastar os Vaga-lumes Apagados. Recompensa: *Lamparina de Bolso*. |
| **A Coruja** | Galho alto | Só responde com perguntas. Dica do caminho para o Coração da Floresta. |
| **Raposa curada** | Trilha Murcha (após o chefe) | Segue o grupo até a borda; deixa um presente (item) na porta da Vó Jurema. |

---

## Caverna dos Ecos (Cap. 5)

| NPC | Onde | O que diz / faz |
|---|---|---|
| **Eremita Baltazar** | Boca da caverna | Fala pouco para "não acordar os cristais". **Vende Sininho de Fuga e Café Forte.** Dica: "Lá dentro, o que você grita, volta." |
| **Cristal Tagarela** | Salão dos Cristais | Repete tudo com atraso e com erro. Ensina o quebra-cabeça de eco. |
| **Peixe cego do Lago Parado** | Lago | **Missão: "Uma nota só"** — tocar nos cristais a melodia do `tema_mae`. Recompensa: *Concha de Eco* (repete de graça a última magia de Celly, 1× por batalha). |

---

## Brumaflor, reino das fadas (Cap. 6)

| NPC | Onde | O que diz / faz |
|---|---|---|
| **Anciã Dália** | Estufa do Conselho | Conta a origem do triskelion. "A pedra dorme perto de um coração que é sol." |
| **Conselheira Camélia** | Estufa do Conselho | Fria com Celly. "Uma guardiã que não guarda é um vaso sem fundo." No epílogo, é a primeira a se curvar. |
| **Guardiã Espinheira** | Portão das Pétalas | Antes do duelo: "Regra é regra." Depois: respeito seco. |
| **Tio Narciso** | Ateliê de Pétalas | **Loja de equipamento (faixa 3)** — tudo em tamanho de fada, "ajusta ao sair". |
| **Dona Margarida** | Doceria de Néctar | **Loja: Mel Feérico, Água de Cheiro.** Foi a ama de Celly e é a única que ainda a trata bem — sem dizer o nome dela, porque a lei proíbe. "Você comia o glacê e deixava o bolo. Agora come o bolo também, viu?" |
| **Brotinhos** | Canteiro-escola | Fadas crianças que ainda não despertaram magia. **Missão: "Aula de coragem"** — Celly ensina (três escolhas de diálogo; a certa é admitir que tem medo). Recompensa: +1 de Confiança inicial permanente. |
| **Fada-Carteira Íris-Azul** | Correio de libélulas | Entrega as cartas da Livinha "com taxa de vento". |

---

## Pratamar, porto de Argêntia (Cap. 7)

| NPC | Onde | O que diz / faz |
|---|---|---|
| **Dona Maré** | Cais Baixo, barraca de peixe | **Pousada (40 cobres) e loja.** Reconhece o monge e finge que não. "Tem gente que some e volta melhor. Tomara." |
| **Arquivista Honório** | Arquivo Mercante | Cobra taxa por página. Depois de uma gorjeta (ou de um olhar do monge): acha o rastro dos Solis. |
| **Conselheiro-Mor Áureo Valverde** | Cidade Alta | Sorriso de moeda. "Negócio não tem lado, meu jovem. Tem margem." |
| **Capitã Salina** | Docas | Comanda a frota. Leal ao príncipe "que tinha a mania de ajudar a descarregar". Volta na batalha final. |
| **Joalheiro Tibério** | Cidade Alta | **Loja de amuletos (caros).** Aqui Ícaro compra a fita "que estava barata". |
| **Armeira Cotinha** | Cais Baixo | **Loja de equipamento (faixa 4), mais em conta que na Cidade Alta.** |
| **Pivete Sardinha** | Becos | **Missão: "Cartazes do príncipe"** — trocar 6 cartazes mal desenhados por um retrato decente (o monge reclama de todos). Recompensa: *Capuz do Peregrino*. |
| **Pescadores** | Palafitas | "Lá em cima o chão é de mármore. Aqui o chão é maré." |

---

## Charco de Caligem e Fortaleza Fuligem (Cap. 8)

| NPC | Onde | O que diz / faz |
|---|---|---|
| **Caixeiro Aníbal** | Beira do charco | Última loja antes da fortaleza. "Não pergunte como eu cheguei aqui." |
| **Cozinheiro Banha** | Cozinhas da fortaleza | **Humano**, cozinheiro de Pratamar capturado e obrigado a cozinhar para a tropa. Esconde o grupo na despensa em troca de ajuda para fugir. **Vende comida.** "Fogo preto não doura nada. Uma tristeza. Me tirem daqui." |
| **Recrutas de folga** | Dormitório | Dois soldados jogando dados e discutindo quem viu "uma coisa amarela" no corredor. Dá para passar escondido enquanto discutem (humor entre eles, como no prólogo). |
| **Capitão Toucim** | Corredor da biblioteca | No 3º encontro, deserta: "Eu só queria um uniforme do meu tamanho. E um café." Larga a bandeira, aponta o caminho "sem querer" e some. |
| **Prisioneira Alvina** | Cela | Maga de Luminaer capturada. **Missão: "Chave do carcereiro"**. Recompensa: magia *Chuva de Estrelas* antecipada. |

---

## Volta a Valesol (Cap. 9)

| NPC | Onde | O que diz / faz |
|---|---|---|
| **Dona Zefa** | Cafezal | Sobreviveu. Replantando. "Café leva três anos pra dar. Eu tenho tempo." Dá *Café Valesol*. |
| **Lucian** | Ruínas da casa | Conta a história do acidente e da vassoura. |
| *(sem inimigos, sem loja)* | | Um pé de café brotou no terreiro. Examinar: "Teimoso. Puxou a quem?" |

---

## A Batalha de Áurea e Epílogo (Cap. 10)

Todos os NPCs importantes reaparecem em uma linha cada:

- **Tonho** comanda a "brigada do balde". **Nina** guarda as pedrinhas "pra depois".
- **Otávio e Pérola** seguram um trecho de muralha. **Diretor Eusébio** abre a torre: "Artigo
  primeiro: a torre é de quem precisar dela."
- **Rei Teobaldo** manda abrir os portões aos aliados. "Assinado: eu."
- **Marechala Brígida**, **pais de Valéria**, **Guardiã Espinheira**, **Capitã Salina** entram
  na luta contra Bafo-Brasa.
- **Epílogo:** Dona Custódia e Pamonha num galinheiro novo; Seu Juca reabre a padaria; Dona
  Clotilde carimba o cartão de Ícaro; **Livinha** com uma tiara de verdade (presente de um certo
  príncipe); **Capitão Toucim**, desertor, com uma banca de café de beira de estrada, jurando que nunca foi capitão: "É cheiroso."

---

## Regras gerais para NPCs

- **Toda região tem:** 1 loja de consumíveis, 1 dica de batalha, 2–3 missões secundárias
  (as desta lista + os ganchos das casas extras em `07`), 1 piada.
- **Salvar não depende de NPC:** o jogador salva pelo menu a qualquer momento; pousadas são
  para descansar, cozinhar e conversar.
- **Dicas** vêm sempre de personagens, nunca de menus (a sargento, o zelador, a erveira...).
- **Ninguém é só vitrine:** todo lojista tem uma fala que muda depois do chefe da região.
- **A desigualdade aparece sem sermão:** fila da sopa × pátio da faculdade; palafita × mármore;
  fadas que despertaram × brotinhos. O jogo mostra; quem comenta, se comenta, é o monge.
