# Status — Frente 1: Narrativa e Game Design

Branch: `claude/triskelion-narrativa` (já com o merge das decisões do autor registradas em
`docs/COORDENACAO.md` até o commit `4227b94` do branch de coordenação).

## 1. O que foi feito

### Prólogo jogável
| Arquivo | Conteúdo |
|---|---|
| `docs/gdd/10_prologo_roteiro.md` | Roteiro em 7 cenas (0 a 6), regras da furtividade, tabela de flags, **autosaves previstos**, convenções dos JSON |
| `content/dialogues/prologo_*.json` | **48 arquivos, 326 falas**, no formato do contrato. Validados por script: JSON bem formado, todo `goto`/`if`/`choice` aponta para um `label` existente, nenhuma fala passa de 130 caracteres, todo marcador citado está documentado |
| `docs/gdd/11_prologo_marcadores.md` | 10 mapas (5 novos: casa de Ícaro, vila de manhã, casa da Custódia, padaria, biblioteca), marcadores, gatilhos, interativos, patrulhas, atores |
| `docs/gdd/12_prologo_lista_assets.md` | Sprites e animações, direção visual dos Caligosuins, 29 retratos, tilesets (com interiores), **10 músicas descritas por clima e instrumentos**, 29 efeitos sonoros |

### Game Design Document
| Arquivo | Conteúdo |
|---|---|
| `docs/gdd/01_mundo_e_historia.md` | Significado do triskelion, mitologia, reinos, atos, arcos |
| `docs/gdd/02_personagens.md` | 13 personagens: aparência, paleta (hex), personalidade, 3 falas, batalha, papel |
| `docs/gdd/03_fases.md` | Mapa-múndi por nós, prólogo + 11 capítulos, duração (~12 h de história), extras, pós-jogo |
| `docs/gdd/04_inimigos_e_chefes.md` | Elementos, estados, família Caligosuin, inimigos por região, 11 chefes |
| `docs/gdd/05_sistemas.md` | Atributos, XP, fórmulas, mecânica de cada herói, itens, AUTO, **treino**, **atividades cozy**, **acampamento**, **salvamento**, economia, curva (dificuldade Tranquila) |
| `docs/gdd/06_npcs.md` | NPCs de rua por região, missões secundárias, dicas |
| `docs/gdd/07_cidades_e_servicos.md` | **Novo.** Por cidade: casa principal (cômodos, examináveis com texto, moradores, o que revela), 1–2 casas extras com gancho, lojas, pousada, treinos de força e magia com minijogo |

### Decisões do autor já aplicadas (segunda passada)
| Decisão | Onde foi aplicada |
|---|---|
| Monge = **Irmão Silvano** | Todo o GDD. Nome real definido: **príncipe Silvério Augusto de Argêntia** (porto de Pratamar); "Silvano" é o apelido que a ama lhe deu |
| Duração 8–24 h (história ~10–14 h) | `03_fases.md` (tabela por capítulo, extras), `05_sistemas.md` (nível máximo 50, ~40 no fim, ~200 batalhas) |
| Só a dificuldade **Tranquila** | `05_sistemas.md` (régua de inimigos, regras gentis, AUTO); as outras ficam como nota de expansão |
| Clima majoritariamente cozy | `05_sistemas.md` seção 8 (colher, cozinhar, pescar, ajudar moradores, decorar o acampamento, conversas de fogueira); músicas por instrumento em `12` |
| **Salvar a qualquer momento** + gravar ao sair da página | `05_sistemas.md` seção 9; `03`, `06`, `10`. Os Lampiões de Aurelius deixaram de ser pontos de save: agora curam e servem de viagem rápida |
| **Casas exploráveis** | Prólogo: nova Cena 0 (casa de Ícaro, casa da Custódia, padaria, biblioteca), com todos os textos em JSON. Valéria, Celly e o palácio de Silvano: `07_cidades_e_servicos.md` |
| 1–2 casas extras, lojas e treinos por cidade | `07_cidades_e_servicos.md`; regras de treino em `05_sistemas.md` seção 7 |
| Prévia de treino no prólogo, sem loja | Colheita ("fortalece a Força") e livro escondido ("fortalece a Magia") |

### O que NÃO foi feito
- Falas em JSON existem só para o prólogo. Os capítulos 1–11 estão em resumo; as casas de
  `07` têm o texto de cada objeto e falas-base, mas ainda em Markdown, não em `content/dialogues/`.
- `content/characters.json`, `enemies.json`, `items.json` não foram criados (os números estão em
  `05_sistemas.md` e `04_inimigos_e_chefes.md`).
- Nada foi testado em jogo: durações e balanceamento são estimativas.
- Os inimigos de `04` não foram recontados para o jogo mais longo: a lista serve, mas regiões
  com 1 h+ de exploração provavelmente pedem 1–2 inimigos comuns a mais cada.

## 2. Decisões desta sessão (reversíveis)

**Prólogo**
- Começa de **manhã, em casa**: café com o pai (o conflito e o afeto em um minuto), casa e três
  vizinhos exploráveis; depois o cafezal ao entardecer. A vila que queima é a mesma da manhã.
