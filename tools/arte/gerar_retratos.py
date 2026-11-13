"""Gera os 29 retratos 64×64 de assets/portraits/ e a prancha docs/arte/capturas/retratos.png.

Uso: python3 tools/arte/gerar_retratos.py
"""
import math, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from PIL import Image
from px import C, RAIZ, col, mix, mul, rnd, OUT, OUT2
from boneco import PELES
from gerar_sprites import FICHAS, CG

DEST = os.path.join(RAIZ, 'assets', 'portraits')
OLHO = '#3b2a35'

# expressão → (sobrancelha, olho, boca, extras)
EXPR = {
    'neutro': ('reta', 'normal', 'leve', ()),
    'sorriso': ('reta', 'normal', 'sorriso', ('corado',)),
    'surpreso': ('alta', 'arregalado', 'o', ()),
    'medo': ('triste', 'arregalado', 'tremida', ('suor',)),
    'choro': ('triste', 'fechado_triste', 'tremida', ('lagrimas',)),
    'determinado': ('brava', 'normal', 'firme', ()),
    'ranzinza': ('brava', 'meio', 'torta', ()),
    'ferido': ('triste', 'meio', 'leve', ('fuligem', 'suor')),
    'sorriso_fraco': ('triste', 'fechado', 'sorriso', ('fuligem',)),
    'riso': ('alta', 'fechado', 'riso', ('corado',)),
    'brava': ('brava', 'normal', 'aberta_brava', ()),
    'suave': ('reta', 'fechado', 'sorriso', ()),
}

FUNDOS = {'icaro': '#f6dfa8', 'pai': '#d9c9b0', 'tonho': '#cfe0a8', 'zefa': '#f0c8a0', 'custodia': '#ddd0f0', 'nina': '#fbe9a0', 'juca': '#f6e3c8',
          'ermelinda': '#d6d6e0', 'aldeao': '#e6cdb0', 'aldea': '#cfe6d6', 'soldado': '#dfe6ee', 'sargento': '#cfdcf0'}


def moldura(cor):
    c = C(64, 64)
    c.rect(2, 2, 60, 60, cor)
    for y in range(2, 62):
        for x in range(2, 62):
            if (x + y) % 2 == 0 and y > 40:
                c.p[x, y] = col(mul(cor, 0.93))
    for (x, y) in [(2, 2), (61, 2), (2, 61), (61, 61), (3, 2), (2, 3), (60, 2), (61, 3), (2, 60), (3, 61), (61, 60), (60, 61)]:
        c.clear(x, y)
    return c


def camada(f):
    c = C(64, 64)
    f(c)
    return c.outline(OUT)


