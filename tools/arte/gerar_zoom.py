"""Objetos ampliados (96×96, fundo transparente) que aparecem no centro da tela: assets/images/zoom_*.png.

Uso: python3 tools/arte/gerar_zoom.py
"""
import math, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from PIL import Image
from px import C, RAIZ, col, mix, mul, rnd, OUT, OUT2

IMG = os.path.join(RAIZ, 'assets', 'images')
S = 96
MAD = dict(b='#b98a5c', e='#9c7048', l='#cfa273', o='#6b4a35')
MADE = dict(b='#8a5f41', e='#6f4a33', l='#a37652', o='#4a3129')

# letras 3×5 (só as que os objetos usam)
_G = """A .x. x.x xxx x.x x.x|B xx. x.x xx. x.x xx.|C xxx x.. x.. x.. xxx|D xx. x.x x.x x.x xx.|E xxx x.. xx. x.. xxx|F xxx x.. xx. x.. x..
G xxx x.. x.x x.x xxx|H x.x x.x xxx x.x x.x|I xxx .x. .x. .x. xxx|J ..x ..x ..x x.x xxx|L x.. x.. x.. x.. xxx|M x.x xxx xxx x.x x.x
N xx. x.x x.x x.x x.x|O xxx x.x x.x x.x xxx|P xxx x.x xxx x.. x..|Q xxx x.x x.x xxx ..x|R xx. x.x xx. x.x x.x|S xxx x.. xxx ..x xxx
T xxx .x. .x. .x. .x.|U x.x x.x x.x x.x xxx|V x.x x.x x.x x.x .x.|Z xxx ..x .x. x.. xxx|0 xxx x.x x.x x.x xxx|4 x.x x.x xxx ..x ..x
5 xxx x.. xxx ..x xxx|6 xxx x.. xxx x.x xxx|. ... ... ... ... .x.|, ... ... ... .x. x.."""
FONTE = {}
for _l in _G.replace('\n', '|').split('|'):
    _p = _l.split()
    FONTE[_p[0]] = _p[1:]


def texto(c, x, y, t, cor, k=1, torto=False):
    i = -1
    for ch in t:
        if ch == "'":                      # acento na letra anterior
            c.rect(x - 4 * k + k, y - 2 * k, k, k, cor)
            continue
        i += 1
        g = FONTE.get(ch)
        if g:
            dy = (i % 2) if torto else 0
            for j, l in enumerate(g):
                for ii, p in enumerate(l):
                    if p == 'x':
                        c.rect(x + ii * k, y + (j + dy) * k, k, k, cor)
        x += 4 * k
    return c


def base():
    return C(S, S)


def fim(c, cor=OUT, sombra=True):
    c.outline(cor)
    if sombra:
        c.sombra_chao(48, 88, 34, 4, '#3b2a3540')
    return c


def tinge(c, f, seed, cores):
    """Textura: troca pixels da cor `f` por variações."""
    f = col(f)
    cs = [col(x) for x in cores]
    for y in range(c.h):
        for x in range(c.w):
            if c.p[x, y] == f:
                r = rnd(x, y, seed)
                if r < 0.12:
                    c.p[x, y] = cs[0]
                elif r > 0.9:
                    c.p[x, y] = cs[1]
    return c