- O pai **já estava a salvo e voltou** para buscar a caixinha de costura da esposa, onde estava
  o colar; entrega o colar na despedida.
- Objetos da manhã que voltam à noite: a caixinha, a viga do telhado (pote "TELHADO"), o
  alçapão do túnel, o barril da Custódia, o colchão com os livros.
- Furtividade com uma regra só; ser visto volta ao último ponto seguro.
- A morte do pai não é mostrada nem descrita.

**História**
- Triskelion = pacto de três dádivas: Luz, Flor e Brasa (esta, corrompida em fogo negro).
- Aurelius tirou a pedra do cajado e a confiou à família, que sumiu de propósito.
- Lucian é a terceira vítima do acidente; Helena salvou a vida dele.
- A revelação do colar vem por uma carta, numa volta às ruínas da Torrinha.
- Celly foi achada bebê e criada por uma doceira; o brasão nobre dela serve de calço de porta.
- Silvano saiu porque nobres do reino dele vendiam suprimentos aos Caligosuins.
- O diretor era o supervisor ausente no dia do acidente.
- Epílogo jogável (leva cada amigo para casa) e pós-jogo de reconstrução da Torrinha.

**Design**
- Mapa-múndi de nós; inimigos visíveis no mapa.
- Mecânicas próprias: Calma (Ícaro), Graça (Silvano), Fúria (Valéria), Confiança (Celly).
- Treino: 3 sessões de força e 3 de magia por cidade a cada capítulo; cinco modelos de minijogo
  (Ritmo, Sequência, Carregar, Fôlego, Duelo amigo); sempre com opção "treinar no automático".

**Tipos de passo novos nos diálogos (para o motor)**
- `anim` (`actor`, `anim`): troca de pose; pode ser ignorado.
- `title` (`text`, `subtitle`): cartão de título.
- `say` com `speaker: "tutorial"` e `speaker: "narrador"`.
- Campos assumidos: tabela no fim de `10_prologo_roteiro.md`.

## 3. Pontos de atenção para a coordenação

- **Não discordo de nenhuma decisão de `COORDENACAO.md`.**
- O prólogo pede do motor: furtividade (cone de visão, esconderijos, checkpoint), contador de
  colheita (marca `prologo.colheita_completa`), máscara de escuridão no túnel, **troca de mapa
  por porta** (interiores) e porta bloqueada por flag (`prologo.cafe_com_pai`).
- `prologo_vila_manha` e `prologo_vila` precisam ter **a mesma planta** (aviso em `11`).
- `prologo_12` → `13` → `14` são encadeados sem devolver o controle; autosave antes, na soleira.
- A duração do prólogo no caminho direto fica em 10–15 min; quem examinar tudo na manhã chega
  a ~18 min.
- Sistemas novos que o GDD passou a pedir, além de batalha: treinos (5 minijogos), cozinhar,
  pescar, acampamento com decoração, caixas de correio. São muitos; sugiro que a coordenação
  defina a ordem de implementação.

## 4. Perguntas para o autor

**Nomes**
1. Aprova **Silvério Augusto de Argêntia** como nome real do Irmão Silvano?
2. Aprova **Vila Torrinha**, **Anselmo** (pai) e **Helena** (mãe)?
3. Aprova **Áurea**, **Bravaferro**, **Argêntia/Pratamar**, **Brumaflor**, **Trísia**?
4. Aprova os líderes Caligosuins — **Morgrunho**, **General Bafo-Brasa**, **Madame Trufa**,
   **Capitão Toucim** — e a ideia de nomes inspirados em comida de porco?
5. **Lívia ("Livinha")**, **Rei Teobaldo III**, **Diretor Eusébio Pergaminho**: aprova?

**História**
6. O prólogo começar de manhã, com o café com o pai, antes do cafezal: aprova?
7. O pai entregar o colar na despedida (em vez de Ícaro já usá-lo desde criança): pode?
8. A terceira espiral: os Caligosuins como povo que já foi bom, com soldados recuperáveis no
   fim — ou prefere que sejam simplesmente maus? (Alternativa pronta: Ferro/Coragem.)
9. Lucian como a terceira vítima do acidente, salvo por Helena: aprova?
10. O diretor como o supervisor que falhou no dia do acidente: aprova, ou pesa demais?
11. A revelação do colar numa volta à Torrinha, por uma carta da mãe: aprova?
12. Celly ter sido achada bebê (por isso não sabia que era nobre): aprova?
13. O motivo de Silvano (nobres do reino dele abastecendo os Caligosuins): aprova?
14. O briefing diz que os Caligosuins querem "dizimar outras raças". Mantive a ameaça nos
    líderes e deixei os soldados cômicos. O equilíbrio está bom?

**Tamanho e formato**
15. Mapa-múndi por nós (toca na região e viaja) em vez de mundo aberto caminhável: confirma?
16. Epílogo jogável e pós-jogo de reconstruir a Torrinha: entram, ou ficam para depois?
17. Idades: Ícaro 18, Valéria 20, Silvano ~28. De acordo?

**Tom**
18. O humor do prólogo (Tonho, o espirro, "tragam o café") antes e durante a tragédia: na
    medida?
19. O Capitão Toucim vendendo café no epílogo: fica ou sai?
