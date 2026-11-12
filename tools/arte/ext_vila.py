"""Casas modulares e objetos da vila/cafezal/bambuzal para `tiles_exterior`."""
from px import C, T, col, mix, mul, rnd, OUT, OUT2
import tex
from tex import tile

MAD = dict(b='#b98a5c', e='#9c7048', l='#cfa273', o='#6b4a35')
MADE = dict(b='#8a5f41', e='#6f4a33', l='#a37652', o='#4a3129')
CAL = dict(b='#f4ead8', e='#e2d5bd', s='#cdbea5', r='#b98a5e')   # parede caiada
PED = dict(b='#b5aa9d', e='#93887f', l='#d0c7ba')
CINZA = dict(b='#6b5a5e', e='#4f4148', l='#85737a')              # madeira/parede queimada
VINHO = '#5b1f3a'


# ------------------------------------------------------------------ telhado

def telha(queimado=False, palha=False):
    if queimado:
        b, e, l = col('#5e4a4d'), col('#453639'), col('#77626a')
    elif palha:
        b, e, l = col('#d9b96a'), col('#b8944e'), col('#ecd58c')
    else:
        b, e, l = col('#cf7350'), col('#a9553a'), col('#e59468')

    def f(x, y):
        fy = y // 4
        ly = y % 4
        lx = (x + (fy % 2) * 2) % 4
        if ly == 3:
            return e
        if lx == 3:
            return e if ly > 0 else b
        if ly == 0 and lx < 2:
            return l
        if queimado and rnd(x, y, 77) < 0.035:
            return col(['#ff7a2f', '#ffb347', '#e8452c'][(x + y) % 3])
        return b
    return f


def telhado(queimado=False, palha=False, w=3, h=3):
    c = tile(telha(queimado, palha), w, h)
    W, H = w * 16, h * 16
    cume = '#77626a' if queimado else ('#f3e2a6' if palha else '#eea77b')
    beira = '#3a2d32' if queimado else ('#9a7a40' if palha else '#8f4632')
    c.rect(0, 0, W, 3, cume).rect(0, 3, W, 1, beira)
    c.rect(0, H - 3, W, 2, beira)
    c.rect(0, 0, 2, H, beira).rect(W - 2, 0, 2, H, beira)
    c.rect(0, 0, W, 1, OUT).rect(0, H - 1, W, 1, OUT).rect(0, 0, 1, H, OUT).rect(W - 1, 0, 1, H, OUT)
    if queimado:  # buracos e brasas
        for (hx, hy, r) in [(12, 14, 5), (33, 26, 6), (24, 9, 3), (8, 36, 4), (40, 40, 3)]:
            for y in range(H):
                for x in range(W):
                    d = ((x - hx) ** 2 + (y - hy) ** 2) ** 0.5 + rnd(x, y, 5) * 1.6
                    if d < r:
                        c.p[x, y] = col('#2b1f2a')
                    elif d < r + 1.2:
                        c.p[x, y] = col(['#ff7a2f', '#ffb347', '#e8452c', '#453639'][(x * 3 + y) % 4])
    return c


def chamine(fumaca=False):
    c = C(16, 32)
    if fumaca:
        for cx, cy, r in [(8, 26, 3), (10, 20, 4), (7, 13, 4.5), (10, 6, 4)]:
            c.ell(cx, cy, r, r * 0.9, '#f4efe6d0')
            c.ell(cx - 1, cy - 1, r * 0.5, r * 0.4, '#ffffffd0')
        return c
    c.rect(4, 14, 8, 14, '#c0694a').rect(4, 14, 2, 14, '#d98a66').rect(10, 15, 2, 13, '#9c4f38')
    for y in range(17, 28, 4):
        c.rect(4, y, 8, 1, '#9c4f38')
    c.rect(3, 12, 10, 3, '#a89c90').rect(3, 12, 10, 1, '#d0c7ba')
    c.rect(5, 13, 6, 1, '#4a3440')
    return c.outline(OUT)


# ------------------------------------------------------------------ paredes