def retrato(nome, s, expr, fundo=None):
    g = s.get
    pele, pele_e = PELES[g('pele', 'clara')]
    cab = g('cabelo', '#6b4226')
    cab_l, cab_e = mix(cab, '#ffffff', 0.3), mul(cab, 0.8)
    sob, olho, boca, extras = EXPR[expr]
    cr = g('crianca')
    c = moldura(fundo or FUNDOS.get(nome, '#e6d6c0'))
    cy = 31 if not cr else 34
    gd = 2 if g('gordo') else 0
    est = g('estilo', 'curto')

    # cabelo de trás
    def tras(k):
        if est == 'comprido':
            k.rect(13, cy - 8, 38, 34, cab)
        if est == 'trancas':
            for x in (9, 51):
                k.rect(x, cy + 2, 5, 22, cab)
                for y in range(cy + 5, cy + 22, 5):
                    k.rect(x, y, 5, 1, cab_e)
                k.rect(x, cy + 22, 5, 2, g('fita', '#d8413a'))
        if est == 'coque':
            k.ell(32, cy - 23, 7, 6, cab)
            k.ell(30, cy - 25, 3, 2, cab_l)
    c.blit(camada(tras))

    # ombros e roupa
    def corpo(k):
        cam = g('camisa', '#f3e6c8')
        base = g('vestido') or cam
        if g('tabardo'):
            base = g('camisa')
        k.ell(32, 66, 25 + gd, 16, base)
        k.rect(27, cy + 14, 10, 8, pele_e)
        if g('xadrez'):
            for y in range(48, 62):
                for x in range(6, 58):
                    if k.get(x, y)[3] and (x % 6 == 0 or y % 6 == 0):
                        k.px(x, y, g('xadrez'))
        k.rect(27, cy + 20, 10, 3, cam) if not g('tabardo') else None
        if g('colete'):
            k.ell(13, 66, 9, 15, g('colete')).ell(51, 66, 9, 15, g('colete'))
        if g('tabardo'):
            k.rect(20, 51, 24, 12, g('tabardo')).rect(20, 51, 24, 1, '#e0b83a').rect(30, 54, 4, 6, '#e0b83a')
            if g('faixa'):
                for t in range(26):
                    k.rect(19 + t, 51 + t // 2, 3, 3, g('faixa'))
        if g('avental'):
            k.rect(22, 54, 20, 9, g('avental')).rect(22, 50, 3, 5, g('avental')).rect(39, 50, 3, 5, g('avental'))
        if g('xale'):
            k.ell(32, 60, 26, 9, g('xale')).ell(32, 51, 8, 5, pele_e)
            for x in range(10, 56, 5):
                k.px(x, 58, mul(g('xale'), 0.8))
        if g('capa'):
            k.ell(10, 62, 8, 12, g('capa')).ell(54, 62, 8, 12, g('capa'))
        if g('colar'):
            k.line(27, cy + 20, 32, cy + 26, '#8a6a55').line(37, cy + 20, 32, cy + 26, '#8a6a55')
            k.rect(31, cy + 26, 2, 2, '#c9a3a8')
    c.blit(camada(corpo))

    # cabeça
    def cabeca(k):
        k.ell(32, cy, 17 + gd // 2, 18, pele)
        k.ell(14.5 - gd // 2, cy + 2, 3, 4, pele).ell(49.5 + gd // 2, cy + 2, 3, 4, pele)
        for y in range(cy + 8, cy + 19):
            for x in range(14, 50):
                if k.get(x, y)[3] and ((x - 32) / 17) ** 2 + ((y - cy) / 18) ** 2 > 0.84:
                    k.p[x, y] = col(pele_e)
    c.blit(camada(cabeca))

    ey = cy + 1
    # olhos
    for ex, lado in ((24, -1), (40, 1)):
        if olho == 'normal':
            c.ell(ex, ey + 0.5, 2.5, 3.5, OLHO)
            c.px(ex - 1, ey - 2, '#ffffff').px(ex - 2, ey - 1, '#ffffff').px(ex, ey + 2, '#8a7a85')
        elif olho == 'arregalado':
            c.ell(ex, ey + 0.5, 3.5, 4, '#ffffff')
            c.ell(ex, ey + 1, 1.6, 2.2, OLHO)
            c.px(ex - 1, ey, '#ffffff')
            for t in range(-3, 4):
                c.px(ex + t, ey - 4 + (1 if abs(t) > 1 else 0), OLHO)
        elif olho == 'meio':
            c.ell(ex, ey + 1, 2.5, 2.5, OLHO)
            c.rect(ex - 3, ey - 2, 7, 2, pele).rect(ex - 3, ey - 1, 7, 1, OLHO)
        elif olho == 'fechado':
            for t in range(-3, 4):
                c.px(ex + t, ey + (1 if abs(t) > 1 else 0) + (1 if abs(t) > 2 else 0) - 1, OLHO)
        elif olho == 'fechado_triste':
            for t in range(-3, 4):
                c.px(ex + t, ey + 1 - (1 if abs(t) > 1 else 0), OLHO)
                c.px(ex + t, ey + 2 - (1 if abs(t) > 1 else 0), OLHO) if abs(t) < 2 else None
        # sobrancelhas
        sc = mul(cab, 0.7) if g('chapeu') != 'elmo' else '#6b4226'
        by_ = ey - 7 - (2 if sob == 'alta' else 0)
        for t in range(-3, 4):
            dy = 0
            if sob == 'triste':
                dy = int(round(-t * lado * 0.4))
            if sob == 'brava':
                dy = int(round(t * lado * 0.45)) + 1
            c.px(ex + t, by_ + dy, sc)
            c.px(ex + t, by_ + dy + 1, sc) if g('sobr_grossa') else None
    # nariz e bochechas
    c.px(32, ey + 5, pele_e).px(33, ey + 6, pele_e).px(31, ey + 6, pele_e)
    rosa = mix(pele, '#e8607a', 0.4 if 'corado' in extras else 0.22)
    c.ell(20, ey + 7, 3, 1.6, rosa).ell(44, ey + 7, 3, 1.6, rosa)
    # boca
    my = ey + 11
    bc = '#8a4a4a'
    if boca == 'leve':
        c.rect(29, my, 6, 1, bc).px(28, my - 1, bc).px(35, my - 1, bc) if expr == 'neutro' else c.rect(29, my, 6, 1, bc)
    elif boca == 'sorriso':
        c.rect(28, my, 8, 1, bc).px(27, my - 1, bc).px(36, my - 1, bc).px(26, my - 2, bc).px(37, my - 2, bc)
    elif boca == 'o':
        c.ell(32, my + 0.5, 2.5, 3, '#6b3040').px(32, my + 2, '#c96a6a')
    elif boca == 'tremida':
        for t in range(-4, 5):
            c.px(32 + t, my + (t % 2), bc)
    elif boca == 'firme':
        c.rect(28, my, 8, 1, bc).px(27, my + 1, bc).px(36, my + 1, bc)
    elif boca == 'torta':
        c.rect(28, my + 1, 5, 1, bc).rect(33, my, 3, 1, bc).px(27, my + 2, bc)
    elif boca == 'riso':
        c.ell(32, my, 5.5, 3.5, '#6b3040').rect(26, my - 4, 12, 3, pele).rect(27, my - 1, 10, 1, '#ffffff')
        if g('dente_lascado'):
            c.px(33, my - 1, '#6b3040')
        c.rect(29, my + 2, 5, 1, '#c96a6a')
    elif boca == 'aberta_brava':
        c.rect(28, my - 1, 9, 4, '#6b3040').rect(29, my - 1, 7, 1, '#ffffff').px(28, my + 3, bc).px(36, my + 3, bc)
    # barba, bigode, óculos
    if g('barba'):
        for y in range(cy + 6, cy + 19):
            for x in range(14, 51):
                d = ((x - 32) / 17) ** 2 + ((y - cy) / 18) ** 2
                if 0.62 < d <= 1.0 and c.get(x, y)[:3] in (col(pele)[:3], col(pele_e)[:3]) and rnd(x, y, 3) < 0.55:
                    c.px(x, y, g('barba'))
    if g('bigode'):
        b = g('bigode')
        c.ell(26.5, my - 2, 5, 2.2, b).ell(37.5, my - 2, 5, 2.2, b).px(21, my - 1, b).px(43, my - 1, b)
        c.rect(24, my - 1, 16, 1, mul(b, 0.85))
    if g('oculos'):
        for ex in (24, 40):
            for a in range(0, 360, 12):
                c.px(ex + 5.5 * math.cos(math.radians(a)), ey + 2 + 4.5 * math.sin(math.radians(a)), '#8e8a8a')
        c.rect(29, ey + 1, 6, 1, '#8e8a8a')

    # cabelo da frente / chapéu
    def frente(k):
        ch = g('chapeu')
        topo = cy - 19
        if est != 'careca' and ch not in ('lenco', 'touca', 'elmo'):
            for y in range(topo - 1, cy - 4):
                for x in range(12, 53):
                    d = ((x - 32) / 19.5) ** 2 + ((y - cy + 2) / 19.5) ** 2
                    franja = cy - 9 + int(2.5 * math.sin(x * 0.9)) + (3 if est == 'despenteado' and 20 < x < 30 else 0)
                    if d <= 1.0 and (y < franja or x < 16 or x > 48):
                        k.px(x, y, cab)
            k.rect(13, cy - 6, 3, 8, cab).rect(48, cy - 6, 3, 8, cab)
            k.ell(26, topo + 5, 7, 2.5, cab_l)
            if est == 'despenteado':
                for (x, h) in [(20, 5), (27, 7), (35, 6), (42, 5), (47, 3)]:
                    for t in range(h):
                        k.rect(x - (h - t) // 2, topo - t + 2, max(1, h - t), 1, cab)
        if est == 'careca':
            k.rect(13, cy - 8, 4, 10, cab).rect(47, cy - 8, 4, 10, cab)
        if ch == 'palha':
            tor = 3 if g('torto') else 0
            k.ell(32, cy - 12, 15, 9, '#e3c66a')
            for x in range(4, 60):
                yy = cy - 10 + (x - 32) * tor // 28
                k.rect(x, yy, 1, 5, '#e3c66a')
                k.px(x, yy, '#f2dc8c')
                if x % 3 == 0:
                    k.px(x, yy + 3, '#b8944e')
            k.rect(18, cy - 13, 28, 3, '#a85236')
            k.ell(27, cy - 17, 6, 2, '#f2dc8c')
        elif ch == 'lenco':
            b = g('cor_chapeu', '#c8372d')
            k.ell(32, cy - 7, 19, 13, b)
            k.rect(13, cy - 6, 38, 4, b)
            k.ell(26, cy - 14, 7, 3, mix(b, '#ffffff', 0.3))
            for (x, y) in [(22, cy - 9), (36, cy - 13), (44, cy - 7), (30, cy - 5)]:
                k.rect(x, y, 2, 2, '#f6f0e0')
            k.rect(49, cy - 2, 5, 6, mul(b, 0.8))
        elif ch == 'touca':
            k.ell(32, cy - 17, 17, 9, '#f6f0e0').rect(15, cy - 13, 34, 6, '#f6f0e0').rect(15, cy - 8, 34, 1, '#ddd0b8')
            k.ell(26, cy - 20, 7, 3, '#ffffff')
        elif ch == 'elmo':
            k.ell(32, cy - 8, 19, 13, '#a9b2bf')
            k.rect(13, cy - 7, 38, 4, '#a9b2bf').rect(13, cy - 4, 38, 2, '#e0b83a')
            k.rect(30, cy - 3, 4, 7, '#a9b2bf').ell(25, cy - 14, 7, 3, '#cfd6df')
            k.rect(13, cy - 3, 3, 10, '#a9b2bf').rect(48, cy - 3, 3, 10, '#a9b2bf')
        if ch in ('lenco', 'elmo'):       # não cobrir os olhos
            for y in range(cy - (6 if ch == 'lenco' else 2), cy + 10):
                for x in range(17, 47):
                    if not (ch == 'elmo' and 30 <= x < 34 and y < cy + 4):
                        k.clear(x, y)
    c.blit(camada(frente))

    # extras
    if 'lagrimas' in extras:
        for ex in (24, 40):
            c.rect(ex, ey + 3, 2, 7, '#8fcbe0').px(ex, ey + 3, '#d6eef6').ell(ex + 1, ey + 11, 1.5, 2, '#8fcbe0')
    if 'suor' in extras:
        c.px(49, cy - 9, '#8fcbe0').rect(48, cy - 8, 3, 3, '#8fcbe0').px(48, cy - 8, '#d6eef6')
    if 'fuligem' in extras:
        for (x, y, r) in [(19, cy + 4, 3), (45, cy - 2, 2.5), (38, cy + 12, 2), (26, cy - 8, 2)]:
            for yy in range(int(y - r), int(y + r + 1)):
                for xx in range(int(x - r - 1), int(x + r + 2)):
                    if ((xx - x) / (r + 1)) ** 2 + ((yy - y) / r) ** 2 < 1 and rnd(xx, yy, 4) < 0.7 and c.get(xx, yy)[:3] in (col(pele)[:3], col(pele_e)[:3]):
                        c.px(xx, yy, '#5e4a4db0')
    if g('galinha'):     # a Pamonha no canto
        k = C(64, 64)
        k.ell(52, 54, 9, 7, '#f6f0e0').ell(49, 45, 4.5, 4.5, '#f6f0e0')
        k.rect(47, 39, 2, 2, '#d8413a').rect(49, 38, 2, 3, '#d8413a').rect(51, 39, 2, 2, '#d8413a')
        k.rect(44, 46, 3, 2, '#e8884a').px(48, 44, OLHO).px(48, 45, OLHO).rect(46, 48, 2, 2, '#d8413a')
        k.ell(54, 55, 4, 3, '#ddd0b8')
        if expr == 'medo':
            k.px(48, 43, '#ffffff').px(47, 44, '#ffffff').px(55, 40, '#8fcbe0').px(55, 41, '#8fcbe0')
        c.blit(k.outline(OUT))
    for y in range(64):          # recorta fora da moldura arredondada
        for x in range(64):
            if x < 2 or y < 2 or x > 61 or y > 61 or (x in (2, 61) and y in (2, 3, 60, 61)) or (y in (2, 61) and x in (3, 60)):
                c.p[x, y] = (0, 0, 0, 0)
    return c


def retrato_cali(capitao=False, bravo=False):
    P = CG
    c = moldura('#cdbfd6' if not capitao else '#d6b8c0')
    def capuz(k):
        k.ell(32, 30, 25, 26, P['m'])
        k.ell(32, 66, 26, 14, P['m'])
        k.ell(24, 12, 8, 4, P['ml'])
        if capitao:
            k.rect(8, 44, 10, 20, P['ml']).rect(46, 44, 10, 20, P['ml'])       # gola alta
            k.ell(10, 58, 9, 7, '#8e99a8').ell(8, 55, 5, 2, '#c9ced6')            # ombreira
    c.blit(camada(capuz))
    def cara(k):
        k.ell(32, 34, 18, 17, P['p'])
        k.ell(8, 30, 6, 9, P['p']).ell(56, 30, 6, 9, P['p'])                      # orelhas caídas
        k.ell(8, 36, 4, 3, P['s']).ell(56, 36, 4, 3, P['s'])
        k.ell(26, 22, 8, 3, P['l'])
    c.blit(camada(cara))
    for ex, lado in ((23, -1), (41, 1)):
        c.ell(ex, 29, 4, 4, P['o'])
        c.ell(ex + 0.5, 30, 1.6, 2.2, P['n']).px(ex - 2, 27, '#fff3c4')
        if bravo:
            for t in range(-5, 6):
                c.rect(ex + t, 23 + int(t * lado * 0.6) + 2, 1, 2, P['s'])
    def focinho(k):
        k.ell(32, 41, 10, 7, P['f'])
        k.ell(29, 38, 5, 2, mix(P['f'], '#ffffff', 0.3))
    c.blit(camada(focinho))
    c.ell(28, 42, 1.6, 2.2, P['s']).ell(36, 42, 1.6, 2.2, P['s'])
    def presas(k):
        for x, lado in ((19, -1), (45, 1)):
            if capitao and lado == 1:
                k.rect(x - 2, 46, 4, 4, P['t'])                                   # presa quebrada
                k.px(x - 2, 46, P['p']).px(x + 1, 47, P['p'])
                continue
            for t in range(12):
                k.rect(x + lado * (t // 5) - 2, 50 - t, 4 - t // 4, 1, P['t'])
    c.blit(camada(presas))
    if bravo:
        c.rect(27, 50, 10, 3, '#3a1525').rect(28, 50, 8, 1, P['t'])
    else:
        c.rect(28, 50, 8, 1, P['s'])
    # chama negra com borda roxa saindo do focinho (maior quando bravo)
    cham = [(39, 44, 2.2), (44, 42, 2.8), (49, 38, 2.8), (53, 33, 2.2), (56, 28, 1.5)]
    if bravo:
        cham = [(39, 44, 2.6), (45, 42, 3.6), (51, 37, 3.8), (55, 30, 3), (57, 23, 2), (25, 44, 2.4), (19, 42, 3), (13, 38, 2.6), (9, 33, 1.8)]
    f = C(64, 64)
    for (x, y, rr) in cham:
        f.ell(x, y, rr + 1.4, rr + 1.4, P['r'])
    for (x, y, rr) in cham:
        f.ell(x, y, rr, rr, P['n'])
    for (x, y, rr) in cham[2:5]:
        f.px(x + rr, y - rr, P['rl']).px(x - 1, y - 1, '#2d1f3d')
    c.blit(f)
    for y in range(64):
        for x in range(64):
            if x < 2 or y < 2 or x > 61 or y > 61:
                c.p[x, y] = (0, 0, 0, 0)
    return c


def retrato_mae():
    """Silhueta em contraluz dourada: só o contorno do cabelo e um sorriso."""
    c = moldura('#ffe9a8')
    for y in range(2, 62):
        for x in range(2, 62):
            d = ((x - 32) ** 2 + (y - 26) ** 2) ** 0.5
            t = min(1, d / 44)
            v = mix('#fff8dc', '#f2b25a', t)
            if (x + y) % 2 and 0.35 < t < 0.5 or (x + y) % 2 and 0.7 < t < 0.85:
                v = mix('#fff8dc', '#f2b25a', min(1, t + 0.15))
            c.p[x, y] = col(v)
    s = C(64, 64)
    s.ell(32, 30, 19, 21, '#7a4a3a')              # cabelo solto
    s.rect(13, 30, 38, 26, '#7a4a3a')
    s.ell(32, 68, 26, 16, '#7a4a3a')
    s.ell(32, 31, 14, 16, '#8a5a48')              # rosto na sombra
    c.blit(s)
    for y in range(64):                             # borda de luz no contorno
        for x in range(64):
            if s.get(x, y)[3] and any(s.get(x + dx, y + dy)[3] == 0 for dx, dy in ((1, 0), (-1, 0), (0, -1), (0, 1))):
                c.px(x, y, '#fff3c4')
            elif s.get(x, y)[3] and any(s.get(x + dx, y + dy)[3] == 0 for dx, dy in ((2, 0), (-2, 0), (0, -2))):
                c.px(x, y, '#ffd98a')
    for t in range(-5, 6):                          # o sorriso
        c.px(32 + t, 41 - (abs(t) // 2 if abs(t) > 2 else 0) + 1, '#ffe9c0')
    for (x, y) in [(10, 12), (52, 9), (56, 30), (7, 40), (48, 50)]:
        c.px(x, y, '#ffffff').px(x + 1, y, '#fff3c4').px(x, y + 1, '#fff3c4')
    for y in range(64):
        for x in range(64):
            if x < 2 or y < 2 or x > 61 or y > 61 or (x in (2, 61) and y in (2, 3, 60, 61)) or (y in (2, 61) and x in (3, 60)):
                c.p[x, y] = (0, 0, 0, 0)
    return c


LISTA = [
    ('icaro', 'icaro', ['neutro', 'sorriso', 'surpreso', 'medo', 'choro', 'determinado']),
    ('pai', 'pai', ['neutro', 'ranzinza', 'ferido', 'sorriso_fraco']),
    ('juca', 'juca', ['neutro']), ('ermelinda', 'ermelinda', ['neutro']),
    ('tonho', 'tonho', ['neutro', 'riso', 'medo']),
    ('zefa', 'zefa', ['neutro', 'brava']),
    ('custodia', 'custodia', ['neutro', 'medo']),
    ('nina', 'nina', ['neutro']),
    ('aldeao', 'sobrevivente_1', ['medo']), ('aldea', 'sobrevivente_2', ['medo']),
    ('soldado', 'soldado_1', ['neutro']),
    ('sargento', 'sargento', ['neutro', 'suave']),
]


def todos():
    r = {}
    for nome, ficha, exprs in LISTA:
        s = dict(FICHAS[ficha])
        if nome == 'tonho':
            s['dente_lascado'] = True
        if nome in ('pai', 'zefa'):
            s['sobr_grossa'] = True
        for e in exprs:
            ee = 'sorriso' if (nome, e) == ('nina', 'neutro') else e
            r[f'{nome}_{e}'] = retrato(nome, s, ee)
    r['mae_silhueta'] = retrato_mae()
    r['cali_soldado'] = retrato_cali()
    r['toucim_neutro'] = retrato_cali(True)
    r['toucim_bravo'] = retrato_cali(True, True)
    return r


def main():
    os.makedirs(DEST, exist_ok=True)
    r = todos()
    for nome, c in r.items():
        c.save(os.path.join(DEST, nome + '.png'))
    W = 8
    pr = Image.new('RGBA', (W * 66 + 2, ((len(r) + W - 1) // W) * 66 + 2), (59, 42, 53, 255))
    for i, c in enumerate(r.values()):
        pr.alpha_composite(c.im, (2 + (i % W) * 66, 2 + (i // W) * 66))
    pr.resize((pr.size[0] * 2, pr.size[1] * 2), Image.NEAREST).save(os.path.join(RAIZ, 'docs', 'arte', 'capturas', 'retratos.png'))
    print('retratos ok', len(r))


if __name__ == '__main__':
    main()
