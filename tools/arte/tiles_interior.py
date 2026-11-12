"""Tileset `tiles_interior` (+ `_noite`): casas de Valesol por dentro — casa de Ícaro, padaria,
biblioteca, casa da Custódia — e os pedaços da casa de Ícaro em ruína."""
from px import C, T, Sheet, col, mix, mul, rnd, OUT, OUT2
import tex
from tex import tile
from ext_vila import MAD, MADE, CAL, PED, CINZA, barril, cesto

VAO = '#3b2a35'       # "vazio" fora da sala
TOPO = '#6b5560'      # topo das paredes visto de cima
TOPO_L = '#85707a'


def parede_int(queimada=False):
    """Parede do fundo, 3×2 (L, M, R × cima, baixo)."""
    c = C(48, 32)
    for y in range(32):
        for x in range(48):
            v = CAL['b'] if rnd(x, y, 21) > 0.08 else CAL['e']
            if y > 24:
                v = CAL['e']
            if queimada:
                v = mix(v, '#4f4148', min(1, max(0, 1.1 - y / 28 + (rnd(x // 2, y // 3, 4) - 0.5) * 0.7)) * 0.9)
            c.p[x, y] = col(v)
    c.rect(0, 0, 48, 2, TOPO_L).rect(0, 2, 48, 1, CAL['s'])
    c.rect(0, 27, 48, 4, MADE['b']).rect(0, 27, 48, 1, MADE['l']).rect(0, 31, 48, 1, MADE['o'])
    for x0 in (0, 45):
        c.rect(x0, 0, 3, 32, TOPO).rect(x0 + (2 if x0 == 0 else 0), 0, 1, 32, TOPO_L)
    return c


def moldura():
    """Topo das paredes visto de cima, bloco 3×3 (o centro é vazio escuro)."""
    c = C(48, 48, VAO)
    c.rect(0, 0, 48, 48, TOPO)
    c.rect(16, 16, 16, 16, VAO)
    # filetes claros voltados para dentro da sala
    c.rect(13, 13, 22, 1, TOPO_L).rect(13, 34, 22, 1, TOPO_L).rect(13, 13, 1, 22, TOPO_L).rect(34, 13, 1, 22, TOPO_L)
    c.rect(14, 14, 20, 2, TOPO).rect(14, 32, 20, 2, TOPO).rect(14, 14, 2, 20, TOPO).rect(32, 14, 2, 20, TOPO)
    for (x, y, w, h) in [(0, 0, 48, 3), (0, 45, 48, 3), (0, 0, 3, 48), (45, 0, 3, 48)]:
        c.rect(x, y, w, h, VAO)
    return c


def piso(f):
    return tile(f)


def fundo(linha=0):
    return parede_int().crop(16, linha * 16, 16, 16)


def janela_luz():
    c = fundo(0)
    c.rect(2, 3, 12, 11, MADE['b']).rect(3, 4, 10, 9, '#ffe9a8').rect(3, 4, 10, 2, '#fff6d6')
    c.rect(7, 4, 2, 9, MADE['b']).rect(3, 8, 10, 1, MADE['b'])
    c.rect(2, 2, 12, 1, OUT).rect(2, 14, 12, 1, OUT).rect(1, 3, 1, 11, OUT).rect(14, 3, 1, 11, OUT)
    return c


def luz_chao():
    """Mancha de sol que entra pela janela (2×2, translúcida)."""
    c = C(32, 32)
    for y in range(32):
        for x in range(32):
            xx = x - y * 0.35
            if 4 < xx < 20 and 1 < y < 29 and not (11 < xx < 13) and not (13 < y < 16):
                c.px(x, y, '#fff3c44a')
    return c


def porta_fundos(aberta=False):
    c = C(16, 32)
    c.blit(fundo(0), 0, 0).blit(fundo(1), 0, 16)
    c.rect(1, 3, 14, 29, OUT).rect(2, 4, 12, 28, MADE['b'])
    if aberta:
        c.rect(3, 6, 10, 26, '#9ecf72').rect(3, 6, 10, 8, '#bfe3f0').rect(3, 6, 2, 26, MADE['e'])
    else:
        c.rect(3, 6, 10, 26, MAD['b']).rect(6, 6, 1, 26, MAD['e']).rect(9, 6, 1, 26, MAD['e']).rect(3, 6, 10, 1, MAD['l'])
        c.px(11, 20, '#ffd23f').px(11, 21, '#c99a2e')
    return c


def soleira():
    """Vão da porta da frente na parede de baixo (com capacho)."""
    c = tile(tex.tabuas(41))
    c.rect(0, 10, 16, 6, '#8a6a55').rect(2, 3, 12, 6, '#b8644a').rect(3, 4, 10, 4, '#d58a62')
    for x in range(3, 13, 2):
        c.px(x, 5, '#b8644a').px(x + 1, 6, '#b8644a')
    c.rect(0, 0, 1, 16, TOPO).rect(15, 0, 1, 16, TOPO)
    return c


def quadro(tipo):
    c = fundo(0)
    if tipo == 'retrato_torto':
        c.line(5, 2, 8, 4, '#6f6b6e')
        pts = [(3, 5), (12, 4), (13, 12), (4, 13)]
        for y in range(4, 14):
            for x in range(3, 14):
                if 3 + (y - 5) * 0.1 <= x <= 12 + (y - 4) * 0.1 and 5 - (x - 3) * 0.1 <= y <= 13 - (x - 4) * 0.1:
                    c.px(x, y, MADE['b'])
        c.rect(5, 6, 6, 5, '#f3e6c8')
        c.rect(6, 7, 2, 2, '#e8c55a').rect(8, 7, 2, 3, '#b0763f').px(6, 9, '#f4a6c6').px(7, 9, '#5b7fa6')   # três figurinhas
    elif tipo == 'retrato_fita':
        c.rect(3, 3, 10, 11, OUT).rect(4, 4, 8, 9, '#f3e6c8')
        c.rect(6, 6, 4, 3, '#d9b08c').rect(6, 5, 4, 1, '#8e8a8a').rect(5, 9, 6, 4, '#6b4226')
        c.line(3, 3, 6, 6, '#2b1f2a').line(4, 3, 7, 6, '#2b1f2a')    # fita preta no canto
    elif tipo == 'receita':
        c.rect(3, 3, 10, 11, MADE['b']).rect(4, 4, 8, 9, '#f6f0e0')
        for y in (6, 8, 10):
            c.rect(5, y, 6 - (y % 4), 1, '#8e8a8a')
        c.px(10, 11, '#d9a05b').px(9, 11, '#d9a05b')
    elif tipo == 'desenho':
        c.rect(3, 4, 10, 9, '#f6f0e0').px(8, 3, '#d8413a')
        c.rect(5, 8, 2, 3, '#ffd23f').px(5, 7, '#e8884a').rect(9, 7, 2, 4, '#5b7fa6').px(9, 6, '#6b4226')   # duas pessoas de palito
        c.px(11, 5, '#ffb347').px(12, 5, '#ffb347').px(11, 6, '#ffb347')
        c.rect(4, 11, 8, 1, '#8cc063')
    elif tipo == 'placa_silencio':
        c.rect(2, 4, 12, 8, MAD['o']).rect(3, 5, 10, 6, MAD['l'])
        c.rect(4, 6, 8, 1, MADE['b']).rect(4, 8, 6, 1, MADE['b']).px(11, 9, MADE['b'])
    elif tipo == 'ferramentas':   # enxada e chapéu de palha
        c.line(4, 2, 4, 14, MADE['b']).rect(2, 2, 3, 2, '#8e8a8a')
        c.ell(10.5, 8, 4.5, 2, '#e3c66a').ell(10.5, 6.5, 2.5, 2, '#f2dc8c').rect(8, 7, 5, 1, '#a85236').px(10, 3, '#6f6b6e')
    return c


def prateleira(pote=False):
    c = C(32, 16)
    c.blit(fundo(0), 0, 0).blit(fundo(0), 16, 0)
    c.rect(1, 10, 30, 2, MADE['b']).rect(1, 10, 30, 1, MADE['l']).rect(1, 12, 30, 1, OUT)
    c.rect(3, 12, 1, 2, MADE['e']).rect(28, 12, 1, 2, MADE['e'])
    if pote:    # pote de barro "TELHADO" + latas
        c.rect(11, 3, 8, 7, '#b8644a').rect(12, 2, 6, 1, '#8f4a35').rect(11, 3, 2, 7, '#d58a62')
        c.rect(13, 5, 5, 3, '#f6f0e0').rect(14, 6, 3, 1, '#6b4226')
        c.rect(3, 6, 4, 4, '#8e99a8').rect(23, 5, 5, 5, '#5b7fa6').rect(23, 5, 5, 1, '#7d9cbd')
    else:
        c.rect(3, 5, 5, 5, '#d9c9a3').rect(10, 6, 3, 4, '#b8322e').rect(14, 4, 4, 6, '#8cc063').rect(20, 6, 6, 4, '#c9a05a').rect(27, 5, 2, 5, '#f6f0e0')
    return c


# ---------------------------------------------------------------- móveis

def mesa(posta=False, w=3):
    c = C(w * 16, 32)
    W = w * 16
    c.sombra_chao(W / 2, 29, W / 2 - 3, 2)
    c.rect(2, 6, W - 4, 16, MAD['b']).rect(2, 6, W - 4, 2, MAD['l']).rect(2, 19, W - 4, 3, MAD['e'])
    for x in range(8, W - 4, 9):
        c.rect(x, 8, 1, 11, MAD['e'])
    c.rect(3, 22, 2, 6, MADE['b']).rect(W - 5, 22, 2, 6, MADE['b'])
    c.outline(MAD['o'])
    if posta:
        c.rect(10, 9, W - 20, 8, '#f6f0e0').rect(10, 9, W - 20, 1, '#ffffff')   # toalha
        for x in range(12, W - 12, 4):
            c.px(x, 13, '#d8413a')
        bx = W // 2 - 4
        c.rect(bx, 7, 7, 7, '#5b7fa6').rect(bx, 7, 2, 7, '#7d9cbd').rect(bx + 2, 5, 3, 2, '#5b7fa6').px(bx + 7, 9, '#5b7fa6').px(bx + 8, 8, '#5b7fa6').px(bx - 1, 9, '#486a8f')
        c.px(bx + 3, 3, '#f4efe6').px(bx + 4, 2, '#f4efe6')    # vapor do café
        for x in (13, W - 17):
            c.rect(x, 11, 4, 4, '#f3e6c8').px(x + 4, 12, '#f3e6c8').rect(x + 1, 11, 2, 1, '#6b4226')
        c.rect(W - 26, 15, 6, 2, '#d9a05b')   # pão
    return c


def cadeira(lado='frente'):
    c = C(16, 16)
    c.sombra_chao(8, 14, 5, 1.5)
    if lado == 'frente':
        c.rect(4, 2, 8, 7, MAD['b']).rect(5, 3, 6, 5, MAD['l']).rect(4, 9, 8, 3, MAD['b']).rect(4, 9, 8, 1, MAD['l'])
        c.rect(4, 12, 2, 2, MADE['b']).rect(10, 12, 2, 2, MADE['b'])
    elif lado == 'costas':
        c.rect(4, 6, 8, 3, MAD['l']).rect(4, 3, 8, 8, MAD['b']).rect(6, 4, 1, 6, MAD['e']).rect(9, 4, 1, 6, MAD['e'])
        c.rect(4, 11, 2, 3, MADE['b']).rect(10, 11, 2, 3, MADE['b'])
    else:
        c.rect(4, 2, 2, 9, MAD['b']).rect(4, 8, 8, 3, MAD['b']).rect(4, 8, 8, 1, MAD['l'])
        c.rect(4, 11, 2, 3, MADE['b']).rect(10, 11, 2, 3, MADE['b'])
    return c.outline(MAD['o'])


def fogao():
    c = C(32, 32)
    c.rect(2, 8, 28, 22, '#c9bfb2').rect(2, 8, 28, 3, '#e6ded2').rect(26, 11, 4, 19, '#a89c90')
    c.rect(2, 8, 28, 1, '#f4efe6')
    for y in (15, 22):
        c.rect(2, y, 28, 1, '#a89c90')
    for x in (9, 18):
        c.rect(x, 11, 1, 19, '#a89c90')
    c.rect(8, 19, 12, 9, '#3b2a35').rect(9, 21, 10, 7, '#e8452c').rect(10, 22, 8, 6, '#ff7a2f').rect(12, 23, 4, 5, '#ffb347').rect(13, 25, 2, 3, '#ffe27a')
    c.rect(9, 27, 10, 1, MADE['e'])
    c.rect(4, 4, 8, 5, '#4f4a55').rect(4, 4, 8, 1, '#7d7780').px(3, 5, '#4f4a55').px(12, 5, '#4f4a55')      # panela
    c.rect(19, 3, 6, 6, '#5b7fa6').rect(19, 3, 2, 6, '#7d9cbd').px(25, 5, '#5b7fa6').px(26, 4, '#5b7fa6')   # bule
    c.rect(23, 0, 5, 8, '#8a817c').rect(23, 0, 2, 8, '#a59c94')     # chaminé
    return c.outline(OUT)


def catre(palha=False):
    c = C(32, 48) if not palha else C(32, 32)
    H = c.h
    if palha:   # colchão de palha no chão, com livros aparecendo embaixo
        c.sombra_chao(16, 28, 14, 2)
        c.rect(2, 5, 28, 21, '#e3d18f').rect(2, 5, 28, 2, '#f1e4ad').rect(2, 23, 28, 3, '#c4ae6a')
        for k in range(14):
            x, y = 4 + int(rnd(k, 1, 3) * 24), 8 + int(rnd(k, 2, 3) * 14)
            c.rect(x, y, 3, 1, '#c4ae6a')
        c.rect(4, 6, 10, 6, '#f6f0e0').rect(4, 6, 10, 1, '#ffffff')       # travesseiro
        c.rect(3, 13, 26, 10, '#5b7fa6').rect(3, 13, 26, 2, '#7d9cbd')    # coberta remendada
        c.rect(20, 17, 4, 4, '#c96a6a')
        c.outline(OUT2)
        c.rect(22, 26, 6, 2, '#a52a33').rect(15, 27, 6, 2, '#4f6b3a').rect(23, 28, 5, 1, '#f6f0e0')   # livros escondidos
        return c
    c.sombra_chao(16, H - 3, 14, 2)
    c.rect(2, 4, 28, H - 8, MADE['b']).rect(2, 4, 28, 4, MADE['l'])
    c.rect(3, 8, 26, H - 14, '#f3e6c8')
    c.rect(6, 10, 20, 8, '#f6f0e0').rect(6, 10, 20, 1, '#ffffff').rect(6, 17, 20, 1, '#ddd0b8')
    c.rect(3, 21, 26, H - 28, '#b8644a').rect(3, 21, 26, 2, '#d58a62')
    for y in range(26, H - 8, 5):
        for x in range(5, 28, 6):
            c.rect(x + (y % 2) * 3, y, 2, 2, '#e8b08c')
    c.rect(2, H - 6, 28, 2, MADE['e'])
    return c.outline(OUT)


def cadeira_balanco():
    c = C(16, 32)
    c.sombra_chao(8, 29, 6, 2)
    c.rect(3, 4, 10, 14, MAD['b']).rect(4, 5, 2, 12, MAD['l']).rect(7, 5, 2, 12, MAD['l']).rect(10, 5, 2, 12, MAD['l'])
    c.rect(2, 17, 12, 5, MAD['b']).rect(2, 17, 12, 1, MAD['l'])
    c.rect(3, 22, 2, 5, MADE['b']).rect(11, 22, 2, 5, MADE['b'])
    c.line(1, 26, 4, 29, MADE['b']).line(4, 29, 11, 29, MADE['b']).line(11, 29, 14, 26, MADE['b'])
    c.rect(3, 9, 10, 10, '#c96a6a').rect(3, 9, 10, 1, '#dd8a84')      # manta
    for y in range(11, 19, 3):
        c.rect(3, y, 10, 1, '#f3e6c8')
    c.px(4, 19, '#c96a6a').px(7, 19, '#c96a6a').px(10, 19, '#c96a6a')
    return c.outline(MAD['o'])


def mesinha_caixa(aberta=False):
    """Mesinha com a caixinha de costura (flor entalhada na tampa)."""
    c = C(16, 16)
    c.sombra_chao(8, 14, 6, 1.5)
    c.rect(2, 7, 12, 4, MAD['b']).rect(2, 7, 12, 1, MAD['l']).rect(3, 11, 2, 3, MADE['b']).rect(11, 11, 2, 3, MADE['b'])
    c.rect(4, 3, 8, 5, '#a3553a').rect(4, 3, 8, 1, '#c8774f')
    if aberta:
        c.rect(4, 0, 8, 3, '#8f4a35').rect(5, 3, 6, 2, '#3b2a35').px(7, 3, '#ffe27a').px(8, 4, '#f6f0e0')
    else:
        c.px(8, 5, '#ffe08a').px(7, 5, '#e8b08c').px(9, 5, '#e8b08c').px(8, 4, '#e8b08c').px(8, 6, '#e8b08c')
    return c.outline(OUT2)


def estante(w=2):
    c = C(w * 16, 32)
    W = w * 16
    c.rect(1, 1, W - 2, 30, MADE['b']).rect(1, 1, W - 2, 1, MADE['l'])
    cores = ['#a52a33', '#4f6b3a', '#5b7fa6', '#c9a05a', '#7a2e3b', '#e0962e', '#6b4226', '#8e99a8']
    for fy, y in enumerate((3, 12, 21)):
        c.rect(3, y, W - 6, 8, '#4a3129')
        x = 3
        k = fy * 3
        while x < W - 4:
            lw = 2 + int(rnd(x, fy, 5) * 2)
            h = 6 + int(rnd(x, fy, 6) * 2)
            if rnd(x, fy, 7) < 0.12:
                x += 2
                continue
            cc = cores[k % len(cores)]
            c.rect(x, y + 8 - h, min(lw, W - 3 - x), h, cc)
            c.rect(x, y + 8 - h, 1, h, mix(cc, '#ffffff', 0.3))
            x += lw
            k += 1
        c.rect(1, y + 8, W - 2, 1, MADE['l'])
    return c.outline(OUT)


def balcao(tipo='M'):
    c = C(16, 32)
    c.rect(0, 6, 16, 9, MAD['l']).rect(0, 6, 16, 1, '#e3bd8e').rect(0, 15, 16, 14, MAD['b'])
    c.rect(0, 15, 16, 1, MAD['e']).rect(0, 28, 16, 1, MADE['e'])
    for x in (4, 11):
        c.rect(x, 17, 1, 11, MAD['e'])
    c.rect(0, 5, 16, 1, OUT).rect(0, 29, 16, 1, OUT)
    if tipo == 'L':
        c.rect(0, 5, 1, 25, OUT)
    if tipo == 'R':
        c.rect(15, 5, 1, 25, OUT)
    if tipo == 'paes':
        c.ell(5, 9, 3.5, 2, '#d9a05b').ell(11, 11, 3.5, 2, '#c98f4c').px(4, 8, '#f0c98a').px(10, 10, '#f0c98a')
    if tipo == 'carimbo':
        c.rect(3, 8, 6, 5, '#f6f0e0').rect(4, 9, 4, 1, '#8e8a8a').rect(4, 11, 3, 1, '#8e8a8a')
        c.rect(11, 7, 3, 3, MADE['b']).rect(10, 10, 5, 2, '#7a2e3b')
    if tipo == 'fichario':
        c.rect(2, 2, 12, 10, MADE['b']).rect(2, 2, 12, 1, MADE['l'])
        for y in (4, 8):
            c.rect(3, y, 10, 3, MAD['l']).rect(7, y + 1, 2, 1, '#6f6b6e')
    return c


def forno():
    c = C(32, 48)
    c.sombra_chao(16, 45, 14, 2)
    c.ell(16, 22, 14, 14, '#c8774f')
    c.rect(2, 22, 28, 22, '#c8774f')
    c.ell(13, 16, 8, 7, '#d68c63')
    c.rect(2, 40, 28, 4, '#a65a3d')
    for y in range(26, 40, 5):
        for x in range(3, 29, 7):
            c.rect(x + (y % 2) * 3, y, 4, 1, '#b76745')
    c.ell(16, 32, 8, 7, '#3b2a35')
    c.rect(8, 32, 16, 8, '#3b2a35')
    c.rect(10, 35, 12, 5, '#e8452c').rect(11, 36, 10, 4, '#ff7a2f').rect(13, 37, 6, 3, '#ffb347')
    c.ell(13, 34, 2.5, 1.5, '#d9a05b').ell(19, 34, 2.5, 1.5, '#d9a05b')
    c.rect(13, 2, 6, 8, '#a65a3d').rect(13, 2, 2, 8, '#c8774f')
    return c.outline(OUT)


def prateleira_paes():
    c = C(32, 32)
    c.rect(1, 2, 30, 28, MADE['b']).rect(1, 2, 30, 1, MADE['l'])
    for y in (4, 13, 22):
        c.rect(3, y, 26, 7, '#4a3129')
        for x in range(4, 27, 6):
            cc = ['#d9a05b', '#c98f4c', '#e3b574'][(x + y) % 3]
            c.ell(x + 2.5, y + 4.5, 2.5, 2, cc).px(x + 2, y + 3, '#f0c98a')
        c.rect(1, y + 7, 30, 1, MADE['l'])
    return c.outline(OUT)


def ninho(ovos=True, galinha=False):
    c = C(16, 16)
    c.sombra_chao(8, 13, 7, 2)
    c.ell(8, 10, 7, 4, '#c9a05a').ell(8, 9, 5, 2.5, '#8a6a35')
    for k in range(8):
        c.px(2 + int(rnd(k, 1, 2) * 12), 9 + int(rnd(k, 2, 2) * 4), '#e3c66a')
    if ovos:
        c.ell(6.5, 9, 1.5, 1.5, '#f6f0e0').ell(9.5, 9.5, 1.5, 1.5, '#f3e6c8')
    if galinha:
        c.ell(8, 7, 4.5, 3.5, '#f6f0e0').ell(11, 4.5, 2, 2, '#f6f0e0').px(12, 2, '#d8413a').px(11, 2, '#d8413a').px(13, 5, '#e8884a').px(11, 4, OUT)
        c.rect(6, 7, 3, 1, '#ddd0b8')
    return c.outline(OUT2)


def croche():
    c = C(16, 16)
    c.sombra_chao(8, 13, 6, 2)
    c.ell(8, 10, 5.5, 3.5, '#c9a05a').ell(8, 9, 4.5, 2.2, '#8a6a35')
    c.ell(6, 8, 2.5, 2.5, '#b9a3e3').ell(10.5, 8.5, 2, 2, '#f4a6c6').px(5, 7, '#d6c8f2').px(10, 8, '#fbe3ec')
    c.line(3, 3, 9, 8, '#c9c4c0').line(12, 2, 8, 8, '#c9c4c0')
    return c.outline(OUT2)


def tapete(w=3, h=2, c1='#b8644a', c2='#f3e6c8'):
    c = C(w * 16, h * 16)
    W, H = w * 16, h * 16
    c.rect(2, 2, W - 4, H - 4, c1).rect(4, 4, W - 8, H - 8, c2).rect(5, 5, W - 10, H - 10, c1)
    for x in range(8, W - 8, 6):
        c.px(x, H // 2, c2).px(x + 1, H // 2 - 1, c2).px(x + 1, H // 2 + 1, c2).px(x + 2, H // 2, c2)
    for x in range(3, W - 3, 2):
        c.px(x, 1, c2).px(x, H - 2, c2)
    return c


def pote(tipo=0):
    c = C(16, 16)
    c.sombra_chao(8, 14, 5, 1.5)
    if tipo == 0:
        c.ell(8, 9, 5, 4.5, '#b8644a').rect(5, 3, 6, 3, '#b8644a').rect(4, 2, 8, 1, '#8f4a35').ell(6, 8, 1.5, 2.5, '#d58a62')
    else:  # vaso com flor
        c.rect(5, 9, 6, 5, '#b8644a').rect(4, 8, 8, 2, '#d58a62')
        c.rect(7, 4, 1, 4, '#5fa052').px(6, 5, '#5fa052').px(9, 6, '#5fa052')
        c.px(7, 2, '#ffd23f').px(6, 3, '#f2a7c0').px(8, 3, '#f2a7c0').px(7, 3, '#f2a7c0').px(7, 1, '#f2a7c0')
    return c.outline(OUT2)


def bau(aberto=False):
    c = C(16, 16)
    c.sombra_chao(8, 14, 7, 1.5)
    c.rect(2, 6, 12, 8, MADE['b']).rect(2, 6, 12, 1, MADE['l']).rect(2, 9, 12, 1, '#c99a2e').rect(7, 8, 2, 3, '#ffd23f')
    if aberto:
        c.rect(2, 1, 12, 5, MADE['e']).rect(3, 2, 10, 3, '#3b2a35')
    else:
        c.rect(2, 3, 12, 3, MADE['l']).rect(2, 3, 12, 1, '#c09a70')
    return c.outline(OUT)


# ---------------------------------------------------------------- montagem

def montar():
    s = Sheet('tiles_interior', 16)
    s.section('Pisos (camada `chao`)')
    s.add('tabua_1', piso(tex.tabuas(41)), 'Chão de tábua.')
    s.add('tabua_2', piso(tex.tabuas(42)), 'Chão de tábua (variação).')
    s.add('terra_batida_1', piso(tex.terra_batida(4)), 'Chão de terra batida (cozinha, casas simples).')
    s.add('terra_batida_2', piso(tex.terra_batida(14)), 'Terra batida (variação).')
    s.add('tabua_queimada', C(im=__import__('px').grade(piso(tex.tabuas(41, '#7a6258', '#5e4a44', '#8f766a')), 'dia')), 'Tábua chamuscada (casa em ruína).')
    s.add('vazio', C(16, 16, VAO), 'Escuro de fora da sala: preencha o resto do mapa.', col=True)
    s.add('soleira', soleira(), 'Vão da porta da frente, na linha de baixo da moldura (ponha a `saida` aqui).')

    s.section('Paredes', 'Receita de sala: linha 0 = `moldura` de cima; linhas 1–2 = `parede_fundo`; depois o piso com a `moldura` '
              'esquerda/direita nas laterais; última linha = `moldura` de baixo com uma `soleira` na porta. '
              'O tile central da moldura é o mesmo que `vazio`.')
    s.add('moldura', moldura(), 'Topo das paredes visto de cima (3×3: cantos e lados).', col=True)
    s.add('parede_fundo', parede_int(), 'Parede caiada do fundo (3×2: L, M, R × cima, baixo).', col=True)
    s.add('parede_fundo_queimada', parede_int(True), 'Parede do fundo com fuligem (ruína).', col=True)
    s.add('porta_fundos', porta_fundos(), 'Porta dos fundos fechada (substitui uma coluna da parede do fundo).', col=True)
    s.add('porta_fundos_aberta', porta_fundos(True), 'Porta dos fundos aberta para o terreiro.', col=['x', '.'])
    s.add('janela_luz', janela_luz(), 'Janela com luz da manhã (tile do meio, linha de cima).', col=True)
    s.add('luz_chao', luz_chao(), 'Mancha de sol no chão, abaixo da janela (camada `chao2`, translúcida).')

    s.section('Coisas de parede (substituem um tile do meio da linha de cima)')
    s.add('retrato_torto', quadro('retrato_torto'), 'Retrato torto da família (`exame_casa_retrato`).', col=True)
    s.add('ferramentas', quadro('ferramentas'), 'Enxada e chapéu de palha pendurados (`exame_casa_ferramentas`).', col=True)
    s.add('prateleira_pote', prateleira(True), 'Prateleira alta com o pote de barro "TELHADO" (`exame_casa_pote`).', col=True)
    s.add('prateleira', prateleira(), 'Prateleira com mantimentos.', col=True)
    s.add('retrato_fita', quadro('retrato_fita'), 'Retrato do finado Zé com fita preta (casa da Custódia).', col=True)
    s.add('receita', quadro('receita'), 'Receita emoldurada (padaria).', col=True)
    s.add('desenho', quadro('desenho'), 'Desenho da Nina pregado na parede (padaria).', col=True)
    s.add('placa_silencio', quadro('placa_silencio'), 'Placa "Silêncio. E limpe os pés." (biblioteca).', col=True)

    s.section('Móveis da casa')
    s.add('mesa_posta', mesa(True), 'Mesa posta com bule, canecas e pão (café com o pai).', col=True)
    s.add('mesa', mesa(False, 2), 'Mesa vazia.', col=True)
    s.add('fogao', fogao(), 'Fogão a lenha aceso com panela e bule (`exame_casa_fogao`).', col=True)
    s.add('catre', catre(), 'Catre com colcha (cama do pai).', col=True)
    s.add('colchao_palha', catre(True), 'Colchão de palha do Ícaro, com livros escondidos embaixo (`exame_casa_colchao`).', col=True)
    s.add('cadeira_balanco', cadeira_balanco(), 'Cadeira de balanço com manta (`exame_casa_cadeira`).', col=True)
    s.add('estante', estante(2), 'Estante de livros larga (biblioteca).', col=True)
    s.add('estante_estreita', estante(1), 'Estante estreita.', col=True)
    s.add('cadeira_frente', cadeira('frente'), 'Cadeira (de frente).', col=True)
    s.add('cadeira_costas', cadeira('costas'), 'Cadeira (de costas).', col=True)
    s.add('cadeira_lado', cadeira('lado'), 'Cadeira (de lado; espelhe no Tiled para o outro lado).', col=True)
    s.add('caixa_costura', mesinha_caixa(), 'Mesinha com a caixinha de costura fechada (`exame_casa_caixa_costura`).', col=True)
    s.add('caixa_costura_aberta', mesinha_caixa(True), 'Caixinha de costura aberta.', col=True)
    s.add('pote_barro', pote(0), 'Pote de barro.', col=True)
    s.add('vaso_flor', pote(1), 'Vaso com flor.', col=True)
    s.add('bau', bau(), 'Baú fechado.', col=True)
    s.add('bau_aberto', bau(True), 'Baú aberto.', col=True)
    s.add('tapete', tapete(), 'Tapete (camada `chao2`).')
    s.add('tapete_azul', tapete(2, 2, '#5b7fa6', '#f3e6c8'), 'Tapete azul 2×2 (camada `chao2`).')

    s.section('Padaria, biblioteca e casa da Custódia')
    s.add('balcao_L', balcao('L'), 'Balcão: ponta esquerda.', col=True)
    s.add('balcao_M', balcao('M'), 'Balcão: meio (repete).', col=True)
    s.add('balcao_R', balcao('R'), 'Balcão: ponta direita.', col=True)
    s.add('balcao_paes', balcao('paes'), 'Balcão com pães (padaria).', col=True)
    s.add('balcao_carimbo', balcao('carimbo'), 'Balcão com ficha e carimbo (Ermelinda).', col=True)
    s.add('balcao_fichario', balcao('fichario'), 'Balcão com o fichário de empréstimos (`exame_biblioteca_ficha`).', col=True)
    s.add('forno', forno(), 'Forno de barro aceso (`exame_juca_forno`).', col=True)
    s.add('prateleira_paes', prateleira_paes(), 'Prateleira de pães.', col=True)
    s.add('cesto_paes', cesto(True).map(lambda v, x, y: col('#d9a05b') if v[:3] in ((184, 50, 46), (226, 86, 74), (122, 31, 36)) else v), 'Cesto de pães.', col=True)
    s.add('ninho', ninho(), 'Ninho da Pamonha com ovos.', col=True)
    s.add('ninho_galinha', ninho(False, True), 'Ninho com a galinha chocando.', col=True)
    s.add('croche', croche(), 'Cesta de crochê (`exame_custodia_croche`).', col=True)
    s.add('barril_melado', barril(), 'Barril de melado (`exame_custodia_barril`).', col=True)
    return s


if __name__ == '__main__':
    s = montar()
    s.export(('noite',))
    print(s.nome, 'ok', len(s.itens))
