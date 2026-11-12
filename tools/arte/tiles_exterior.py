"""Tileset `tiles_exterior` (+ variações `_tarde` e `_noite` com os MESMOS índices).

Vila, cafezal, estrada e bambuzal. Só acrescente blocos NO FIM (ver nota em px.Sheet).
"""
from px import C, T, Sheet, col, mix, mul, rnd, OUT, OUT2
import tex
import ext_vila
from tex import tile, transicao

VERDE_OUT = '#33603f'
MAD = dict(b='#b98a5c', e='#9c7048', l='#cfa273', o='#6b4a35')   # madeira clara
MADE = dict(b='#8a5f41', e='#6f4a33', l='#a37652', o='#4a3129')  # madeira escura


def junta(*cs, lado=True):
    """Cola telas lado a lado (ou em pilha)."""
    w = sum(c.w for c in cs) if lado else max(c.w for c in cs)
    h = max(c.h for c in cs) if lado else sum(c.h for c in cs)
    r = C(w, h)
    x = y = 0
    for c in cs:
        r.blit(c, x, y)
        if lado:
            x += c.w
        else:
            y += c.h
    return r


# ------------------------------------------------------------------ vegetação

def arvore(seed=0, tom=0):
    c = C(32, 48)
    base, luz, esc = [('#5fa052', '#82c065', '#4a8747'), ('#6fa84c', '#96c962', '#558a41')][tom]
    c.sombra_chao(16, 43, 11, 3)
    # tronco
    c.rect(13, 28, 6, 15, MADE['b'])
    c.rect(13, 28, 2, 15, MADE['e'])
    c.rect(17, 30, 1, 12, MADE['l'])
    c.px(12, 42, MADE['b']).px(19, 42, MADE['b']).px(11, 43, MADE['e']).px(20, 43, MADE['b'])
    # copa em bolas
    bolas = [(16, 17, 14, 14), (8, 20, 7, 7), (24, 20, 7, 7), (11, 9, 8, 7), (21, 9, 8, 7), (16, 26, 9, 5)]
    for cx, cy, rx, ry in bolas:
        c.ell(cx, cy, rx, ry, base)
    for cx, cy, rx, ry in [(11, 8, 5, 4), (21, 8, 5, 3), (7, 18, 3, 3), (16, 14, 5, 4), (24, 17, 3, 2)]:
        c.ell(cx - 1, cy - 1, rx, ry, luz)
    for y in range(34):
        for x in range(32):
            if c.get(x, y)[3] == 255 and c.get(x, y) != col(MADE['b']):
                d = ((x - 13) / 15) ** 2 + ((y - 12) / 16) ** 2
                r = rnd(x, y, seed + 40)
                if d > 0.95 + r * 0.3 and y > 15:
                    c.p[x, y] = col(esc)
                elif r < 0.05:
                    c.p[x, y] = col(esc)
    c.outline(VERDE_OUT)
    for y in range(28, 44):  # contorno do tronco em marrom
        for x in range(10, 22):
            if c.get(x, y) == col(VERDE_OUT) and y > 32:
                c.p[x, y] = col(MADE['o'])
    return c


def arbusto(frutos=None, seed=0):
    c = C(16, 16)
    c.ell(8, 9.5, 7, 5.5, '#5fa052')
    c.ell(5, 6.5, 4, 3.5, '#5fa052').ell(11, 6.5, 4, 3.5, '#5fa052')
    c.ell(5, 5.5, 2.5, 2, '#82c065').ell(11, 6, 2.2, 1.5, '#82c065')
    for y in range(16):
        for x in range(16):
            if c.get(x, y)[3] and y > 10 and rnd(x, y, seed) < 0.6:
                c.p[x, y] = col('#4a8747')
    if frutos:
        for k in range(5):
            c.px(3 + int(rnd(k, 1, seed) * 10), 6 + int(rnd(k, 2, seed) * 6), frutos)
    return c.outline(VERDE_OUT)


