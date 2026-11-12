# Status — Frente 1: Narrativa e Game Design

Branch: `claude/triskelion-narrativa`

## 1. O que foi feito

### Prólogo jogável (prioridade máxima — entregue primeiro)
| Arquivo | Conteúdo |
|---|---|
| `docs/gdd/10_prologo_roteiro.md` | Roteiro cena a cena (6 cenas), regras da furtividade, tabela de flags, convenções dos JSON |
| `content/dialogues/prologo_*.json` | **25 arquivos, 234 falas**, no formato do contrato. Validados: JSON bem formado, todo `goto`/`if`/`choice` aponta para um `label` existente, nenhuma fala passa de 130 caracteres |
| `docs/gdd/11_prologo_marcadores.md` | 5 mapas, todos os marcadores citados nos JSON, gatilhos, interativos, patrulhas e checkpoints da furtividade, ids de atores |
| `docs/gdd/12_prologo_lista_assets.md` | Sprites e animações, direção visual dos Caligosuins, 25 retratos, 7 tilesets, 9 músicas, 27 efeitos sonoros |

### Game Design Document
| Arquivo | Conteúdo |
|---|---|
| `docs/gdd/01_mundo_e_historia.md` | Significado do triskelion, mitologia, reinos, estrutura em atos, arcos |
| `docs/gdd/02_personagens.md` | 13 personagens com aparência, paleta (hex), personalidade, 3 falas, batalha e papel |
| `docs/gdd/03_fases.md` | Mapa-múndi por nós, 10 capítulos + prólogo, quem entra onde, duração e dificuldade |
| `docs/gdd/04_inimigos_e_chefes.md` | Elementos e estados, família Caligosuin, inimigos por região, 11 chefes |
| `docs/gdd/05_sistemas.md` | Atributos, XP, fórmulas, mecânica própria de cada herói, magias, itens, AUTO, save, economia, curva |
| `docs/gdd/06_npcs.md` | NPCs por região, lojas, 12 missões secundárias, dicas |

### O que NÃO foi feito
- Falas definitivas dos capítulos 1–10 (só o prólogo tem diálogo em JSON; o resto está em
  resumo e falas de exemplo).
- `content/characters.json`, `enemies.json`, `items.json`: os números estão em `05_sistemas.md`
  e `04_inimigos_e_chefes.md`, mas ainda não viraram arquivos de dados.
- Nada foi testado em jogo: tempos de cena e números de balanceamento são estimativas.

## 2. Decisões tomadas (todas reversíveis; detalhe nos documentos)

**Prólogo**
- A vila se chama **Vila Torrinha**; o pai, **Anselmo**; a mãe, **Helena**.
- O pai **já estava a salvo e voltou para dentro de casa** buscar a caixinha de costura da
  esposa — onde estava o colar. Ele entrega o colar a Ícaro na despedida.
- O colar é plantado quatro vezes sem explicação: pisca na caixa durante a cura fracassada;
  flashback de 4 segundos com a voz da mãe ("meu solzinho"); ilumina o túnel; Ícaro o segura na
  última fala.
- A cura que falha chama-se **"Alento"** e é apresentada antes, num livro opcional do cafezal
  ("calma, respiração firme, mãos quentes").
- Furtividade com uma regra só: fique fora do cone; ser visto volta ao último ponto seguro.
- A morte do pai não é mostrada nem descrita: a câmera segue Ícaro; no túnel só há sons
  abafados e a frase "Lá em cima, o barulho parou. Depois, só o fogo."
- Tonho e a irmã sobrevivem (o prólogo termina com acolhimento, não só com perda).

**História**
- **Triskelion = pacto de três dádivas:** Luz (humanos/Lumnia), Flor (fadas/Nymphalion) e
  Brasa (os antepassados dos Caligosuins, que a corromperam em fogo negro).
- **Aurelius tirou a pedra do cajado** e a confiou à família, que sumiu de propósito. Helena
  disfarçou a pedra com um feitiço ("Casca").
- **Lucian é a terceira vítima** do acidente que matou Helena; ela salvou a vida dele. Daí o
  susto ao ver o rosto de Ícaro e o "Então ele é mesmo...".
- **A revelação do colar** acontece numa volta às ruínas da Torrinha (carta no fundo falso da
  caixinha), logo antes da batalha final.
- **O monge** se juntou porque viu selos de mercadores do próprio reino em caixotes inimigos.
- **O diretor** era o supervisor ausente no dia do acidente; no fim abre a faculdade.
- **Os Caligosuins rasos têm conserto:** sem fogo negro, voltam a ser porcos comuns.

