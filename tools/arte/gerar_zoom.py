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
FONTE = {
    'A': ['.x.', 'x.x', 'xxx', 'x.x', 'x.x'], 'D': ['xx.', 'x.x', 'x.x', 'x.x', 'xx.'], 'E': ['xxx', 'x..', 'xx.', 'x..', 'xxx'],
    'H': ['x.x', 'x.x', 'xxx', 'x.x', 'x.x'], 'I': ['xxx', '.x.', '.x.', '.x.', 'xxx'], 'L': ['x..', 'x..', 'x..', 'x..', 'xxx'],
    'O': ['xxx', 'x.x', 'x.x', 'x.x', 'xxx'], 'R': ['xx.', 'x.x', 'xx.', 'x.x', 'x.x'], 'S': ['xxx', 'x..', 'xxx', '..x', 'xxx'],
    'T': ['xxx', '.x.', '.x.', '.x.', '.x.'], 'U': ['x.x', 'x.x', 'x.x', 'x.x', 'xxx'], 'V': ['x.x', 'x.x', 'x.x', 'x.x', '.x.'],
}


def texto(c, x, y, t, cor, k=1, torto=False):
    for i, ch in enumerate(t):
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


def retrato():
    c = base()
    c.rect(12, 8, 72, 80, MADE['b']).rect(12, 8, 72, 4, MADE['l']).rect(78, 12, 6, 76, MADE['e'])
    c.rect(20, 16, 56, 64, '#e6dcc4')
    for y in range(16, 80):
        for x in range(20, 76):
            if rnd(x, y, 9) < 0.07:
                c.p[x, y] = col('#d6c8a8')
    cv, cl = '#5a5058', '#8a808a'                                        # carvão
    # homem sério (esquerda)
    c.ell(34, 36, 8, 9, cl).rect(27, 27, 14, 5, cv).rect(26, 46, 17, 26, cv)
    c.rect(30, 35, 2, 2, cv).rect(36, 35, 2, 2, cv).rect(31, 41, 6, 1, cv).rect(29, 32, 4, 1, cv).rect(35, 32, 4, 1, cv)
    # mulher rindo (direita)
    c.ell(60, 36, 8, 9, cl).ell(60, 31, 10, 6, cv).rect(50, 32, 3, 20, cv).rect(67, 32, 3, 20, cv).rect(51, 46, 18, 26, cl)
    for x in (56, 62):
        c.px(x, 35, cv).px(x + 1, 34, cv).px(x + 2, 35, cv)
    c.rect(56, 39, 8, 3, cv).rect(57, 39, 6, 1, '#e6dcc4')
    # bebê berrando (no meio, embaixo)
    c.ell(47, 62, 7, 7, cl).rect(41, 68, 13, 10, '#e6dcc4').rect(41, 68, 13, 1, cv).rect(41, 68, 1, 10, cv).rect(53, 68, 1, 10, cv)
    c.ell(47, 64, 3, 3, cv).px(44, 59, cv).px(45, 58, cv).px(49, 58, cv).px(50, 59, cv)
    c.px(40, 56, cv).px(38, 54, cv).px(55, 55, cv).px(57, 53, cv)
    c.px(48, 6, '#6f6b6e').px(48, 5, '#6f6b6e')
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
    c = base()
    k = base()
    k.rect(10, 40, 76, 12, MAD['b']).rect(10, 40, 76, 3, MAD['l']).rect(10, 49, 76, 3, MAD['e'])   # o cabo, de perto
    for x in range(14, 84, 9):
        k.rect(x, 44 + (x % 3), 5, 1, MAD['e'])
    texto(k, 16, 44, 'TADEO', MADE['o'], 1, True)                       # nomes riscados a canivete
    texto(k, 46, 44, 'AURORA', MADE['o'], 1, True)
    k.px(40, 46, '#c8372d').px(42, 46, '#c8372d').px(41, 47, '#c8372d').px(40, 45, '#c8372d').px(42, 45, '#c8372d')   # um coraçãozinho entre os dois
    k.rect(0, 38, 12, 16, '#8e99a8').rect(0, 38, 12, 3, '#c9ced6').rect(0, 30, 6, 34, '#7d8794').rect(0, 30, 2, 34, '#a9b2bf')   # a lâmina
    k.outline(OUT)
    c.blit(k)
    return c.sombra_chao(48, 84, 36, 4, '#3b2a3540')


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


ZOOM = dict(broa=broa, caixa_costura=caixa, caixa_aberta=lambda: caixa(True), colar_mae=colar, colar_brilho=lambda: colar(True),
            livro_reservado=livro, retrato=retrato, pote_telhado=pote, enxada=enxada, ficha_aurora=ficha, cavalinho=cavalinho,
            rapadura=rapadura, ovos=ovos, pao_de_ontem=pao)


def main():
    os.makedirs(IMG, exist_ok=True)
    pr = Image.new('RGBA', (7 * 100 + 4, 2 * 100 + 4), (43, 34, 51, 255))
    for i, (nome, f) in enumerate(ZOOM.items()):
        c = f()
        c.save(os.path.join(IMG, f'zoom_{nome}.png'))
        pr.alpha_composite(c.im, (4 + (i % 7) * 100, 4 + (i // 7) * 100))
    pr.resize((pr.size[0] * 2, pr.size[1] * 2), Image.NEAREST).save(os.path.join(RAIZ, 'docs', 'arte', 'capturas', 'zoom.png'))
    print('zoom ok', len(ZOOM))


if __name__ == '__main__':
    main()
