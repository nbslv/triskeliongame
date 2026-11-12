"""Texturas de chão e utilitários de terreno (repetem a cada 16 px)."""
from px import C, T, col, mix, mul, rnd, OUT, EMISSIVOS

# Cores EMISSIVAS: não escurecem nas variações de luz (fogo, brasas, luz de lampião/janela).
FOGO = ['#fff3c4', '#ffe27a', '#ffb347', '#ff7a2f', '#e8452c', '#ffd98a']
# Fogo negro Caligosuin (também não muda com a luz).
NEGRO = ['#1a1423', '#2d1f3d', '#7b3fa0', '#b06fd8', '#4a2a66']

for _c in FOGO + NEGRO:
    EMISSIVOS.add(col(_c)[:3])


def _tex(base, pontos, seed):
    base = col(base)
    pontos = [(col(c), d) for c, d in pontos]

    def f(x, y):
        r = rnd(x % 16, y % 16, seed)
        acc = 0
        for c, d in pontos:
            acc += d
            if r < acc:
                return c
        return base
    return f


def grama(seed=1):
    f = _tex('#8cc063', [('#7db458', 0.13), ('#9ecf72', 0.09)], seed)
    tufos = {}
    for k in range(4):
        x = int(rnd(k, 7, seed) * 14) + 1
        y = int(rnd(k, 11, seed) * 13) + 2
        tufos[(x - 1, y - 1)] = tufos[(x + 1, y - 1)] = col('#6da24d')
        tufos[(x, y)] = col('#6da24d')
        tufos[(x, y - 2)] = col('#aad67c')
    return lambda x, y: tufos.get((x % 16, y % 16)) or f(x, y)


def terra(seed=2):
    f = _tex('#d6b383', [('#c8a273', 0.12), ('#e3c697', 0.07), ('#b8926a', 0.02)], seed)
    return f


def terra_vermelha(seed=3):
    return _tex('#c8774f', [('#b76745', 0.13), ('#d68c63', 0.08), ('#a65a3d', 0.02)], seed)


def terra_batida(seed=4):
    return _tex('#b99673', [('#ab8866', 0.14), ('#c7a682', 0.07)], seed)


def folhas(seed=5):
    f = _tex('#b9a66b', [('#a8935c', 0.14), ('#cdbd84', 0.10), ('#93a05a', 0.06)], seed)
    tr = {}
    for k in range(5):
        x = int(rnd(k, 3, seed) * 13) + 1
        y = int(rnd(k, 5, seed) * 13) + 1
        c = col(['#d9cc93', '#8e9a55', '#a07f4c'][k % 3])
        tr[(x, y)] = tr[(x + 1, y + 1)] = tr[(x + 2, y + 1)] = c
    return lambda x, y: tr.get((x % 16, y % 16)) or f(x, y)