def pe_cafe(estado, seed=0):
    """Pé de café 16×32: 'verde', 'maduro' (frutos vermelhos e brilho) ou 'colhido'."""
    c = C(16, 32)
    c.sombra_chao(8, 29, 6, 2)
    c.rect(7, 22, 2, 8, MADE['b']).px(7, 23, MADE['e']).px(7, 26, MADE['e'])
    base, luz, esc = '#3f8a4a', '#62ad5a', '#2f6e41'
    for cx, cy, rx, ry in [(8, 16, 7, 8), (8, 8, 5.5, 5), (4.5, 19, 3.5, 4), (11.5, 19, 3.5, 4)]:
        c.ell(cx, cy, rx, ry, base)
    for cx, cy, rx, ry in [(6, 6, 2.5, 2), (5, 13, 2, 2), (10, 11, 2, 1.5)]:
        c.ell(cx, cy, rx, ry, luz)
    for y in range(26):
        for x in range(16):
            if c.get(x, y) == col(base) and (rnd(x, y, seed) < 0.10 or (y > 19 and rnd(x, y, seed + 1) < 0.5)):
                c.p[x, y] = col(esc)
    pos = [(4, 9), (10, 7), (6, 14), (11, 14), (3, 18), (8, 19), (12, 20), (7, 10), (9, 16), (5, 21)]
    if estado == 'verde':
        for x, y in pos[:7]:
            c.px(x, y, '#b5d86a')
    elif estado == 'maduro':
        for x, y in pos:
            c.px(x, y, '#d8413a')
            c.px(x, y + 1, '#a52a33')
        for x, y in [(2, 5), (13, 11)]:   # brilhos
            c.px(x, y, '#fff3c4').px(x - 1, y, '#ffe27a').px(x + 1, y, '#ffe27a').px(x, y - 1, '#ffe27a').px(x, y + 1, '#ffe27a')
    return c.outline(VERDE_OUT)


def toco():
    c = C(16, 16)
    c.sombra_chao(8, 13, 7, 2)
    c.rect(3, 6, 10, 7, MADE['b']).rect(3, 6, 2, 7, MADE['e']).rect(11, 7, 1, 5, MADE['l'])
    c.px(2, 12, MADE['b']).px(13, 12, MADE['b'])
    c.ell(8, 6, 5, 2.6, '#d9b98a')
    c.ell(8, 6, 3, 1.4, '#c49f72').px(8, 6, '#a98458').px(7, 5, '#d9b98a')
    return c.outline(MADE['o'])