def pano(c, x, y, w, h, b, e, l, xadrez=None):
    c.rect(x, y, w, h, b)
    for i in range(x, x + w):
        c.px(i, y + h - 1 + (1 if (i // 5) % 2 else 0), b)
    c.rect(x, y, w, 2, l).rect(x, y + h - 2, w, 2, e)
    if xadrez:
        for j in range(y + 3, y + h - 2, 7):
            c.rect(x, j, w, 2, xadrez)
        for i in range(x + 4, x + w, 7):
            c.rect(i, y, 2, h, xadrez)


def broa():
    c = base()
    c.rect(6, 62, 84, 20, '#4f4a55').rect(6, 62, 84, 3, '#7d7780').rect(6, 78, 84, 4, '#3a3540')        # chapa do fogão
    for x in (22, 48, 74):
        c.ell(x, 70, 8, 3, '#3a3540')
    pano(c, 14, 50, 68, 20, '#f6f0e0', '#ddd0b8', '#ffffff', '#c96a6a')
    c.ell(46, 40, 30, 20, '#d9a05b')
    c.rect(16, 40, 60, 14, '#d9a05b')
    c.ell(40, 32, 20, 9, '#f0c98a')
    c.rect(64, 22, 14, 34, (0, 0, 0, 0)) if False else None
    for y in range(18, 60):                                   # meia broa: corte reto à direita, miolo claro
        for x in range(60, 80):
            if c.get(x, y)[:3] in (col('#d9a05b')[:3], col('#f0c98a')[:3]):
                c.p[x, y] = col('#f6e3b0') if x < 70 + int(2 * math.sin(y / 3)) else (0, 0, 0, 0)
    for k in range(40):
        x, y = 60 + int(rnd(k, 1, 3) * 9), 26 + int(rnd(k, 2, 3) * 26)
        if c.get(x, y)[:3] == col('#f6e3b0')[:3]:
            c.px(x, y, '#e0c080')
    for (x, y) in [(28, 30), (38, 26), (48, 29), (33, 38), (52, 36)]:
        c.line(x, y, x + 6, y + 3, '#a8703a')
    tinge(c, '#d9a05b', 5, ['#c98f4c', '#e3b574'])
    c.px(50, 12, '#f4efe6').px(51, 9, '#f4efe6').px(49, 6, '#f4efe6').px(38, 14, '#f4efe6').px(37, 11, '#f4efe6')   # vaporzinho
    return fim(c, OUT, False)


def flor(c, cx, cy, r, cor, miolo):
    for k in range(5):
        a = -math.pi / 2 + k * 2 * math.pi / 5
        c.ell(cx + r * math.cos(a), cy + r * math.sin(a), r * 0.62, r * 0.62, cor)
    c.ell(cx, cy, r * 0.45, r * 0.45, miolo)


def caixa(aberta=False):
    c = base()
    b, e, l = '#a3553a', '#8f4a35', '#c8774f'
    if not aberta:
        c.rect(14, 34, 68, 44, b).rect(14, 34, 68, 16, l).rect(14, 50, 68, 2, e).rect(74, 52, 8, 26, e)
        c.rect(14, 34, 68, 2, '#dd9a72')
        flor(c, 48, 42, 5, '#e8b08c', '#ffe08a')                       # flor entalhada na tampa
        c.rect(44, 52, 8, 7, '#c99a2e').rect(46, 54, 4, 3, '#ffd23f')   # fecho
        for x in (26, 70):
            c.rect(x, 50, 3, 3, '#c99a2e')
        tinge(c, b, 3, [e, l])
        return fim(c)
    c.rect(12, 8, 72, 36, e).rect(16, 12, 64, 28, '#7a3b2a')            # tampa aberta, por dentro
    flor(c, 48, 26, 7, '#8f4a35', '#a3553a')
    c.rect(12, 44, 72, 38, b).rect(12, 44, 72, 3, l).rect(76, 47, 8, 35, e)
    c.rect(18, 48, 56, 22, '#4a3129')                                   # o fundo da caixa
    for (x, cor) in [(22, '#5b7fa6'), (34, '#c8372d'), (46, '#f6f0e0')]:   # carretéis
        c.rect(x, 52, 9, 12, cor).rect(x - 1, 50, 11, 3, MAD['l']).rect(x - 1, 63, 11, 3, MAD['b'])
        for y in range(54, 63, 2):
            c.rect(x, y, 9, 1, mul(cor, 0.82))
    c.rect(59, 54, 8, 9, '#a9b2bf').rect(59, 54, 8, 2, '#cfd6df').rect(64, 58, 3, 3, '#7d8794')   # dedal amassado
    for k in range(6):
        c.px(60 + (k * 3) % 6, 57 + k % 4, '#7d8794')
    for a in range(200, 345, 12):                                        # o colar, pendurado na borda
        c.px(48 + 20 * math.cos(math.radians(a)), 86 + 22 * math.sin(math.radians(a)), '#8a6a55')
    c.ell(48, 66, 3.5, 3.5, '#c9a3a8').px(47, 65, '#e6ccd0')
    tinge(c, b, 3, [e, l])
    return fim(c)


def colar(brilho=False):
    c = base()
    if brilho:
        for r, a in [(40, 26), (30, 44), (20, 70), (12, 110)]:
            c.ell(48, 66, r, r, col('#ffb347', a))
    pts = []
    for a in range(-170, -9, 4):
        pts.append((48 + 30 * math.cos(math.radians(a)), 40 + 30 * math.sin(math.radians(a)) * 0.9))
    for t in range(0, 26):
        pts.append((18 + t * 1.15, 40 + t * 0.9))
        pts.append((78 - t * 1.15, 40 + t * 0.9))
    k = base()
    for i, (x, y) in enumerate(pts):
        k.ell(x, y, 1.4, 1.4, '#8a6a55' if i % 3 else '#a8846a')
    k.ell(48, 68, 9, 10, '#c9a3a8' if not brilho else '#ffd98a')
    k.ell(45, 64, 4, 4, '#e6ccd0' if not brilho else '#fff3c4').ell(51, 72, 3, 3, '#a8848a' if not brilho else '#ffb347')
    k.rect(46, 56, 4, 4, '#8a6a55')
    k.outline(OUT if not brilho else '#b8733a')
    c.blit(k)
    if brilho:
        for (x, y) in [(30, 58), (66, 60), (48, 86), (38, 78), (60, 82), (48, 50)]:
            c.px(x, y, '#fff3c4').px(x - 1, y, '#ffe27a').px(x + 1, y, '#ffe27a').px(x, y - 1, '#ffe27a').px(x, y + 1, '#ffe27a')
    return c


def livro():
    c = base()
    c.rect(18, 12, 60, 72, '#a52a33').rect(18, 12, 8, 72, '#7a1f24').rect(18, 12, 60, 3, '#c8545a')
    c.rect(78, 15, 4, 68, '#f6f0e0').rect(22, 84, 58, 3, '#ddd0b8')
    for y in range(18, 82, 4):
        c.px(79, y, '#ddd0b8')
    c.rect(32, 22, 38, 2, '#ffe08a').rect(32, 26, 30, 2, '#ffe08a')        # título dourado
    c.ell(51, 44, 8, 8, '#ffe08a').ell(51, 44, 5, 5, '#a52a33')
    for k in range(8):                                                     # raios de um solzinho
        a = k * math.pi / 4
        c.px(51 + 11 * math.cos(a), 44 + 11 * math.sin(a), '#ffe08a')
    k = base()                                                             # carimbo vermelho, meio torto
    k.rect(27, 60, 46, 15, '#f6f0e0').rect(28, 61, 44, 13, '#d8413a').rect(30, 63, 40, 9, '#f6f0e0')
    texto(k, 33, 65, 'RESERVADO', '#d8413a')
    c.blit(C(im=k.im.rotate(7, resample=Image.NEAREST, center=(50, 67))))
    tinge(c, '#a52a33', 7, ['#96252d', '#b23540'])
    return fim(c)


def retrato(noite=False):
    """O retrato que Ícaro vê: carvão em papel amarelado. Tadeo sério de chapéu na mão, Aurora rindo de olhos
    fechados com o bebê berrando no colo."""
    c = base()
    m = dict(b='#6b5a5e', e='#4f4148', l='#85737a') if noite else MADE
    c.rect(10, 6, 76, 84, m['b']).rect(10, 6, 76, 4, m['l']).rect(80, 10, 6, 80, m['e']).rect(10, 86, 76, 4, m['e'])
    papel, papel_e = '#ecdcae', '#d9c690'
    c.rect(17, 13, 62, 70, papel)
    for y in range(13, 83):
        for x in range(17, 79):
            if rnd(x, y, 9) < 0.08:
                c.p[x, y] = col(papel_e)
    cv, cm, cl = '#4a4248', '#7a7078', '#b0a6a0'                          # três tons de carvão
    # Tadeo, à esquerda: sério, chapéu na mão
    c.rect(24, 50, 20, 30, cm).rect(24, 50, 20, 2, cv).rect(24, 50, 2, 30, cv).rect(42, 50, 2, 30, cv)
    c.rect(31, 46, 6, 5, cl)
    c.ell(34, 36, 9, 10, cl)
    c.ell(34, 28, 9, 4, cv).rect(25, 28, 18, 3, cv)                         # cabelo curto
    c.rect(29, 35, 3, 2, cv).rect(36, 35, 3, 2, cv).rect(28, 32, 5, 1, cv).rect(35, 32, 5, 1, cv)
    c.rect(33, 37, 2, 3, cm).rect(30, 42, 8, 1, cv)                         # boca reta
    c.ell(34, 70, 9, 3, cv).ell(34, 67, 5, 4, cv).rect(27, 69, 14, 1, cl)   # chapéu na mão
    # Aurora, à direita: rindo de olhos fechados, cabelo claro preso
    c.rect(52, 50, 22, 30, cl).rect(52, 50, 22, 2, cv).rect(52, 50, 2, 30, cv).rect(72, 50, 2, 30, cv)
    c.rect(60, 46, 6, 5, cl)
    c.ell(63, 36, 9, 10, papel)
    for a in range(0, 360, 6):
        c.px(63 + 9.5 * math.cos(math.radians(a)), 36 + 10.5 * math.sin(math.radians(a)), cv)
    c.ell(63, 28, 10, 4, cl).ell(70, 24, 4, 4, cl)                          # coque claro
    for a in range(0, 360, 20):
        c.px(70 + 4.5 * math.cos(math.radians(a)), 24 + 4.5 * math.sin(math.radians(a)), cm)
    for x in (57, 65):                                                      # olhos fechados de riso
        c.px(x, 35, cv).px(x + 1, 34, cv).px(x + 2, 34, cv).px(x + 3, 35, cv)
    c.ell(63, 42, 4, 2.5, cv).rect(60, 40, 7, 1, papel)                     # boca aberta rindo
    # o bebê no colo dela, berrando
    c.ell(60, 64, 8, 7, papel)
    for a in range(0, 360, 8):
        c.px(60 + 8.5 * math.cos(math.radians(a)), 64 + 7.5 * math.sin(math.radians(a)), cv)
    c.ell(60, 67, 3.5, 3, cv).px(56, 61, cv).px(57, 60, cv).px(62, 60, cv).px(63, 61, cv)
    c.rect(52, 70, 18, 10, papel).rect(52, 70, 18, 1, cv).rect(52, 70, 1, 10, cv).rect(69, 70, 1, 10, cv)   # manta
    for x in range(55, 68, 4):
        c.rect(x, 73, 1, 6, cl)
    c.px(49, 58, cv).px(47, 56, cv).px(71, 57, cv).px(73, 55, cv)           # tracinhos do berro
    if noite:
        for y in range(6, 90):
            for x in range(10, 86):
                d = min(x - 10, 85 - x, y - 6, 89 - y)
                if d < 9 and rnd(x, y, 12) < (0.9 - d * 0.09):
                    c.p[x, y] = col(mix(c.p[x, y], '#2b1f2a', 0.75))
        for (x, y) in [(14, 84), (20, 87), (82, 12), (78, 8), (84, 60)]:
            c.px(x, y, '#ff7a2f').px(x + 1, y, '#ffb347')
        c.line(30, 13, 38, 30, '#4f4148').line(38, 30, 34, 44, '#4f4148')    # vidro trincado
    c.px(48, 4, '#6f6b6e').px(48, 3, '#6f6b6e')
    return fim(c)


def moeda(c, x, y, r=5):
    c.ell(x, y, r, r * 0.8, '#b8733a').ell(x - 0.5, y - 0.5, r - 1.5, (r - 1.5) * 0.8, '#d9965a').px(x - 2, y - 2, '#f0c090')


def pote():
    c = base()
    b, e, l = '#b8644a', '#8f4a35', '#d58a62'
    c.ell(48, 56, 30, 28, b)
    c.rect(34, 18, 28, 14, b).ell(48, 18, 16, 5, e).ell(48, 18, 12, 3, '#4a3129')
    c.ell(36, 46, 8, 14, l)
    for y in range(30, 84):
        for x in range(60, 80):
            if c.get(x, y)[:3] == col(b)[:3] and ((x - 48) / 30) ** 2 + ((y - 56) / 28) ** 2 > 0.72:
                c.p[x, y] = col(e)
    c.rect(26, 48, 44, 13, '#f3e6c8').rect(26, 48, 44, 1, '#ffffff').rect(26, 60, 44, 1, '#ddd0b8')   # etiqueta
    texto(c, 34, 52, 'TELHADO', '#6b4226')
    moeda(c, 43, 17, 4)
    moeda(c, 52, 16, 4)
    moeda(c, 16, 84, 6)
    moeda(c, 27, 87, 5)
    c.ell(80, 85, 5, 4, '#5b7fa6').px(78, 84, '#f6f0e0').px(81, 84, '#f6f0e0').px(78, 86, '#f6f0e0').px(81, 86, '#f6f0e0')   # um botão
    tinge(c, b, 4, [e, l])
    return fim(c, OUT, False)


def enxada():
    """Close do cabo gasto: um "T" grande e um "A" menor riscados a canivete dentro de um coração torto."""
    c = base()
    k = base()
    k.rect(0, 26, 96, 44, MAD['b']).rect(0, 26, 96, 8, MAD['l']).rect(0, 60, 96, 10, MAD['e'])
    for y in range(36, 60, 5):                               # veios da madeira lixada
        for x in range(0, 96, 13):
            k.rect(x + (y * 3) % 9, y, 7, 1, MAD['e'])
    for y in range(30, 66):                                  # a parte que nunca foi lixada: áspera
        for x in range(26, 72):
            if ((x - 49) / 23) ** 2 + ((y - 48) / 18) ** 2 < 1 and rnd(x, y, 4) < 0.3:
                k.p[x, y] = col(MADE['b'] if rnd(x, y, 5) < 0.5 else MADE['l'])
    cor = MADE['o']
    pts = []
    for t in range(0, 360, 3):                               # coração torto
        a = math.radians(t)
        hx = 16 * math.sin(a) ** 3
        hy = -(13 * math.cos(a) - 5 * math.cos(2 * a) - 2 * math.cos(3 * a) - math.cos(4 * a))
        pts.append((49 + hx * 1.25 + hy * 0.18, 47 + hy * 1.05))
    for (x, y) in pts:
        k.rect(x, y, 2, 2, cor)
    k.rect(36, 38, 12, 3, cor).rect(40, 38, 4, 16, cor)      # T grande
    for (x, y, w, h) in [(53, 45, 2, 10), (59, 45, 2, 10), (54, 43, 6, 2), (53, 49, 8, 2)]:   # A menor
        k.rect(x, y, w, h, cor)
    k.px(35, 37, MAD['l']).px(52, 42, MAD['l'])
    c.blit(k)
    c.rect(0, 25, 96, 1, OUT).rect(0, 70, 96, 1, OUT)
    return c


def ficha():
    c = base()
    k = base()
    k.rect(14, 22, 68, 52, '#efe0a8').rect(14, 22, 68, 2, '#f8eec4').rect(14, 72, 68, 2, '#cdbb7c')
    for y in range(22, 74):
        for x in range(14, 82):
            if rnd(x, y, 6) < 0.06:
                k.p[x, y] = col('#e0cf90')
    k.rect(14, 32, 68, 1, '#c96a6a')
    for y in range(40, 70, 7):
        k.rect(18, y, 60, 1, '#8fb0cc')
    texto(k, 20, 25, 'AURORA', '#3b4a7a')
    for (y, w) in [(36, 30), (43, 44), (50, 26), (57, 38)]:           # empréstimos anotados à mão
        for x in range(20, 20 + w, 2):
            k.px(x, y + (x % 3 == 0), '#5a5058')
    k.rect(58, 54, 16, 9, '#d8413a').rect(60, 56, 12, 5, '#efe0a8').rect(62, 58, 8, 1, '#d8413a')   # carimbo
    k.ell(76, 28, 4, 4, '#e0cf90')                                      # mancha de café
    k.outline(OUT2)
    c.blit(C(im=k.im.rotate(-6, resample=Image.NEAREST, center=(48, 48))))
    return c.sombra_chao(48, 84, 34, 4, '#3b2a3540')


def cavalinho():
    c = base()
    b, l, e = '#e3c66a', '#f2dc8c', '#c9a84e'
    c.rect(22, 44, 46, 20, b).rect(22, 44, 46, 4, l).rect(22, 60, 46, 4, e)     # corpo de sabugo
    for y in range(48, 62, 4):
        for x in range(24, 68, 5):
            c.rect(x + (y // 4) % 2 * 2, y, 3, 2, e)
    c.rect(60, 20, 14, 28, b).rect(60, 20, 4, 28, l).rect(66, 22, 14, 10, b).rect(66, 22, 14, 3, l)   # pescoço e cabeça
    c.rect(72, 25, 2, 2, OUT).rect(78, 28, 2, 2, e)
    for (x, y) in [(60, 14), (64, 12), (68, 15), (58, 22), (56, 28), (57, 34)]:  # crina e orelhas de palha
        c.rect(x, y, 3, 7, '#8cc063').px(x, y, '#aad67c')
    for x in (26, 34, 54, 62):                                                    # pernas de graveto
        c.rect(x, 64, 3, 18, MADE['b']).rect(x, 64, 1, 18, MADE['l'])
    for (x, y) in [(18, 44), (14, 48), (16, 54), (12, 58)]:                       # rabo de palha
        c.rect(x, y, 5, 3, '#8cc063')
    texto(c, 40, 50, 'I', MADE['o'], 2, False)                                    # o "I" torto
    c.px(47, 49, MADE['o']).px(39, 60, MADE['o'])
    return fim(c)


def rapadura():
    c = base()
    pano(c, 10, 52, 76, 30, '#f3e6c8', '#ddd0b8', '#ffffff')
    b, e, l = '#a0622e', '#7d4a22', '#c98a4c'
    k = base()
    k.rect(22, 30, 52, 34, b).rect(22, 30, 52, 5, l).rect(66, 35, 8, 29, e).rect(22, 60, 52, 4, e)
    for y in range(30, 64):                                   # amassada: cantos comidos e uma mossa
        for x in range(22, 74):
            if (x - 22) + (y - 30) < 7 or (73 - x) + (63 - y) < 9 or ((x - 60) ** 2 + (y - 30) ** 2) < 30:
                k.clear(x, y)
    for (x, y) in [(34, 44), (46, 50), (40, 56)]:
        k.line(x, y, x + 8, y + 3, e)
    tinge(k, b, 8, [e, l])
    k.outline(OUT)
    c.blit(C(im=k.im.rotate(-10, resample=Image.NEAREST, center=(48, 48))))
    for (x, y) in [(20, 72), (30, 76), (72, 70), (66, 76)]:   # farelos
        c.rect(x, y, 2, 2, b)
    return fim(c, OUT2, False)


def ovos():
    c = base()
    c.ell(48, 66, 38, 18, '#c9a05a').ell(48, 62, 30, 12, '#8a6a35')
    for k in range(60):
        x, y = 12 + int(rnd(k, 1, 2) * 72), 54 + int(rnd(k, 2, 2) * 28)
        if c.get(x, y)[3]:
            c.line(x, y, x + 4, y + (k % 3) - 1, '#e3c66a' if k % 2 else '#a8823f')
    for (x, y, cor, s) in [(34, 50, '#f6f0e0', '#ddd0b8'), (62, 52, '#f3e6c8', '#d9c9a3'), (48, 42, '#fff8ea', '#e6dcc4')]:
        k = base()
        k.ell(x, y, 11, 14, cor).ell(x + 3, y + 5, 6, 7, s).ell(x - 3, y - 5, 4, 5, '#ffffff')
        k.outline(OUT2)
        c.blit(k)
    return fim(c, OUT2, False)


def pao():
    c = base()
    pano(c, 8, 56, 80, 26, '#f6f0e0', '#ddd0b8', '#ffffff', '#5b7fa6')
    k = base()
    k.ell(48, 48, 36, 18, '#c98f4c').ell(44, 42, 26, 9, '#e3b574')
    for x in range(22, 76, 12):
        k.line(x, 38, x + 7, 52, '#8f5f2e')
        k.line(x + 1, 38, x + 8, 52, '#f0c98a')
    for y in range(30, 68):
        for x in range(12, 86):
            if k.get(x, y)[:3] == col('#c98f4c')[:3] and y > 56:
                k.p[x, y] = col('#a8703a')
    tinge(k, '#c98f4c', 5, ['#b87f40', '#d9a05b'])
    k.outline(OUT)
    c.blit(k)
    return fim(c, OUT2, False)


def papel(c, x, y, w, h, cor='#f6f0e0', e='#ddd0b8', seed=3):
    c.rect(x, y, w, h, cor)
    for j in range(y, y + h):
        for i in range(x, x + w):
            if rnd(i, j, seed) < 0.06:
                c.p[i, j] = col(e)
    c.rect(x, y + h - 1, w, 1, e)


def desenho_nina():
    c = base()
    k = base()
    papel(k, 12, 10, 72, 76)
    k.ell(72, 22, 7, 7, '#ffd23f')                                        # sol sorrindo
    for a in range(0, 360, 45):
        k.line(72 + 9 * math.cos(math.radians(a)), 22 + 9 * math.sin(math.radians(a)), 72 + 12 * math.cos(math.radians(a)), 22 + 12 * math.sin(math.radians(a)), '#e8884a')
    k.px(69, 20, '#6b4226').px(74, 20, '#6b4226').rect(69, 24, 6, 1, '#6b4226').px(68, 23, '#6b4226').px(75, 23, '#6b4226')
    for t in range(14):                                                    # chapéu pontudo
        k.rect(40 - t // 2, 18 + t, 1 + t, 1, '#5b7fa6')
    k.rect(30, 32, 22, 2, '#5b7fa6')
    k.ell(41, 40, 6, 6, '#f4cda5').px(39, 39, '#3b2a35').px(43, 39, '#3b2a35').rect(39, 42, 5, 1, '#d8413a')
    k.rect(36, 34, 10, 2, '#e8c55a')                                       # cabelo amarelo
    k.rect(40, 46, 2, 16, '#5b7fa6').line(40, 62, 34, 72, '#6b4226').line(41, 62, 47, 72, '#6b4226')   # corpo de palito
    k.line(40, 50, 28, 46, '#6b4226').line(41, 50, 54, 44, '#6b4226')
    for (x, y, dx, dy) in [(56, 42, 8, -6), (57, 45, 10, 0), (56, 48, 8, 6), (26, 44, -8, -5), (25, 47, -9, 2)]:   # raios
        k.line(x, y, x + dx, y + dy, '#ffd23f').line(x, y + 1, x + dx, y + dy + 1, '#ffb347')
    for x in range(14, 82, 3):
        k.rect(x, 74 - (x % 2), 2, 3, '#8cc063')
    texto(k, 26, 79, 'ICARO MAGO', '#d8413a', 1, True)
    k.px(47, 8, '#d8413a')
    k.outline(OUT2)
    c.blit(k)
    c.rect(46, 8, 4, 4, '#8e99a8').px(47, 9, '#c9ced6')                    # preguinho
    return c


def receita():
    c = base()
    c.rect(10, 6, 76, 84, MADE['b']).rect(10, 6, 76, 4, MADE['l']).rect(80, 10, 6, 80, MADE['e'])
    papel(c, 17, 13, 62, 70, '#ecdcae', '#d9c690')
    texto(c, 20, 17, 'BROA DA', '#6b4226')
    texto(c, 20, 25, "VO' NENA", '#6b4226')
    c.rect(20, 32, 40, 1, '#a8703a')
    for i, (y, w) in enumerate([(37, 42), (43, 36), (49, 46), (55, 30), (61, 40), (67, 34), (73, 44)]):
        c.rect(20, y, 2, 2, '#6b4226')
        for x in range(25, 25 + w, 2):
            c.px(x, y + (x % 3 == 0), '#5a5058')
    for (cx, cy, r) in [(62, 58, 13), (52, 70, 9), (70, 44, 7)]:           # manchas de gordura borrando metade
        for y in range(int(cy - r), int(cy + r + 1)):
            for x in range(int(cx - r), int(cx + r + 1)):
                if (x - cx) ** 2 + (y - cy) ** 2 < (r + rnd(x, y, 2) * 2 - 1) ** 2 and 17 <= x < 79 and 13 <= y < 83:
                    c.p[x, y] = col(mix(c.p[x, y], '#d9b060', 0.8))
    return fim(c)


def retrato_ze():
    c = base()
    c.rect(12, 6, 72, 72, MADE['b']).rect(12, 6, 72, 4, MADE['l']).rect(78, 10, 6, 68, MADE['e'])
    c.rect(19, 13, 58, 58, '#e6dcc4')
    c.ell(48, 80, 26, 24, '#6b4226')
    c.rect(19, 71, 58, 7, MADE['b']).rect(19, 71, 58, 1, MADE['e'])
    c.rect(43, 50, 10, 8, '#d9a983')
    c.ell(48, 38, 15, 17, '#f4cda5')
    c.ell(48, 24, 15, 6, '#8e8a8a').rect(33, 26, 4, 10, '#8e8a8a').rect(59, 26, 4, 10, '#8e8a8a')
    c.rect(41, 35, 3, 4, '#3b2a35').rect(52, 35, 3, 4, '#3b2a35').rect(39, 31, 7, 2, '#6b6468').rect(50, 31, 7, 2, '#6b6468')
    c.rect(46, 39, 4, 5, '#dba983')
    c.ell(39, 47, 10, 4, '#4a3129').ell(57, 47, 10, 4, '#4a3129').ell(29, 44, 3, 3, '#4a3129').ell(67, 44, 3, 3, '#4a3129')   # o bigode enorme
    c.rect(43, 45, 10, 3, '#6f4a33')
    for t in range(18):                                                    # fita preta no canto
        c.rect(12 + t, 22 - t, 3, 3, '#2b1f2a')
    c.outline(OUT)
    papel(c, 14, 81, 68, 11, '#ecdcae', '#d9c690')
    texto(c, 17, 84, "ZE', QUE DESCANSE", '#4a3129')
    return c.outline(OUT2)


def croche():
    c = base()
    k = base()
    cores = ['#b9a3e3', '#f4a6c6', '#fbe3ec', '#b9a3e3', '#f6d97a']
    for y in range(26, 76):
        for x in range(12, 84):
            fx, fy = (x - 12) // 6, (y - 26) // 6
            lx, ly = (x - 12) % 6, (y - 26) % 6
            cor = cores[(fx + fy) % 5]
            k.p[x, y] = col(mul(cor, 0.84) if lx == 5 or ly == 5 else mix(cor, '#ffffff', 0.3) if (lx, ly) == (1, 1) else cor)
    for x in range(12, 84, 4):                                             # barrado de biquinhos
        k.ell(x + 2, 77, 2, 2, '#f6f0e0').ell(x + 2, 25, 2, 2, '#f6f0e0')
    for cx in (34, 62):                                                    # os dois buracos para as asas
        for y in range(40, 60):
            for x in range(cx - 8, cx + 8):
                d = ((x - cx) / 6) ** 2 + ((y - 50) / 8) ** 2
                if d < 1:
                    k.clear(x, y)
                elif d < 1.5:
                    k.p[x, y] = col('#8a7aa8')
    k.outline(OUT2)
    c.blit(C(im=k.im.rotate(-5, resample=Image.NEAREST, center=(48, 50))))
    c.rect(70, 74, 3, 12, '#c9c4c0').ell(60, 86, 6, 5, '#b9a3e3').ell(58, 84, 2, 2, '#d6c8f2')   # agulha e novelo
    return c.sombra_chao(48, 90, 32, 3, '#3b2a3540')


def livro_aurelius():
    c = base()
    c.rect(6, 10, 84, 78, '#6b4226').rect(6, 10, 84, 3, '#8a5f41')         # capa de couro por baixo
    papel(c, 10, 8, 76, 78, '#f3e6c8', '#e0d0a8', 5)
    c.rect(10, 8, 3, 78, '#d9c9a3')
    texto(c, 28, 16, 'VIDA E OBRA', '#3b2a35')
    texto(c, 44, 24, 'DE', '#3b2a35')
    texto(c, 20, 34, 'AURELIUS', '#7a2e3b', 2)
    texto(c, 34, 48, 'SOLIS', '#7a2e3b', 2)
    c.rect(26, 62, 44, 1, '#a8703a').ell(48, 62, 3, 3, '#a8703a').ell(48, 62, 1.5, 1.5, '#f3e6c8')
    for (y, w) in [(68, 40), (72, 30)]:
        for x in range(48 - w // 2, 48 + w // 2, 2):
            c.px(x, y, '#8e8a8a')
    lap = '#6b6468'                                                         # três espirais rabiscadas a lápis na margem
    d = 5.5
    for kk in range(3):
        ak = -math.pi / 2 + kk * 2 * math.pi / 3
        sx, sy = 72 + d * math.cos(ak), 74 + d * math.sin(ak)
        for i in range(60):
            t = i / 60
            rho = d * (1 - t) ** 0.9
            th = ak + math.pi + t * 1.5 * 2 * math.pi
            c.px(sx + rho * math.cos(th) + (rnd(i, kk, 2) - 0.5), sy + rho * math.sin(th), lap)
    c.line(60, 84, 84, 83, '#8a8088')
    return fim(c)


def ficha_icaro():
    c = base()
    k = base()
    papel(k, 26, 2, 44, 92, '#efe0a8', '#e0cf90', 6)
    k.rect(26, 12, 44, 1, '#c96a6a')
    texto(k, 30, 5, 'ICARO', '#3b4a7a')
    cores = ['#4f6b3a', '#6b4226', '#7a2e3b']                              # plantio, história, lendas
    for i, y in enumerate(range(16, 90, 5)):
        k.rect(29, y, 3, 3, cores[i % 3])
        w = 18 + int(rnd(i, 1, 7) * 16)
        for x in range(34, 34 + w, 2):
            k.px(x, y + 1 + (x % 3 == 0), '#5a5058')
        k.rect(26, y + 4, 44, 1, '#b8cfe0') if i % 2 == 0 else None
    for (y) in (24, 49, 74):
        k.rect(58, y, 9, 5, '#d8413a').rect(59, y + 1, 7, 3, '#efe0a8')
    k.outline(OUT2)
    c.blit(C(im=k.im.rotate(-4, resample=Image.NEAREST, center=(48, 48))))
    return c


def vitrine():
    c = base()
    c.rect(6, 8, 84, 80, MADE['b']).rect(6, 8, 84, 4, MADE['l']).rect(84, 12, 6, 76, MADE['e'])
    c.rect(12, 14, 72, 68, '#3a4a5a')
    c.rect(12, 46, 72, 3, MADE['e']).rect(12, 79, 72, 3, MADE['e'])
    def lv(x, y, w, h, cor):
        c.rect(x, y, w, h, cor).rect(x, y, w, 2, mix(cor, '#ffffff', 0.25)).rect(x + w - 2, y, 2, h, mul(cor, 0.75))
        c.rect(x + 2, y + 5, w - 5, 1, '#e0b83a').rect(x + 2, y + h - 6, w - 5, 1, '#e0b83a')
    lv(18, 20, 16, 26, '#7a2e3b'); lv(36, 22, 14, 24, '#4f6b3a'); lv(58, 18, 18, 28, '#6b4226')
    lv(16, 54, 18, 25, '#3f4f7a'); lv(40, 56, 14, 23, '#8a5f41'); lv(58, 52, 18, 27, '#5b1f3a')
    for (x, y, t) in [(20, 38, '450'), (60, 70, '600')]:
        c.rect(x - 2, y - 2, 16, 9, '#f6f0e0').rect(x - 2, y + 6, 16, 1, '#ddd0b8')
        texto(c, x, y, t, '#3b2a35')
        c.px(x - 3, y + 1, '#8e8a8a')
    for t in range(40):                                                    # reflexo do vidro
        for dx in (0, 1, 2, 9):
            x, y = 22 + t + dx, 56 - t
            if 12 <= x < 84 and 14 <= y < 79:
                c.p[x, y] = col(mix(c.p[x, y], '#ffffff', 0.28))
    return fim(c)


def bilhete():
    c = base()
    c.rect(0, 0, 96, 96, MAD['b'])                                          # a porta
    for x in range(0, 96, 24):
        c.rect(x, 0, 1, 96, MAD['e']).rect(x + 1, 0, 1, 96, MAD['l'])
    for k in range(40):
        c.rect(int(rnd(k, 1, 3) * 90), int(rnd(k, 2, 3) * 94), 5, 1, MAD['e'])
    k = base()
    papel(k, 4, 20, 88, 58)
    for i, l in enumerate(['FUI AJUDAR UM BEBE', 'A NASCER.', '', 'VOLTO QUANDO', 'ELE NASCER.']):
        texto(k, 10, 27 + i * 9, l, '#3b4a7a')
    k.rect(77, 22, 1, 1, '#3b4a7a')
    k.outline(OUT2)
    c.blit(k)
    c.ell(48, 22, 3, 3, '#8e99a8').px(47, 21, '#c9ced6')                    # prego
    return c


# ---- janelas do prólogo: o interior visto de fora, emoldurado pela janela ----
def janela(conteudo, parede='#d9b98a', chao='#9c7048', cortina='#c8a0b8'):
    c = base()
    c.rect(2, 2, 92, 92, MAD['b']).rect(2, 2, 92, 3, MAD['l']).rect(89, 5, 5, 89, MAD['e'])      # batente
    c.rect(9, 9, 78, 74, parede)
    for y in range(9, 60):                                                    # parede caiada, meio gasta
        for x in range(9, 87):
            if rnd(x, y, 11) < 0.05:
                c.px(x, y, mul(parede, 0.92))
    c.rect(9, 60, 78, 23, chao).rect(9, 60, 78, 1, mul(chao, 0.8))
    for y in range(64, 83, 5):
        c.rect(9, y, 78, 1, mul(chao, 0.85))
    k = base()
    conteudo(k)
    c.blit(k.outline(OUT2))
    for y in range(9, 83):                                                    # luz morna de dentro
        for x in range(9, 87):
            if (x + y) % 2 == 0 and (x < 13 or x > 82 or y < 12):
                c.p[x, y] = col(mix(c.p[x, y], '#3b2a35', 0.25))
    for t in range(60):                                                       # reflexo no vidro
        for dx in (0, 1, 7):
            x, y = 14 + t + dx, 78 - t
            if 9 <= x < 87 and 9 <= y < 83:
                c.p[x, y] = col(mix(c.p[x, y], '#ffffff', 0.18))
    c.rect(47, 9, 2, 74, MAD['o']).rect(9, 44, 78, 2, MAD['o'])               # caixilho em cruz
    for (x, d) in ((9, 1), (86, -1)):                                         # cortininhas presas
        for t in range(14):
            w = 9 - abs(t - 6) // 2 if t < 12 else 3
            c.rect(x if d > 0 else x - w + 1, 9 + t * 2, w, 2, cortina)
        c.rect(x if d > 0 else x - 2, 37, 3, 2, mul(cortina, 0.75))
    c.rect(0, 82, 96, 7, MAD['l']).rect(0, 88, 96, 3, MAD['e'])                # peitoril
    return fim(c)


def jan_laudelina():
    def f(k):
        k.rect(40, 66, 16, 2, '#6b4a35').rect(47, 52, 2, 15, '#6b4a35')          # pé do manequim
        k.ell(48, 26, 11, 8, '#e8d2b0').rect(37, 26, 22, 14, '#e8d2b0')           # busto de pano cru
        k.ell(48, 40, 11, 4, '#e8d2b0').rect(45, 16, 6, 5, '#e8d2b0').ell(48, 15, 3, 2, '#6b4a35')
        k.rect(48, 25, 11, 16, '#fbf6ec').ell(53, 50, 9, 10, '#fbf6ec').rect(48, 40, 10, 14, '#fbf6ec')   # meio vestido
        for (x, y) in [(51, 28), (55, 31), (52, 35), (56, 39), (50, 44), (54, 48), (58, 52)]:
            k.px(x, y, '#e6dcf0')                                                  # renda
        for (x, y, cor) in [(47, 29, '#d8413a'), (47, 34, '#3f6fb0'), (47, 39, '#e0b83a'), (46, 45, '#d8413a'), (47, 51, '#3f6fb0')]:
            k.px(x, y, cor).px(x + 1, y, '#8e8a8a')                                # alfinetes na costura
        k.line(43, 20, 40, 38, '#e0b83a').line(53, 20, 56, 30, '#e0b83a')         # fita métrica no pescoço
        k.rect(44, 19, 9, 1, '#e0b83a')
        for y in range(22, 38, 3):
            k.px(40 + (y - 20) // 6, y, '#6b4a35')
        k.rect(66, 62, 12, 7, '#b98a5c').rect(66, 62, 12, 1, '#cfa273').ell(72, 61, 3, 2, '#d98aa8')   # cesto de retalhos
        k.rect(17, 48, 14, 3, '#ddd0b8').rect(19, 51, 2, 10, '#6b4a35')            # mesinha com tesoura
        k.line(21, 47, 26, 45, '#8e99a8').line(21, 45, 26, 47, '#8e99a8')
    return janela(f, '#e6cfc0', '#9c7048', '#d98aa8')


def jan_orlando():
    def f(k):
        k.rect(58, 18, 18, 16, MADE['b']).rect(60, 20, 14, 12, '#f2e2b8')        # retrato da mula
        k.ell(67, 27, 4, 4, '#8a6a55').rect(64, 29, 6, 3, '#8a6a55').ell(67, 31, 3, 1.5, '#a88a72')
        k.line(64, 24, 62, 20, '#8a6a55').line(70, 24, 72, 20, '#8a6a55')         # orelhonas
        k.px(66, 26, '#3b2a35').px(68, 26, '#3b2a35').px(67, 17, '#8e8a8a')
        k.rect(12, 50, 32, 14, '#5b7fa6').rect(12, 50, 32, 2, '#7a9ac0')          # cama feita
        k.rect(12, 46, 10, 5, '#f6f0e0').rect(10, 40, 3, 26, MADE['e']).rect(43, 52, 3, 14, MADE['e'])
        for x in range(14, 44, 6):
            k.rect(x, 54, 3, 1, '#f6f0e0')
        k.rect(56, 56, 22, 3, MAD['e']).rect(58, 58, 2, 12, MAD['e']).rect(74, 58, 2, 12, MAD['e'])   # cavalete
        k.ell(67, 53, 10, 5, '#7a4a35').rect(57, 53, 20, 5, '#7a4a35').ell(64, 50, 5, 2, '#a3674a')  # sela velha
        k.rect(60, 58, 3, 6, '#5a3a2a').rect(72, 58, 3, 6, '#5a3a2a').px(66, 52, '#c9a23a')
    return janela(f, '#d9c9a0', '#8a5f41', '#a8b880')


def pijama(k, x, d, cor, cab, coque=False):
    k.ell(x, 30, 5, 6, '#e8b88a')
    if coque:
        k.ell(x, 26, 6, 4, cab).ell(x - d * 2, 23, 3, 3, cab)
    else:
        k.ell(x, 25, 6, 3, cab).rect(x - 6, 25, 3, 4, cab)
    k.px(x + d * 2, 29, '#3b2a35').rect(x + d, 33, 3, 1, '#8a4a4a')              # cara de quem tem razão
    k.rect(x - 6, 36, 12, 28, cor)
    for y in range(38, 64, 4):
        k.rect(x - 6, y, 12, 1, mix(cor, '#ffffff', 0.45))
    k.rect(x - 5, 64, 4, 3, '#e8b88a').rect(x + 1, 64, 4, 3, '#e8b88a')
    k.rect(x + d * 6 - (6 if d < 0 else 0), 40, 7, 3, cor).rect(x + d * 12 - (1 if d < 0 else 0), 40, 2, 3, '#e8b88a')  # braço apontando
    k.rect(x + d * 14 - (2 if d < 0 else 0), 41, 3, 1, '#e8b88a')


def jan_quim_quiteria():
    def f(k):
        k.rect(70, 14, 14, 50, MAD['e']).rect(72, 16, 10, 46, MAD['b']).ell(80, 40, 1, 1, '#e0b83a')   # porta
        k.px(66, 32, '#8e8a8a').line(66, 33, 64, 37, '#6b4a35').line(66, 33, 68, 37, '#6b4a35')       # prego e chave
        k.rect(64, 37, 5, 1, '#6b4a35').ell(66, 39, 2, 2, '#e0b83a').rect(66, 41, 1, 5, '#e0b83a').rect(67, 44, 2, 1, '#e0b83a')
        pijama(k, 15, 1, '#5b7fa6', '#d6d6e0')
        pijama(k, 55, -1, '#d98aa8', '#8e8a8a', coque=True)
    return janela(f, '#e0d0a8', '#9c7048', '#8fb0d0')


def jan_lindalva():
    def f(k):
        k.rect(14, 46, 62, 4, MAD['l']).rect(14, 50, 62, 2, MAD['e'])            # mesa
        k.rect(17, 52, 3, 14, MAD['e']).rect(70, 52, 3, 14, MAD['e'])
        for i, cor in enumerate(['#f6f0e0', '#e6dcc8', '#f6f0e0', '#ddd0b8']):   # panos dobrados
            k.rect(18, 42 - i * 3, 20, 3, cor).px(18, 42 - i * 3, mul(cor, 0.85))
        k.ell(52, 38, 12, 8, '#c87a48').clear(38, 28, 28, 10)                    # bacia de cobre
        k.ell(52, 38, 12, 3, '#e09a64').ell(52, 38, 10, 2, '#7a3a20').rect(43, 41, 6, 1, '#f2c088')
        k.rect(64, 39, 6, 6, '#f6f0e0').rect(70, 40, 2, 3, '#f6f0e0').rect(65, 40, 4, 1, '#b8844a')      # xícara pela metade
        k.ell(67, 45, 5, 1, '#ddd0b8')
        k.rect(14, 18, 2, 1, '#8e8a8a').line(15, 19, 13, 30, '#8a7a85')          # avental pendurado
        k.rect(10, 24, 9, 12, '#f6f0e0')
        k.rect(56, 16, 16, 10, MADE['b']).rect(58, 18, 12, 6, '#ddd0f0')         # prateleira de vidrinhos
        for x, cor in [(58, '#8fcbe0'), (62, '#a8d890'), (66, '#e0b83a')]:
            k.rect(x, 12, 3, 5, cor)
    return janela(f, '#e6dcc0', '#9c7048', '#f6f0e0')


def jan_rosario():
    def f(k):
        for (x, n) in ((10, 5), (24, 4)):                                         # cestos até o teto
            for i in range(n):
                y = 64 - i * 11
                k.rect(x, y - 9, 13, 10, '#c9a273').rect(x, y - 9, 13, 1, '#e0bf8a')
                for xx in range(x + 1, x + 13, 3):
                    k.rect(xx, y - 8, 1, 9, '#a88050')
                for j, cor in enumerate(['#f6f0e0', '#8fb0d0', '#d98aa8']):
                    k.ell(x + 3 + j * 4, y - 10, 2.5, 1.5, cor)
        k.rect(58, 50, 26, 16, '#6b6a72').rect(58, 50, 26, 2, '#8e8a92').rect(62, 56, 8, 6, '#3b2a35')   # fogão
        k.ell(66, 60, 3, 1.5, '#e8884a').px(65, 59, '#f2c84a')
        k.rect(72, 46, 10, 4, '#3b3a42').rect(74, 43, 6, 3, '#3b3a42').px(76, 42, '#e8884a')            # ferro de brasa
        k.line(42, 14, 84, 18, '#8a7a85')                                         # varal de dentro
        k.rect(55, 16, 14, 4, '#f2e8f2').rect(53, 20, 18, 20, '#f2e8f2')         # a camisola remendada
        k.rect(56, 15, 1, 2, '#b98a5c').rect(67, 16, 1, 2, '#b98a5c')
        k.rect(57, 26, 5, 5, '#8fb0d0').rect(64, 33, 4, 4, '#e0b83a')
        for (x, y) in [(57, 26), (61, 26), (57, 30), (64, 33), (67, 36)]:
            k.px(x, y, '#5b7fa6')
    return janela(f, '#dcd0b8', '#8a5f41', '#c8d8b0')


ZOOM = dict(broa=broa, caixa_costura=caixa, caixa_aberta=lambda: caixa(True), colar_mae=colar, colar_brilho=lambda: colar(True),
            livro_reservado=livro, retrato=retrato, pote_telhado=pote, enxada=enxada, ficha_aurora=ficha, cavalinho=cavalinho,
            rapadura=rapadura, ovos=ovos, pao_de_ontem=pao,
            retrato_noite=lambda: retrato(True), desenho_nina=desenho_nina, receita=receita, retrato_ze=retrato_ze, croche=croche,
            livro_aurelius=livro_aurelius, ficha_icaro=ficha_icaro, vitrine=vitrine, bilhete_parteira=bilhete,
            janela_laudelina=jan_laudelina, janela_orlando=jan_orlando, janela_quim_quiteria=jan_quim_quiteria,
            janela_lindalva=jan_lindalva, janela_rosario=jan_rosario)


def main():
    os.makedirs(IMG, exist_ok=True)
    pr = Image.new('RGBA', (8 * 100 + 4, 4 * 100 + 4), (43, 34, 51, 255))
    for i, (nome, f) in enumerate(ZOOM.items()):
        c = f()
        c.save(os.path.join(IMG, f'zoom_{nome}.png'))
        pr.alpha_composite(c.im, (4 + (i % 8) * 100, 4 + (i // 8) * 100))
    pr.resize((pr.size[0] * 2, pr.size[1] * 2), Image.NEAREST).save(os.path.join(RAIZ, 'docs', 'arte', 'capturas', 'zoom.png'))
    print('zoom ok', len(ZOOM))


if __name__ == '__main__':
    main()