def calcamento(seed=6):
    """Pedras arredondadas com rejunte."""
    arg, luz, base, som = col('#8f837c'), col('#d2c8bb'), col('#bdb2a5'), col('#a89c90')

    def f(x, y):
        x %= 16
        y %= 16
        fila = y // 4
        ox = (fila % 2) * 4 + (2 if fila % 4 >= 2 else 0)
        lx = (x + ox) % 8
        ly = y % 4
        if ly == 3 or lx == 7:
            return arg
        if (lx == 0 or lx == 6) and ly in (0, 2) and rnd(x, y, seed) < 0.6:
            return arg
        tom = rnd((x + ox) // 8, fila, seed)
        if ly == 0:
            return luz if tom > 0.3 else base
        if ly == 2 and tom < 0.5:
            return som
        return base if tom > 0.25 else som
    return f


def terreiro(seed=7):
    """Terra batida com grãos de café secando ao sol."""
    f = terra_batida(seed)
    graos = [col('#7a3b2a'), col('#8f4a30'), col('#5e3324'), col('#a3553a')]

    def g(x, y):
        r = rnd(x % 16, y % 16, seed + 9)
        if r < 0.42:
            return graos[int(r * 100) % 4]
        return f(x, y)
    return g


def tabuas(seed=8, base='#b98a5c', esc='#9c7048', luz='#cc9f70', vert=False):
    base, esc, luz = col(base), col(esc), col(luz)

    def f(x, y):
        if vert:
            x, y = y, x
        x %= 16
        y %= 16
        t = y // 4
        if y % 4 == 3:
            return esc
        if (x + t * 5) % 16 == 0:
            return esc
        r = rnd(x, t, seed)
        if y % 4 == 0 and r < 0.5:
            return luz
        if rnd(x, y, seed + 1) < 0.05:
            return esc
        return base
    return f


def pedra(seed=9, base='#8d8a93', esc='#74717c', luz='#a6a3aa'):
    """Chão de pedra úmida (túnel)."""
    base, esc, luz = col(base), col(esc), col(luz)
    f = _tex(base, [(esc, 0.14), (luz, 0.08)], seed)

    def g(x, y):
        x %= 16
        y %= 16
        # rachaduras
        if (x + y * 3 + seed) % 23 == 0 and rnd(x, y, seed) < 0.7:
            return col('#5f5c68')
        return f(x, y)
    return g


def tile(f, w=1, h=1, ox=0, oy=0):
    c = C(w * T, h * T)
    for y in range(h * T):
        for x in range(w * T):
            c.p[x, y] = col(f(x + ox, y + oy))
    return c


def _ond(v, seed):
    """Ondulação -1..1 periódica em 16."""
    v %= 16
    a = [0, 0, 1, 1, 1, 0, 0, -1, -1, 0, 0, 1, 0, 0, -1, 0]
    b = [0, 1, 1, 0, 0, -1, -1, -1, 0, 0, 1, 1, 0, 0, 0, 0]
    return (a if seed % 2 else b)[(v + seed * 3) % 16]


def transicao(f, borda, seed=0, margem=3):
    """Conjunto de 13 tiles de um terreno com borda irregular e fora transparente.

    Devolve (bloco 3×3 [cantos, lados, centro], bloco 2×2 de cantos internos).
    """
    borda = col(borda)
    S = 48
    blob = C(S, S)

    def dentro(x, y):
        l = x - (margem + _ond(y, seed))
        r = (S - 1 - x) - (margem + _ond(y, seed + 1))
        t = y - (margem + _ond(x, seed + 2))
        b = (S - 1 - y) - (margem + _ond(x, seed + 3))
        if min(l, r, t, b) < 0:
            return False
        R = 7
        for cx, cy in ((R + margem, R + margem), (S - 1 - R - margem, R + margem), (R + margem, S - 1 - R - margem), (S - 1 - R - margem, S - 1 - R - margem)):
            fx = x < cx if cx < S / 2 else x > cx
            fy = y < cy if cy < S / 2 else y > cy
            if fx and fy and (x - cx) ** 2 + (y - cy) ** 2 > (R + 0.6) ** 2:
                return False
        return True

    for y in range(S):
        for x in range(S):
            if dentro(x, y):
                viz = all(dentro(x + dx, y + dy) for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))
                blob.p[x, y] = col(f(x, y)) if viz else borda
    # cantos internos: tudo terreno, menos um quarto de círculo num canto
    inner = C(32, 32)
    R = 5
    for qy in range(2):
        for qx in range(2):
            # o canto transparente fica voltado para o centro do bloco 2×2
            cx = 15.5 if qx == 0 else -0.5
            cy = 15.5 if qy == 0 else -0.5
            def fora(x, y):
                return (x - cx) ** 2 + (y - cy) ** 2 < (R + _ond(x + y, seed) * 0.6) ** 2
            for y in range(16):
                for x in range(16):
                    if fora(x, y):
                        continue
                    viz = any(0 <= x + dx < 16 and 0 <= y + dy < 16 and fora(x + dx, y + dy) for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))
                    inner.p[qx * 16 + x, qy * 16 + y] = borda if viz else col(f(x, y))
    return blob, inner