def parede(queimada=False, madeira=False):
    """Bloco 3×2: linha de cima (sob o beiral) e linha de baixo (rodapé); colunas L, M, R."""
    c = C(48, 32)
    if madeira:
        f = tex.tabuas(31, MAD['b'], MAD['e'], MAD['l'], vert=True)
        for y in range(32):
            for x in range(48):
                c.p[x, y] = col(f(x, y))
        c.rect(0, 0, 48, 3, MAD['e']).rect(0, 29, 48, 3, MADE['b']).rect(0, 29, 48, 1, MADE['l'])
        poste = MADE
    else:
        for y in range(32):
            for x in range(48):
                r = rnd(x, y, 12)
                v = CAL['b'] if r > 0.10 else CAL['e']
                if queimada:
                    t = min(1, max(0, 1.15 - y / 26 + (rnd(x // 2, y // 3, 4) - 0.5) * 0.7))
                    v = mix(v, '#4f4148', t * 0.9)
                c.p[x, y] = col(v)
        # reboco caído mostrando o pau a pique
        for (px_, py_, w_, h_) in [(20, 16, 5, 4), (37, 8, 4, 3)]:
            for y in range(py_, py_ + h_):
                for x in range(px_, px_ + w_):
                    if rnd(x, y, 3) < 0.8:
                        c.p[x, y] = col(CAL['r'] if (x + y) % 3 else '#a07449')
        c.rect(0, 0, 48, 3, '#7a6a68' if queimada else CAL['s'])
        c.rect(0, 28, 48, 4, PED['b']).rect(0, 28, 48, 1, PED['l']).rect(0, 31, 48, 1, PED['e'])
        for x in range(5, 48, 9):
            c.rect(x, 29, 1, 3, PED['e'])
        poste = CINZA if queimada else MADE
    for x0 in (0, 45):
        c.rect(x0, 0, 3, 32, poste['b']).rect(x0, 0, 1, 32, poste['l']).rect(x0 + 2, 0, 1, 32, poste['e'])
    c.rect(0, 0, 1, 32, OUT).rect(47, 0, 1, 32, OUT).rect(0, 31, 48, 1, OUT)
    if queimada:
        for (x, y) in [(10, 20), (30, 12), (41, 22), (16, 6)]:
            c.line(x, y, x + 2, y + 4, '#3a2d32').line(x + 2, y + 4, x + 1, y + 7, '#3a2d32')
    return c


def _fundo_parede(queimada=False, linha=0):
    return parede(queimada).crop(16, linha * 16, 16, 16)


def janela(tipo='fechada'):
    c = _fundo_parede(tipo == 'fogo')
    m = CINZA if tipo == 'fogo' else MADE
    c.rect(2, 3, 12, 11, m['b']).rect(2, 3, 12, 1, m['l'])
    vidro = {'fechada': '#6b8fb0', 'flores': '#6b8fb0', 'aberta': '#4a3440', 'fogo': '#ff7a2f'}[tipo]
    c.rect(4, 5, 8, 7, vidro)
    if tipo in ('fechada', 'flores'):
        c.rect(4, 5, 8, 1, '#8fb0cc').px(5, 6, '#cfe0ee').px(6, 7, '#cfe0ee')
        c.rect(7, 5, 2, 7, m['b']).rect(4, 8, 8, 1, m['b'])
    elif tipo == 'aberta':
        c.rect(4, 5, 8, 2, '#f2a7c0').rect(4, 7, 2, 5, '#f2a7c0').rect(10, 7, 2, 5, '#f2a7c0')
        c.px(5, 8, '#fbe3ec').px(10, 8, '#fbe3ec')
    else:
        c.rect(5, 7, 6, 5, '#ffb347').rect(6, 9, 4, 3, '#ffe27a').px(5, 5, '#e8452c').px(9, 5, '#e8452c')
    c.rect(1, 13, 14, 2, m['l']).rect(1, 14, 14, 1, m['e'])
    if tipo == 'flores':
        c.rect(2, 12, 12, 3, '#a85236')
        for x, cc in [(3, '#f2a7c0'), (6, '#ffd23f'), (9, '#f6f0e0'), (12, '#f2a7c0')]:
            c.px(x, 11, cc).px(x, 12, '#5fa052')
    for (x, y, w, h) in [(1, 2, 14, 1), (1, 15, 14, 1)]:
        c.rect(x, y, w, h, OUT)
    c.rect(1, 3, 1, 12, OUT).rect(14, 3, 1, 12, OUT)
    return c


def porta(aberta=False, queimada=False):
    c = C(16, 32)
    c.blit(_fundo_parede(queimada, 0), 0, 0).blit(_fundo_parede(queimada, 1), 0, 16)
    m = CINZA if queimada else MADE
    c.rect(1, 5, 14, 27, OUT)
    c.rect(2, 6, 12, 26, m['b']).rect(2, 6, 12, 1, m['l'])
    if aberta:
        c.rect(3, 8, 10, 24, '#4a3440')
        c.rect(3, 26, 10, 6, '#6b4a45').rect(4, 29, 8, 3, '#8a6a55')
        c.rect(3, 8, 2, 24, m['e'])
    else:
        c.rect(3, 8, 10, 24, MAD['b'] if not queimada else '#5e4a4d')
        for x in (6, 9):
            c.rect(x, 8, 1, 24, MAD['e'] if not queimada else '#453639')
        c.rect(3, 8, 10, 1, MAD['l'] if not queimada else '#77626a')
        c.rect(3, 13, 10, 1, m['e']).rect(3, 26, 10, 1, m['e'])
        c.px(11, 20, '#ffd23f').px(11, 21, '#c99a2e')
    return c


def placa(tipo):
    """Placa pendurada na parede (substitui um tile do meio da linha de cima)."""
    c = _fundo_parede()
    c.rect(3, 2, 1, 3, '#6f6b6e').rect(12, 2, 1, 3, '#6f6b6e')
    c.rect(1, 4, 14, 10, OUT).rect(2, 5, 12, 8, MAD['l']).rect(2, 12, 12, 1, MAD['b'])
    if tipo == 'padaria':    # pão
        c.ell(8, 9, 4.5, 2.6, '#d9a05b').rect(5, 7, 6, 1, '#f0c98a')
        for x in (6, 8, 10):
            c.px(x, 8, '#a8703a').px(x, 9, '#a8703a')
    elif tipo == 'venda':    # saca com um grão
        c.rect(5, 7, 6, 5, '#d9c9a3').rect(6, 6, 4, 1, '#b8a67c').px(7, 9, '#7a3b2a').px(8, 9, '#7a3b2a').px(8, 10, '#7a3b2a')
    else:                    # livro aberto
        c.rect(4, 7, 4, 5, '#f6f0e0').rect(8, 7, 4, 5, '#f6f0e0').rect(8, 7, 1, 5, '#5b7fa6')
        c.rect(4, 12, 8, 1, '#5b7fa6').px(5, 9, '#b8a67c').px(6, 9, '#b8a67c').px(10, 9, '#b8a67c').px(10, 10, '#b8a67c')
    return c


def toldo():
    c = C(48, 16)
    for x in range(48):
        cc = '#f6f0e0' if (x // 4) % 2 else '#e8884a'
        c.rect(x, 2, 1, 9, cc)
        c.px(x, 2, mix(cc, '#ffffff', 0.4))
        c.px(x, 11 + (1 if (x % 8) in (2, 3, 4, 5) else 0), cc)
        c.px(x, 10, mul(cc, 0.85))
    return c.outline(OUT)


def portao_barracao():
    c = C(32, 32)
    c.blit(parede(madeira=True).crop(16, 0, 16, 32), 0, 0).blit(parede(madeira=True).crop(16, 0, 16, 32), 16, 0)
    c.rect(2, 4, 28, 28, OUT).rect(3, 5, 26, 27, '#4a3440')
    c.rect(3, 5, 26, 2, MADE['b'])
    c.rect(5, 22, 8, 8, '#d9c9a3').rect(5, 22, 8, 1, '#efe3c4').rect(14, 25, 7, 6, '#c7b58c')   # sacas lá dentro
    c.rect(3, 30, 26, 2, '#6b4a45')
    return c


# ------------------------------------------------------------------ ruínas

def ruina_parede():
    c = C(48, 16)
    src = parede(True)
    for x in range(48):
        h = 5 + int(rnd(x // 3, 0, 9) * 7)
        for y in range(16 - h, 16):
            c.p[x, y] = src.p[x, 16 + y]
        c.px(x, 16 - h, '#3a2d32')
    for x, y in [(6, 9), (20, 11), (35, 8), (42, 12)]:
        c.px(x, y, '#ff7a2f').px(x + 1, y, '#ffb347')
    return c


def entulho(seed):
    c = C(16, 16)
    c.sombra_chao(8, 13, 7, 2)
    for k in range(7):
        x = 2 + int(rnd(k, 1, seed) * 10)
        y = 6 + int(rnd(k, 2, seed) * 6)
        w = 2 + int(rnd(k, 3, seed) * 4)
        cc = [CINZA['b'], '#93887f', CINZA['e'], '#a9553a', '#cdbea5'][k % 5]
        c.rect(x, y, w, 2 + k % 2, cc).rect(x, y, w, 1, mix(cc, '#ffffff', 0.25))
    c.outline('#3a2d32')
    for k in range(2):
        c.px(4 + int(rnd(k, 5, seed) * 8), 9 + k * 2, '#ff7a2f')
    return c


def viga_caida(brasa=True):
    c = C(48, 16)
    for x in range(2, 46):
        y0 = 5 + (x - 2) // 14
        c.rect(x, y0, 1, 5, CINZA['b'])
        c.px(x, y0, CINZA['l']).px(x, y0 + 4, CINZA['e'])
        if brasa and rnd(x, 0, 6) < 0.35:
            c.px(x, y0 + 1 + int(rnd(x, 1, 6) * 3), ['#ff7a2f', '#ffb347', '#e8452c'][x % 3])
    c.sombra_chao(24, 13, 22, 2)
    return c.outline('#3a2d32')


def telhado_caido():
    c = C(32, 32)
    t = telhado(True, w=2, h=2)
    for y in range(32):
        for x in range(32):
            d = abs(x - 16) / 15 + abs(y - 17) / 13 + (rnd(x // 2, y // 2, 8) - 0.5) * 0.4
            if d < 1.0:
                c.p[x, y] = t.p[x, y] if (t.p[x, y] != OUT) else col('#453639')
    c.outline('#3a2d32')
    return c


def queimado_chao(seed):
    c = C(16, 16)
    for y in range(16):
        for x in range(16):
            d = ((x - 7.5) / 7.5) ** 2 + ((y - 7.5) / 6.5) ** 2 + (rnd(x, y, seed) - 0.5) * 0.7
            if d < 0.55:
                c.px(x, y, '#3a2d3290')
            elif d < 0.95:
                c.px(x, y, '#3a2d3248')
    return c


def cinzas(seed):
    c = C(16, 16)
    for k in range(9):
        x, y = int(rnd(k, 1, seed) * 16), int(rnd(k, 2, seed) * 16)
        c.px(x, y, ['#cfc6ba', '#93887f', '#f4efe6'][k % 3])
    return c


# ------------------------------------------------------------------ objetos

def chafariz():
    c = C(48, 48)
    c.sombra_chao(24, 42, 22, 4)
    c.ell(24, 28, 22, 15, PED['e'])
    c.ell(24, 26, 22, 15, PED['b'])
    c.ell(24, 25, 20, 13, PED['l'])
    c.ell(24, 26, 18, 11, '#6fb0c8')
    c.ell(24, 25, 17, 10, '#8fcbe0')
    for (x, y) in [(13, 24), (33, 22), (20, 31), (30, 30), (16, 20)]:
        c.rect(x, y, 3, 1, '#d6eef6')
    # coluna central
    c.rect(21, 12, 6, 14, PED['b']).rect(21, 12, 2, 14, PED['l']).rect(25, 13, 2, 13, PED['e'])
    c.ell(24, 11, 7, 3, PED['b']).ell(24, 10, 6, 2, PED['l']).ell(24, 10, 4, 1.2, '#8fcbe0')
    c.rect(23, 5, 2, 5, '#d6eef6').px(22, 7, '#d6eef6').px(25, 8, '#d6eef6')
    for x in (17, 30):
        c.line(x, 13, x + (-2 if x < 24 else 2), 21, '#d6eef6')
    for y in range(48):
        for x in range(48):
            if c.get(x, y) == col(PED['b']) and y > 28 and x % 7 == 3:
                c.p[x, y] = col(PED['e'])
    return c.outline(OUT)


def roda(c, cx, cy, r=5):
    c.ell(cx, cy, r, r, MADE['e'])
    c.ell(cx, cy, r - 1.4, r - 1.4, MAD['l'])
    c.line(cx - r + 1, cy - 0.5, cx + r - 2, cy - 0.5, MADE['b']).line(cx - 0.5, cy - r + 1, cx - 0.5, cy + r - 2, MADE['b'])
    c.px(cx - 0.5, cy - 0.5, '#6f6b6e')


def carroca(carga=None, queimada=False):
    c = C(48, 32)
    m = CINZA if queimada else MAD
    c.sombra_chao(22, 29, 20, 2)
    c.rect(4, 12, 34, 10, m['b']).rect(4, 12, 34, 1, m['l']).rect(4, 21, 34, 1, m['e'])
    for x in range(9, 38, 6):
        c.rect(x, 13, 1, 8, m['e'])
    c.rect(3, 9, 2, 13, MADE['b']).rect(37, 9, 2, 13, MADE['b'])
    c.rect(38, 18, 9, 2, MADE['b']).rect(38, 18, 9, 1, MADE['l'])   # varal de puxar
    if carga == 'sacas':
        for (x, y) in [(7, 5), (17, 4), (27, 6), (12, 1), (22, 0)]:
            c.rect(x, y + 2, 9, 6, '#d9c9a3').rect(x + 1, y + 1, 7, 1, '#d9c9a3').rect(x, y + 2, 9, 1, '#efe3c4').rect(x, y + 7, 9, 1, '#b8a67c')
            c.px(x + 4, y + 4, '#7a3b2a').px(x + 5, y + 5, '#7a3b2a')
    elif carga == 'feno':
        c.ell(21, 9, 16, 6, '#e3c66a').ell(18, 7, 9, 3, '#f2dc8c')
        for k in range(10):
            c.px(7 + k * 3, 9 + k % 3, '#b8944e')
    roda(c, 11, 24, 6)
    roda(c, 31, 24, 6)
    c.outline(OUT if not queimada else '#3a2d32')
    if queimada:
        for (x, y) in [(8, 14), (20, 17), (30, 13)]:
            c.px(x, y, '#ff7a2f').px(x + 1, y, '#ffb347')
    return c


def barril(grande=False, aberto=False):
    h = 32 if grande else 16
    c = C(16, h)
    y0 = 6 if grande else 2
    hh = h - y0 - 2
    c.sombra_chao(8, h - 2, 6, 2)
    c.rect(3, y0, 10, hh, MAD['b'])
    c.rect(2, y0 + 2, 12, hh - 4, MAD['b'])
    c.rect(3, y0, 2, hh, MAD['l']).rect(11, y0 + 1, 2, hh - 2, MAD['e'])
    for x in (6, 9):
        c.rect(x, y0 + 1, 1, hh - 1, MAD['e'])
    for y in ((y0 + 3, y0 + hh - 4) if not grande else (y0 + 4, y0 + hh // 2, y0 + hh - 5)):
        c.rect(2, y, 12, 2, '#7d7780').rect(2, y, 12, 1, '#a39ca3')
    c.ell(8, y0 + 0.5, 5, 1.6, '#4a3440' if aberto else MAD['l'])
    if not aberto:
        c.ell(8, y0 + 0.5, 3, 0.8, MAD['b'])
    return c.outline(MAD['o'])


def saca(x, y, c, tom=0):
    b, l, e = [('#d9c9a3', '#efe3c4', '#b8a67c'), ('#cdbb92', '#e3d5b0', '#a9966d')][tom]
    c.rect(x, y + 1, 12, 7, b).rect(x + 1, y, 10, 9, b)
    c.rect(x + 1, y, 10, 1, l).rect(x + 1, y + 8, 10, 1, e).rect(x + 11, y + 2, 1, 5, e)
    c.px(x + 5, y + 3, '#7a3b2a').px(x + 6, y + 4, '#7a3b2a').px(x + 5, y + 5, '#7a3b2a')
    c.px(x, y + 1, l)


def sacas(pilha=True):
    if not pilha:
        c = C(16, 16)
        c.sombra_chao(8, 13, 7, 2)
        saca(2, 5, c)
        return c.outline(OUT2)
    c = C(32, 32)
    c.sombra_chao(16, 29, 14, 2)
    saca(2, 20, c)
    saca(16, 20, c, 1)
    saca(9, 12, c, 1)
    saca(1, 12, c)
    saca(18, 12, c)
    saca(9, 4, c)
    return c.outline(OUT2)


def cesto(cheio=False):
    c = C(16, 16)
    c.sombra_chao(8, 13, 6, 2)
    c.rect(3, 6, 10, 7, '#c9a05a').rect(4, 13, 8, 1, '#a8823f')
    for y in range(6, 13, 2):
        for x in range(3, 13):
            c.px(x, y + (x % 2), '#a8823f')
    c.ell(8, 6, 5.5, 2.2, '#8a6a35')
    c.ell(8, 6, 4.5, 1.5, '#5e4526')
    if cheio:
        c.ell(8, 5.5, 4.5, 2, '#b8322e')
        for (x, y) in [(5, 5), (8, 4), (10, 6), (7, 6)]:
            c.px(x, y, '#e2564a')
        c.px(9, 5, '#7a1f24')
    return c.outline(OUT2)


def balanca():
    c = C(32, 32)
    c.sombra_chao(16, 29, 13, 2)
    c.rect(3, 4, 3, 25, MADE['b']).rect(3, 4, 1, 25, MADE['l'])
    c.rect(26, 4, 3, 25, MADE['b']).rect(26, 4, 1, 25, MADE['l'])
    c.rect(2, 3, 28, 3, MADE['b']).rect(2, 3, 28, 1, MADE['l'])
    c.rect(1, 28, 7, 2, MADE['e']).rect(24, 28, 7, 2, MADE['e'])
    c.rect(15, 6, 2, 5, '#6f6b6e')
    c.ell(16, 12, 3, 3, '#f6f0e0').px(16, 11, '#a52a33').px(16, 12, '#a52a33').px(17, 10, '#a52a33')   # mostrador
    c.rect(15, 15, 2, 3, '#6f6b6e')
    c.line(15, 17, 9, 23, '#8e8a8a').line(16, 17, 22, 23, '#8e8a8a')
    c.rect(8, 23, 16, 2, '#a39ca3').rect(9, 25, 14, 1, '#7d7780')
    return c.outline(OUT)


def lampiao(derretido=False, aceso=False):
    c = C(16, 32)
    f, fl = '#4f4a55', '#7d7780'
    c.sombra_chao(8, 29, 4, 1.5)
    if not derretido:
        c.rect(7, 10, 2, 19, f).rect(7, 10, 1, 19, fl).rect(5, 28, 6, 2, f).rect(5, 28, 6, 1, fl)
        c.rect(4, 3, 8, 8, f)
        c.rect(5, 4, 6, 6, '#ffe27a' if aceso else '#cfe0ee')
        c.rect(7, 5, 2, 4, '#fff3c4' if aceso else '#f6f0e0')
        c.rect(3, 2, 10, 1, f).rect(5, 1, 6, 1, f).rect(7, 0, 2, 1, fl).rect(4, 10, 8, 1, fl)
    else:
        c.rect(7, 16, 2, 13, f).rect(7, 16, 1, 13, fl).rect(4, 27, 8, 3, f).rect(4, 27, 8, 1, fl)
        c.line(8, 16, 11, 12, f).line(9, 16, 12, 12, f)
        c.rect(10, 9, 5, 5, f).rect(11, 10, 3, 3, '#7b3fa0').px(12, 11, '#b06fd8')
        c.px(12, 14, f).px(12, 15, f).px(13, 14, f).px(5, 26, f).px(3, 28, f).px(12, 28, f)
        c.px(9, 20, '#7b3fa0').px(7, 23, '#1a1423')
    return c.outline(OUT)


def bandeira(chamuscada=False):
    c = C(16, 32)
    c.sombra_chao(4, 29, 3, 1.5)
    c.rect(3, 1, 2, 29, MADE['e']).rect(3, 1, 1, 29, MADE['b']).rect(2, 0, 4, 2, '#4f4a55')
    for y in range(3, 18):
        w = 10 if not chamuscada else 10 - (2 if y % 5 == 0 else 0) - (y > 12) * (y - 12)
        ond = 1 if (y // 3) % 2 else 0
        c.rect(5, y, max(0, w) + ond, 1, VINHO)
        c.px(5, y, '#7a2e4d')
        if chamuscada and w > 0:
            c.px(5 + w + ond - 1, y, '#1a1423')
    # emblema: focinho e duas presas
    c.rect(8, 7, 4, 3, '#b58a95').px(9, 8, VINHO).px(10, 8, VINHO)
    c.px(7, 10, '#f2e9d8').px(7, 11, '#f2e9d8').px(12, 10, '#f2e9d8').px(12, 11, '#f2e9d8')
    if chamuscada:
        c.px(13, 5, '#7b3fa0').px(11, 15, '#7b3fa0')
    return c.outline(OUT)


def varal():
    c = C(48, 32)
    for x in (2, 44):
        c.rect(x, 4, 2, 26, MADE['b']).rect(x, 4, 1, 26, MADE['l'])
    c.sombra_chao(3, 30, 3, 1).sombra_chao(45, 30, 3, 1)
    for x in range(4, 44):
        c.px(x, 6 + int(2.5 * (1 - ((x - 24) / 20) ** 2)), '#8e8a8a')
    pecas = [(7, 8, 7, 9, '#f6f0e0', '#ddd0b8'), (16, 9, 6, 7, '#5b7fa6', '#486a8f'), (24, 9, 8, 10, '#f2a7c0', '#d98aa8'), (34, 8, 6, 6, '#ffd23f', '#d9ad2e')]
    for (x, y, w, h, b, e) in pecas:
        c.rect(x, y, w, h, b).rect(x + w - 1, y, 1, h, e).rect(x, y + h - 1, w, 1, e)
        c.px(x, y - 1, MAD['b']).px(x + w - 1, y - 1, MAD['b'])
    c.rect(18, 16, 2, 4, '#5b7fa6')   # perna de calça
    return c.outline(OUT2)


def canteiro():
    c = C(32, 16)
    c.rect(1, 3, 30, 11, '#8a5f41').rect(2, 4, 28, 9, '#6f4a33')
    for x in range(4, 29, 5):
        c.rect(x, 5, 3, 3, '#5fa052').px(x + 1, 4, '#82c065').px(x, 9, '#5fa052').px(x + 2, 10, '#5fa052')
        c.px(x + 1, 6, ['#e8884a', '#d8413a', '#f6f0e0'][(x // 5) % 3])
    return c.outline(MADE['o'])


def lenha():
    c = C(16, 16)
    c.sombra_chao(8, 13, 7, 2)
    for (x, y) in [(2, 9), (7, 9), (4, 5), (9, 5), (6, 1)]:
        c.ell(x + 2.5, y + 2.5, 2.5, 2.5, MADE['b']).ell(x + 2.5, y + 2.5, 1.5, 1.5, '#d9b98a').px(x + 2, y + 2, '#a98458')
    return c.outline(MADE['o'])


def caixote():
    c = C(16, 16)
    c.sombra_chao(8, 14, 7, 1.5)
    c.rect(2, 3, 12, 11, MAD['b']).rect(2, 3, 12, 2, MAD['l']).rect(2, 3, 2, 11, MAD['l']).rect(12, 5, 2, 9, MAD['e'])
    c.line(4, 6, 11, 12, MAD['e']).rect(2, 8, 12, 1, MAD['e'])
    return c.outline(MAD['o'])


def banco():
    c = C(32, 16)
    c.sombra_chao(16, 13, 13, 2)
    c.rect(2, 5, 28, 4, MAD['b']).rect(2, 5, 28, 1, MAD['l']).rect(2, 8, 28, 1, MAD['e'])
    c.rect(4, 9, 2, 4, MADE['b']).rect(26, 9, 2, 4, MADE['b'])
    return c.outline(MAD['o'])


def placa_poste():
    c = C(16, 16)
    c.sombra_chao(8, 14, 4, 1.5)
    c.rect(7, 8, 2, 6, MADE['b'])
    c.rect(2, 2, 12, 7, MAD['l']).rect(2, 8, 12, 1, MAD['b'])
    c.rect(4, 4, 8, 1, MADE['b']).rect(4, 6, 6, 1, MADE['b'])
    return c.outline(MAD['o'])


def alcapao(aberto=False):
    c = C(16, 16)
    c.rect(1, 2, 14, 13, MADE['o'])
    if aberto:
        c.rect(2, 3, 12, 11, '#2b1f2a')
        for y in (5, 8, 11):
            c.rect(4, y, 8, 1, MADE['b'])
        c.rect(4, 3, 1, 11, MADE['e']).rect(11, 3, 1, 11, MADE['e'])
    else:
        c.rect(2, 3, 12, 11, MADE['b'])
        for x in (5, 8, 11):
            c.rect(x, 3, 1, 11, MADE['e'])
        c.rect(2, 3, 12, 1, MADE['l']).rect(2, 6, 12, 1, '#6f6b6e').rect(2, 11, 12, 1, '#6f6b6e')
        c.rect(7, 12, 3, 1, '#c9c4c0')
    return c


def fogueira(acesa=True):
    c = C(16, 16)
    c.sombra_chao(8, 13, 7, 2)
    for (x, y) in [(2, 10), (5, 12), (10, 12), (12, 10), (3, 8), (11, 8)]:
        c.rect(x, y, 3, 2, PED['b']).px(x, y, PED['l'])
    c.line(4, 11, 11, 8, MADE['b']).line(4, 8, 11, 11, MADE['e'])
    if acesa:
        c.rect(6, 6, 4, 5, '#ff7a2f').rect(7, 4, 2, 6, '#ffb347').px(7, 8, '#ffe27a').px(8, 7, '#ffe27a').px(8, 3, '#ff7a2f').px(6, 5, '#e8452c')
    # cobertura de pano para esconder a luz
    c.rect(1, 1, 14, 2, '#6b5a5e').rect(1, 1, 14, 1, '#85737a').rect(1, 3, 1, 9, MADE['e']).rect(14, 3, 1, 9, MADE['e'])
    return c.outline(OUT)


def trouxa(tipo=0):
    c = C(16, 16)
    c.sombra_chao(8, 13, 6, 2)
    if tipo == 0:
        c.ell(8, 9, 5, 4, '#c96a6a').ell(7, 8, 3, 2, '#dd8a84')
        c.px(8, 4, '#c96a6a').px(7, 3, '#dd8a84').px(9, 3, '#c96a6a').px(8, 5, '#a85252')
        for (x, y) in [(5, 9), (9, 11), (10, 8)]:
            c.px(x, y, '#f6f0e0')
    else:   # cobertor enrolado
        c.rect(2, 7, 12, 6, '#5b7fa6').rect(2, 7, 12, 1, '#7d9cbd').rect(2, 12, 12, 1, '#486a8f')
        for x in (5, 9):
            c.rect(x, 7, 1, 6, '#f3e6c8')
        c.ell(13, 10, 1.5, 3, '#486a8f')
    return c.outline(OUT2)


def portao_vila():
    c = C(48, 48)
    for x0 in (2, 36):
        c.rect(x0, 10, 10, 36, PED['b']).rect(x0, 10, 3, 36, PED['l']).rect(x0 + 8, 11, 2, 35, PED['e'])
        for y in range(15, 46, 6):
            c.rect(x0, y, 10, 1, PED['e'])
        c.rect(x0 - 1, 43, 12, 3, PED['e'])
    c.rect(0, 4, 48, 7, MADE['b']).rect(0, 4, 48, 1, MADE['l']).rect(0, 10, 48, 1, MADE['e'])
    c.rect(14, 0, 20, 5, '#cf7350').rect(14, 0, 20, 1, '#eea77b')
    c.rect(18, 11, 12, 6, MAD['l']).rect(20, 13, 8, 1, MADE['b']).rect(21, 15, 6, 1, MADE['b'])   # tabuleta
    c.sombra_chao(7, 46, 7, 1.5).sombra_chao(41, 46, 7, 1.5)
    return c.outline(OUT)


def galinha_parada(k=0):
    c = C(16, 16)
    c.sombra_chao(8, 13, 4, 1.5)
    c.ell(8, 9, 4, 3.2, '#f6f0e0').ell(5.5 if k == 0 else 10.5, 6, 2, 2, '#f6f0e0')
    hx = 4 if k == 0 else 11
    c.px(hx, 4, '#d8413a').px(hx + (1 if k == 0 else -1), 3, '#d8413a')
    c.px(hx - (1 if k == 0 else -1), 6, '#e8884a').px(hx, 6, OUT)
    c.px(7, 13, '#e8884a').px(9, 13, '#e8884a').px(11 if k == 0 else 4, 7, '#ddd0b8')
    c.rect(7, 9, 3, 1, '#ddd0b8')
    return c.outline(OUT2)