def bambu(seed=0):
    """Touceira de bambu 16×48."""
    c = C(16, 48)
    c.sombra_chao(8, 45, 6, 2)
    for k, (x, h0, larg) in enumerate([(3, 6, 2), (7, 0, 3), (12, 9, 2)]):
        v, l, e = '#8fb85a', '#b6d67c', '#6f9a4a'
        c.rect(x, h0, larg, 46 - h0, v)
        c.rect(x, h0, 1, 46 - h0, l)
        if larg > 2:
            c.rect(x + larg - 1, h0, 1, 46 - h0, e)
        for y in range(h0 + 4 + k * 2, 46, 8):
            c.rect(x, y, larg, 1, e)
    folhas = [(1, 4), (9, 3), (13, 7), (5, 12), (11, 16), (0, 20), (14, 24), (6, 22), (10, 30)]
    for i, (x, y) in enumerate(folhas):
        d = 1 if i % 2 else -1
        fc = ['#6fae52', '#8cc866', '#5a9648'][i % 3]
        for t in range(4):
            c.px(x + d * t, y + t // 2, fc)
            c.px(x + d * t, y + t // 2 + 1, fc)
    return c.outline(VERDE_OUT)


def bambu_denso(topo=False):
    c = C(16, 16)
    for k, x in enumerate(range(0, 16, 4)):
        v = ['#7fa850', '#8fb85a', '#789f4c', '#88b056'][k]
        c.rect(x, 0, 4, 16, v).rect(x, 0, 1, 16, '#b0d078').rect(x + 3, 0, 1, 16, '#55803f')
        c.rect(x + 1, (k * 5 + 3) % 16, 2, 1, '#55803f')
    if topo:
        c2 = C(16, 16)
        c2.blit(c.crop(0, 8, 16, 8), 0, 8)
        for x in range(16):
            hh = 4 + int(rnd(x, 0, 5) * 5)
            c2.rect(x, hh, 1, 8, ['#6fae52', '#5a9648', '#8cc866'][x % 3])
        for x in range(0, 16, 3):
            c2.px(x, 3 + int(rnd(x, 1, 5) * 4), '#8cc866')
        return c2.outline(VERDE_OUT)
    return c


def flores(cor1, cor2, seed):
    c = tile(tex.grama(seed))
    for k in range(5):
        x = 2 + int(rnd(k, 1, seed) * 12)
        y = 2 + int(rnd(k, 2, seed) * 12)
        cc = cor1 if k % 2 else cor2
        c.px(x, y, cc).px(x - 1, y, cc).px(x + 1, y, cc).px(x, y - 1, cc).px(x, y + 1, '#5f9a4a')
        c.px(x, y, '#fff3c4' if k % 2 else '#ffe27a')
    return c


def capim(seed=0):
    c = C(16, 16)
    for k in range(7):
        x = 1 + k * 2 + int(rnd(k, 0, seed) * 2)
        h = 5 + int(rnd(k, 1, seed) * 7)
        cc = ['#9fc35f', '#b9d573', '#86ad52'][k % 3]
        for t in range(h):
            c.px(x + (1 if t > h - 3 and k % 2 else 0), 15 - t, cc)
        if k % 3 == 0:
            c.px(x, 15 - h, '#e6d98c')
    return c.outline('#5f8a45')


# ------------------------------------------------------------------ cercas

def cerca(tipo):
    c = C(16, 16)
    b, e, l = MAD['b'], MAD['e'], MAD['l']

    def poste(x, y0=3, y1=14):
        c.rect(x, y0, 3, y1 - y0, b).rect(x, y0, 1, y1 - y0, l).rect(x + 2, y0 + 1, 1, y1 - y0 - 1, e)
    if tipo == 'h':
        c.rect(0, 6, 16, 2, b).rect(0, 6, 16, 1, l).rect(0, 10, 16, 2, b).rect(0, 11, 16, 1, e)
        poste(6)
    elif tipo == 'v':
        c.rect(7, 0, 2, 16, b).rect(7, 0, 1, 16, l)
        poste(6, 3, 10)
        poste(6, 11, 16)
    else:  # cantos: 'no', 'ne', 'so', 'se'
        if tipo[1] == 'o':
            c.rect(8, 6, 8, 2, b).rect(8, 6, 8, 1, l).rect(8, 10, 8, 2, b).rect(8, 11, 8, 1, e)
        else:
            c.rect(0, 6, 8, 2, b).rect(0, 6, 8, 1, l).rect(0, 10, 8, 2, b).rect(0, 11, 8, 1, e)
        if tipo[0] == 'n':
            c.rect(7, 12, 2, 4, b).rect(7, 12, 1, 4, l)
        else:
            c.rect(7, 0, 2, 6, b).rect(7, 0, 1, 6, l)
        poste(6)
    return c.outline(MAD['o'])


def arame(tipo):
    c = C(16, 16)
    fio = '#8e8a8a'
    if tipo == 'h':
        c.rect(0, 6, 16, 1, fio).rect(0, 10, 16, 1, fio)
        for x in (3, 11):
            c.px(x, 6, '#c9c4c0').px(x, 10, '#c9c4c0')
        c.rect(7, 3, 2, 11, MADE['b']).rect(7, 3, 1, 11, MADE['l'])
    else:
        c.rect(7, 0, 1, 16, fio).rect(8, 0, 1, 16, '#6f6b6e')
        c.rect(7, 4, 2, 9, MADE['b']).rect(7, 4, 1, 9, MADE['l'])
    return c.outline(MADE['o'])


def porteira(aberta=False):
    c = C(32, 16)
    b, e, l = MAD['b'], MAD['e'], MAD['l']
    for x in (0, 29):
        c.rect(x, 1, 3, 14, MADE['b']).rect(x, 1, 1, 14, MADE['l'])
    if not aberta:
        for y in (4, 8, 12):
            c.rect(3, y, 26, 2, b).rect(3, y, 26, 1, l)
        c.line(4, 12, 27, 5, e)
        c.rect(15, 3, 2, 12, b).rect(15, 3, 1, 12, l)
    else:
        for y in (4, 8, 12):
            c.rect(3, y, 4, 2, b).rect(3, y, 4, 1, l)
        c.rect(6, 3, 2, 12, b).rect(6, 3, 1, 12, l)
    return c.outline(MAD['o'])


def mata_burro():
    c = tile(tex.terra(2), 2, 1)
    c.rect(2, 1, 28, 14, '#5a4046')
    c.rect(2, 1, 28, 1, OUT).rect(2, 14, 28, 1, OUT)
    for x in range(4, 29, 4):
        c.rect(x, 1, 2, 14, MAD['b']).rect(x, 1, 1, 14, MAD['l']).px(x + 1, 14, MAD['e'])
    c.rect(0, 0, 2, 16, MADE['b']).rect(30, 0, 2, 16, MADE['b']).rect(0, 0, 1, 16, MADE['l']).rect(30, 0, 1, 16, MADE['l'])
    return c


def mureta(tipo):
    c = C(16, 16)
    b, e, l = '#b5aa9d', '#93887f', '#d0c7ba'
    if tipo == 'h':
        c.rect(0, 5, 16, 9, b).rect(0, 5, 16, 3, l).rect(0, 12, 16, 2, e)
        for x, y in [(5, 8), (12, 8), (2, 11), (9, 11)]:
            c.rect(x, y, 1, 3, e)
        c.rect(0, 8, 16, 1, e).rect(0, 11, 16, 1, e)
        c.rect(0, 4, 16, 1, OUT).rect(0, 14, 16, 1, OUT)
    elif tipo == 'v':
        c.rect(4, 0, 8, 16, b).rect(4, 0, 8, 1, b).rect(5, 0, 5, 16, l).rect(10, 0, 2, 16, e)
        for y in (3, 9, 14):
            c.rect(5, y, 6, 1, e)
        c.rect(3, 0, 1, 16, OUT).rect(12, 0, 1, 16, OUT)
    else:  # pilar
        c.rect(3, 2, 10, 12, b).rect(4, 2, 8, 4, l).rect(3, 11, 10, 3, e).rect(11, 6, 2, 5, e)
        c.rect(4, 8, 8, 1, e)
        c.outline(OUT)
    return c


# ------------------------------------------------------------------ relevo

def barranco(tipo, ver=False):
    """Degrau do morro: lábio de grama em cima e face de terra embaixo."""
    f = tex.terra_vermelha(11) if ver else tex.terra(12)
    c = tile(f)
    esc = '#a65a3d' if ver else '#b8926a'
    esc2 = '#8f4a35' if ver else '#9c7858'
    for x in range(16):
        c.rect(x, 12 + int(rnd(x, 0, 3) * 2), 1, 4, esc)
        c.px(x, 15, esc2)
        if x % 5 == 2:
            c.rect(x, 6, 1, 5, esc)
    g = tex.grama(1)
    for x in range(16):
        h = 4 + int(rnd(x, 1, 8) * 3)
        for y in range(h):
            c.px(x, y, g(x, y))
        c.px(x, h, '#6da24d')
    if tipo == 'L':
        c.rect(0, 0, 1, 16, esc2)
        c.clear(0, 13, 1, 3).clear(1, 15, 1, 1)
    if tipo == 'R':
        c.rect(15, 0, 1, 16, esc2)
        c.clear(15, 13, 1, 3).clear(14, 15, 1, 1)
    if tipo == 'escada':
        c = tile(f)
        for k, y in enumerate(range(0, 16, 4)):
            c.rect(1, y, 14, 3, MAD['b']).rect(1, y, 14, 1, MAD['l']).rect(1, y + 3, 14, 1, MAD['o'])
        c.rect(0, 0, 1, 16, esc2).rect(15, 0, 1, 16, esc2)
    return c


# ------------------------------------------------------------------ montagem

def montar():
    s = Sheet('tiles_exterior', 16)

    s.section('Chão (camada `chao`, opacos)', 'Variações do mesmo terreno podem ser misturadas à vontade.')
    for i in (1, 21, 31):
        s.add(f'grama_{[1, 21, 31].index(i) + 1}', tile(tex.grama(i)), 'Grama (3 variações).')
    s.add('grama_flores_1', flores('#f6f0e0', '#f2a7c0', 3), 'Grama com flores brancas e rosa.')
    s.add('grama_flores_2', flores('#ffd23f', '#e8884a', 4), 'Grama com flores amarelas e laranja.')
    s.add('terra_1', tile(tex.terra(2)), 'Terra clara: ruas da vila, estrada.')
    s.add('terra_2', tile(tex.terra(22)), 'Terra clara (variação).')
    s.add('terra_vermelha_1', tile(tex.terra_vermelha(3)), 'Terra vermelha do cafezal.')
    s.add('terra_vermelha_2', tile(tex.terra_vermelha(23)), 'Terra vermelha (variação).')
    s.add('calcamento_1', tile(tex.calcamento(6)), 'Calçamento de pedra: praça do chafariz.')
    s.add('calcamento_2', tile(tex.calcamento(16)), 'Calçamento (variação).')
    s.add('terreiro_1', tile(tex.terreiro(7)), 'Terreiro de secar café (grãos espalhados).')
    s.add('terreiro_2', tile(tex.terra_batida(4)), 'Terra batida do terreiro, sem grãos.')
    s.add('folhas_1', tile(tex.folhas(5)), 'Chão de folhas secas do bambuzal.')
    s.add('folhas_2', tile(tex.folhas(15)), 'Chão de folhas (variação).')

    nota = ('Blocos 3×3: cantos, lados e centro de uma mancha do terreno, com o lado de fora transparente — '
            'pinte por cima de qualquer chão (camada `chao2`). Bloco 2×2 `_int`: cantos internos (para curvas em L); '
            'cada tile é o terreno inteiro com um cantinho transparente voltado para o centro do bloco.')
    s.section('Transições de terreno (camada `chao2`)', nota)
    for nome, f, borda, seed in [('terra', tex.terra(2), '#b8926a', 1), ('terra_vermelha', tex.terra_vermelha(3), '#a65a3d', 2),
                                 ('calcamento', tex.calcamento(6), '#8f837c', 3), ('grama', tex.grama(1), '#6da24d', 4),
                                 ('terreiro', tex.terreiro(7), '#9c7858', 5)]:
        b, i = transicao(f, borda, seed)
        s.add(f'borda_{nome}', b, f'Mancha de {nome.replace("_", " ")} com borda irregular.')
        s.add(f'borda_{nome}_int', i, f'Cantos internos de {nome.replace("_", " ")}.')

    s.section('Relevo: morro em degraus', 'Use uma fileira de `barranco` entre dois níveis de grama; a escada é o único ponto de passagem.')
    for ver in (False, True):
        suf = '_vermelho' if ver else ''
        s.add(f'barranco{suf}_L', barranco('L', ver), 'Ponta esquerda do degrau.', col=True)
        s.add(f'barranco{suf}_M', barranco('M', ver), 'Meio do degrau (repete).', col=True)
        s.add(f'barranco{suf}_R', barranco('R', ver), 'Ponta direita do degrau.', col=True)
        s.add(f'barranco{suf}_escada', barranco('escada', ver), 'Escada de tábuas no degrau (passável).')

    s.section('Vegetação')
    m3 = dict(col=['..', '..', 'xx'], acima=['xx', 'xx', '..'])
    s.add('arvore_1', arvore(0, 0), 'Árvore. A copa (2 linhas de cima) vai na camada `acima`; o tronco é sólido.', **m3)
    s.add('arvore_2', arvore(5, 1), 'Árvore (verde mais claro).', **m3)
    s.add('pe_cafe_verde', pe_cafe('verde'), 'Pé de café verde (`pe_cafe_verde_N`).', col=['.', 'x'], acima=['x', '.'])
    s.add('pe_cafe_maduro', pe_cafe('maduro'), 'Pé de café maduro, com brilho (`pe_cafe_maduro_N`).', col=['.', 'x'], acima=['x', '.'])
    s.add('pe_cafe_colhido', pe_cafe('colhido'), 'Pé de café já colhido (fileiras de fundo).', col=['.', 'x'], acima=['x', '.'])
    s.add('bambu', bambu(), 'Touceira de bambu.', col=['.', '.', 'x'], acima=['x', 'x', '.'])
    s.add('arbusto', arbusto(), 'Arbusto baixo.', hide=True)
    s.add('arbusto_frutas', arbusto('#d8413a', 3), 'Arbusto com frutinhas.', hide=True)
    s.add('toco', toco(), 'Toco de árvore (toco de leitura do Ícaro).', col=True)
    s.add('capim_1', capim(1), 'Capim alto (enfeite, passável).')
    s.add('capim_2', capim(2), 'Capim alto (variação).')
    s.add('bambu_denso', bambu_denso(), 'Parede de bambu fechada: bordas do bambuzal.', col=True)
    s.add('bambu_denso_topo', bambu_denso(True), 'Topo folhudo da parede de bambu (linha de cima).', col=True)

    s.section('Cercas, porteira e mureta')
    s.add('cerca_h', cerca('h'), 'Cerca de madeira horizontal.', col=True)
    s.add('cerca_v', cerca('v'), 'Cerca de madeira vertical.', col=True)
    for k in ('no', 'ne', 'so', 'se'):
        s.add(f'cerca_canto_{k}', cerca(k), f'Canto de cerca ({k.upper()}).', col=True)
    s.add('arame_h', arame('h'), 'Cerca de arame horizontal (estrada).', col=True)
    s.add('arame_v', arame('v'), 'Cerca de arame vertical.', col=True)
    s.add('porteira', porteira(), 'Porteira fechada.', col=True)
    s.add('porteira_aberta', porteira(True), 'Porteira aberta (passa pelo meio).', col=['x.'])
    s.add('mata_burro', mata_burro(), 'Mata-burro (chão; passável).')
    s.add('mureta_h', mureta('h'), 'Mureta de pedra horizontal.', col=True)
    s.add('mureta_v', mureta('v'), 'Mureta de pedra vertical.', col=True)
    s.add('mureta_pilar', mureta('p'), 'Pilar de mureta (cantos e pontas).', col=True)

    V = ext_vila
    s.section('Casas: telhado (modular)', 'Bloco 3×3 = cantos/lados/meio; repita a coluna e a linha do meio para casas maiores. '
              'Receita de casa: N linhas de telhado, depois 2 linhas de parede (`parede` linha de cima + linha de baixo). '
              'Tudo sólido. Para o jogador passar "por trás" do telhado, ponha a 1ª linha do telhado numa camada `acima`.')
    s.add('telhado', V.telhado(), 'Telhado de telha de barro.', col=True)
    s.add('telhado_palha', V.telhado(palha=True), 'Telhado de palha/sapé (barracão, casas simples).', col=True)
    s.add('telhado_queimado', V.telhado(True), 'Telhado queimando: carvão, buracos e brasas (vila à noite).', col=True)
    s.add('chamine', V.chamine(), 'Chaminé de tijolo; coloque sobre o telhado (camada de objetos acima da do telhado).', col=['.', 'x'])
    s.add('fumaca_chamine', V.chamine(True), 'Fumaça branca de chaminé (manhã): acima da chaminé, camada `acima`.', acima=True)

    s.section('Casas: paredes, portas, janelas e placas', 'Bloco 3×2 de parede: linha de cima (sob o beiral) e de baixo (rodapé de pedra); colunas esquerda/meio/direita. '
              'Janelas e placas substituem um tile do MEIO da linha de cima. Portas (1×2) substituem uma coluna inteira do meio.')
    s.add('parede', V.parede(), 'Parede caiada de pau a pique.', col=True)
    s.add('parede_queimada', V.parede(True), 'Parede com fuligem e rachaduras.', col=True)
    s.add('parede_madeira', V.parede(madeira=True), 'Parede de tábuas (barracão, galpões).', col=True)
    s.add('porta', V.porta(), 'Porta fechada. Sólida; a `saida` fica no tile em frente.', col=True)
    s.add('porta_aberta', V.porta(True), 'Porta aberta (manhã: casas visitáveis). Ponha a `saida` sobre o tile de baixo.', col=['x', '.'])
    s.add('porta_queimada', V.porta(queimada=True), 'Porta chamuscada (noite).', col=True)
    s.add('porta_queimada_aberta', V.porta(True, True), 'Porta arrombada (noite).', col=['x', '.'])
    s.add('janela', V.janela(), 'Janela de vidro.', col=True)
    s.add('janela_flores', V.janela('flores'), 'Janela com floreira.', col=True)
    s.add('janela_aberta', V.janela('aberta'), 'Janela aberta com cortina.', col=True)
    s.add('janela_fogo', V.janela('fogo'), 'Janela com fogo dentro (noite).', col=True)
    s.add('placa_padaria', V.placa('padaria'), 'Placa da padaria (pão).', col=True)
    s.add('placa_venda', V.placa('venda'), 'Placa da venda (saca).', col=True)
    s.add('placa_biblioteca', V.placa('biblioteca'), 'Placa da biblioteca (livro).', col=True)
    s.add('portao_barracao', V.portao_barracao(), 'Portão aberto do barracão da Zefa (2×2, sobre `parede_madeira`).', col=True)
    s.add('toldo', V.toldo(), 'Toldo listrado (padaria/venda): sobre a linha de cima da parede, camada `acima` ou objetos.')

    s.section('Ruínas e marcas de fogo (vila à noite)', 'O fogo animado está em `tiles_fogo`. `chao_queimado` e `cinzas` são transparentes: camada `chao2`.')
    s.add('ruina_parede', V.ruina_parede(), 'Resto de parede baixa (L, M, R). Casa de Ícaro em ruína: contorne o piso com estes.', col=True)
    s.add('viga_caida', V.viga_caida(), 'Viga caída em brasa (a viga do pai: `marcador_casa_viga`).', col=True)
    s.add('viga_caida_fria', V.viga_caida(False), 'Viga caída sem brasa.', col=True)
    s.add('telhado_caido', V.telhado_caido(), 'Pedaço de telhado desabado.', col=True)
    s.add('entulho_1', V.entulho(1), 'Entulho.', col=True)
    s.add('entulho_2', V.entulho(2), 'Entulho (variação).', col=True)
    s.add('chao_queimado_1', V.queimado_chao(1), 'Mancha de chão queimado.')
    s.add('chao_queimado_2', V.queimado_chao(2), 'Mancha de chão queimado (variação).')
    s.add('cinzas_1', V.cinzas(1), 'Cinzas espalhadas.')
    s.add('cinzas_2', V.cinzas(2), 'Cinzas (variação).')

    s.section('Objetos da vila', 'Objetos sólidos servem de esconderijo com um objeto `esconderijo` (retângulo) ao lado/atrás; os marcados `hide` escondem quem pisa neles.')
    s.add('chafariz', V.chafariz(), 'Chafariz de pedra da praça.', col=True)
    s.add('portao_vila', V.portao_vila(), 'Portão da vila: passa-se pelo meio.', col=['...', 'x.x', 'x.x'], acima=['xxx', '...', '...'])
    s.add('carroca', V.carroca(), 'Carroça vazia.', col=['...', 'xxx'], acima=['xxx', '...'])
    s.add('carroca_sacas', V.carroca('sacas'), 'Carroça carregada de sacas (manhã).', col=['...', 'xxx'], acima=['xxx', '...'])
    s.add('carroca_feno', V.carroca('feno'), 'Carroça com feno.', col=['...', 'xxx'], acima=['xxx', '...'])
    s.add('carroca_queimada', V.carroca(queimada=True), 'Carroça chamuscada (noite; esconderijo 1).', col=['...', 'xxx'], acima=['xxx', '...'])
    s.add('sacas', V.sacas(), 'Pilha de sacas de café.', col=['..', 'xx'], acima=['xx', '..'])
    s.add('varal', V.varal(), 'Varal com roupa (manhã).', col=['x.x', 'x.x'])
    s.add('balanca', V.balanca(), 'Balança de pesagem da Zefa.', col=['..', 'xx'], acima=['xx', '..'])
    s.add('lampiao', V.lampiao(), 'Lampião de ferro apagado (dia).', col=['.', 'x'], acima=['x', '.'])
    s.add('lampiao_aceso', V.lampiao(aceso=True), 'Lampião aceso (entardecer/noite).', col=['.', 'x'], acima=['x', '.'])
    s.add('lampiao_derretido', V.lampiao(True), 'Lampião derretido pelo fogo negro.', col=['.', 'x'], acima=['x', '.'])
    s.add('bandeira_cali', V.bandeira(), 'Bandeira Caligosuin fincada.', col=['.', 'x'], acima=['x', '.'])
    s.add('bandeira_cali_chamuscada', V.bandeira(True), 'Bandeira Caligosuin chamuscada.', col=['.', 'x'], acima=['x', '.'])
    s.add('barril_grande', V.barril(True), 'Barril grande de melado (o `barril_custodia` fechado).', col=['.', 'x'], acima=['x', '.'])
    s.add('barril', V.barril(), 'Barril.', col=True)
    s.add('barril_aberto', V.barril(aberto=True), 'Barril sem tampa.', col=True)
    s.add('saca', V.sacas(False), 'Saca de café solta.', col=True)
    s.add('cesto', V.cesto(), 'Cesto de colheita vazio.', col=True)
    s.add('cesto_cheio', V.cesto(True), 'Cesto cheio de café (`cesto_icaro`).', col=True)
    s.add('caixote', V.caixote(), 'Caixote.', col=True)
    s.add('lenha', V.lenha(), 'Pilha de lenha.', col=True)
    s.add('placa_poste', V.placa_poste(), 'Placa de madeira em poste.', col=True)
    s.add('alcapao', V.alcapao(), 'Alçapão da adega fechado (`marcador_terreiro_alcapao`).')
    s.add('alcapao_aberto', V.alcapao(True), 'Alçapão aberto.')
    s.add('galinha_1', V.galinha_parada(0), 'Galinha ciscando (enfeite; há também o sprite `galinha`).')
    s.add('galinha_2', V.galinha_parada(1), 'Galinha virada para o outro lado.')
    s.add('canteiro', V.canteiro(), 'Canteiro de horta.', col=True)
    s.add('banco', V.banco(), 'Banco de madeira.', col=True)

    s.section('Acampamento do bambuzal')
    s.add('fogueira_coberta', V.fogueira(), 'Fogueira coberta com pano (acesa).', col=True)
    s.add('fogueira_apagada', V.fogueira(False), 'Fogueira coberta apagada.', col=True)
    s.add('trouxa', V.trouxa(0), 'Trouxa de roupa.', col=True)
    s.add('cobertor', V.trouxa(1), 'Cobertor enrolado.')
    return s


if __name__ == '__main__':
    s = montar()
    s.export(('tarde', 'noite'))
    print(s.nome, 'ok', len(s.itens))