**Design**
- Mundo em **mapa-múndi de nós**; inimigos **visíveis** no mapa (sem encontro aleatório).
- 5 elementos: Físico, Luz, Sombra, Feérico, Brasa.
- Mecânica própria: Ícaro — **Calma**; monge — **Graça**; Valéria — **Fúria**; Celly —
  **Confiança** (as magias dela falham no começo e param de falhar com a história).
- Ninguém morre em tela: heróis desmaiam, inimigos fogem ou são purificados.
- Save em **Lampiões de Aurelius**; os dourados curam; pousadas abrem "conversas de fogueira".
- Nível máximo 30; ~110 batalhas comuns; duração estimada 4 h 40 – 5 h 45.

**Tipos de passo novos nos diálogos (para o motor)**
- `anim` (`actor`, `anim`): troca de pose. Pode ser ignorado sem quebrar a cena.
- `title` (`text`, `subtitle`): cartão de título do fim do prólogo.
- `say` com `speaker: "tutorial"` para dicas de controle e `speaker: "narrador"` para narração.
- `move`/`spawn`/`camera`/`scene` usam **nomes de marcador**, não coordenadas.
- Campos assumidos onde o contrato não detalha: tabela no fim de `10_prologo_roteiro.md`.

## 3. Pontos de atenção para a coordenação

- **Não discordo de nenhuma decisão de `COORDENACAO.md`.**
- O prólogo depende de uma mecânica que não está na lista de sistemas do motor: **furtividade
  com cone de visão, esconderijos e checkpoint**. Também precisa de um **contador de colheita**
  (5 pés de café) que marca `prologo.colheita_completa`, e de uma **máscara de escuridão com
  círculo de luz** no túnel.
- Três diálogos são encadeados sem devolver o controle: `prologo_12` → `13` → `14`.
- `prologo_04_zefa` e `prologo_06_colheita_fim` usam o mesmo NPC: o motor/mapa escolhe o
  segundo quando `prologo.colheita_completa` está marcada.

## 4. Perguntas para o autor

**Nomes**
1. O **monge**: fica **Bento** (apelido de Benedito, o nome de príncipe)? Alternativas:
   Serafim, Teodoro.
2. Aprova os nomes **Vila Torrinha**, **Anselmo** (pai) e **Helena** (mãe)?
3. Aprova **Áurea** (capital), **Bravaferro** (reino de Valéria), **Argêntia** (reino do monge),
   **Brumaflor** (reino das fadas), **Trísia** (continente)?
4. Aprova os nomes dos líderes Caligosuins — **Morgrunho**, **General Bafo-Brasa**, **Madame
   Trufa**, **Capitão Toucim** — e a ideia de nomes inspirados em comida de porco?
5. A irmã de Valéria pode se chamar **Lívia ("Livinha")**? O rei, **Teobaldo III**? O diretor,
   **Eusébio Pergaminho**?

**História**
6. O pai entregar o colar na despedida (em vez de Ícaro já usá-lo desde criança): pode?
7. **A terceira espiral:** os Caligosuins como povo que já foi bom (Brasa corrompida), com
   soldados "recuperáveis" no fim — ou prefere que sejam simplesmente maus? (Há alternativa
   pronta: a terceira espiral vira Ferro/Coragem.)
8. **Lucian como a terceira vítima** do acidente, salvo por Helena: aprova?
9. **O diretor** como o supervisor que falhou no dia do acidente: aprova, ou pesa demais?
10. A revelação do colar numa **volta à Torrinha**, por uma carta da mãe: aprova?
11. O motivo do monge (nobres do reino dele vendendo suprimentos aos Caligosuins): aprova?
12. O briefing diz que os Caligosuins querem "dizimar outras raças". Mantive a ameaça nas falas
    dos líderes, mas os soldados são cômicos. O equilíbrio está bom, ou quer mais peso?

**Tamanho e formato**
13. **Duração:** 4–6 h no total e prólogo de 10–15 min — confirma?
14. **Mapa-múndi por nós** (toca na região e viaja) em vez de mundo aberto caminhável: confirma?
15. **Dez capítulos** depois do prólogo é o tamanho certo, ou prefere cortar (candidatos:
    Caverna dos Ecos e Pratamar poderiam se fundir a vizinhos)?
16. A idade de Ícaro (18) e de Valéria (20) está de acordo com o que imaginou?

**Tom**
17. O humor do prólogo (Tonho, o espirro, "tragam o café") antes e durante a tragédia: na
    medida, ou prefere o prólogo mais sério?
18. A última cena do epílogo com o Capitão Toucim vendendo café: fica ou sai?
