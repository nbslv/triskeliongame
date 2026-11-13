"""Tela de título, cartão de título, símbolo do triskelion (três espirais entrelaçadas) e ícones do jogo.

Uso: python3 tools/arte/gerar_titulo.py
"""
import math, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from PIL import Image
from px import C, RAIZ, col, mix, mul, rnd, OUT
from tiles_outros import ceu

IMG = os.path.join(RAIZ, 'assets', 'images')


def triskelion(c, cx, cy, R, cor, esp=1.0, voltas=1.6, borda=None, giro=-math.pi / 2):
    """Três espirais que nascem do centro e se enrolam, a 120° uma da outra. Desenho original."""
    d = R * 0.52
    pts = []
    for k in range(3):
        ak = giro + k * 2 * math.pi / 3
        sx, sy = cx + d * math.cos(ak), cy + d * math.sin(ak)
        n = int(R * 14)
        for i in range(n + 1):
            t = i / n
            rho = d * (1 - t) ** 0.85 * 0.98 + esp * 0.2
            th = ak + math.pi + t * voltas * 2 * math.pi
            pts.append((sx + rho * math.cos(th), sy + rho * math.sin(th), esp * (1.0 - 0.35 * t)))
        pts.append((sx, sy, esp * 1.25))                     # miolo de cada espiral
    if borda:
        for (x, y, e) in pts:
            c.ell(x, y, e + 1, e + 1, borda)
    for (x, y, e) in pts:
        c.ell(x, y, e, e, cor)
    return c


def simbolo(tam, fundo=True):
    c = C(tam, tam)
    R = tam * 0.43
    if fundo:
        c.ell(tam / 2, tam / 2, tam / 2 - 0.5, tam / 2 - 0.5, '#2a1f3d')
        c.ell(tam / 2, tam / 2, tam / 2 - max(1.5, tam / 28), tam / 2 - max(1.5, tam / 28), '#3a2c55')
    e = max(0.8, tam / 26)
    triskelion(c, tam / 2, tam / 2, R, '#ffe08a', e, borda='#b8733a' if tam >= 32 else None)
    triskelion(c, tam / 2 - e * 0.3, tam / 2 - e * 0.3, R, '#fff3c4', e * 0.4) if tam >= 48 else None
    return c


def fundo_titulo():
    W, H = 640, 360
    c = ceu(W, 250, ['#141226', '#1d1836', '#2a1f4a', '#45305f', '#7a4668', '#c26a5e', '#f0a25e'])
    full = C(W, H, '#141226')
    full.blit(c, 0, 0)
    c = full
    for k in range(150):                                   # estrelas
        x, y = int(rnd(k, 1, 31) * W), int(rnd(k, 2, 31) ** 1.6 * 170)
        c.px(x, y, ['#f4ecd8', '#ffe08a', '#b9a3e3'][k % 3])
        if k % 17 == 0:
            c.px(x - 1, y, '#8a7aa8').px(x + 1, y, '#8a7aa8').px(x, y - 1, '#8a7aa8').px(x, y + 1, '#8a7aa8')
    # o símbolo, discreto no céu
    triskelion(c, 320, 84, 54, '#3b2d5e', 3.2)
    triskelion(c, 320, 84, 54, '#4f3d78', 1.6)
    # sol poente e morros de Valesol
    c.ell(320, 250, 30, 30, '#ffd98a')
    for r, a in [(60, 26), (44, 40)]:
        c.ell(320, 250, r, r * 0.8, col('#ffb347', a))
    camadas = [(232, 12, 53, '#4a3560', 0), (246, 10, 37, '#33284d', 2), (262, 9, 29, '#231c3a', 4), (286, 7, 23, '#181428', 6)]
    for i, (base, amp, per, cor, fase) in enumerate(camadas):
        for x in range(W):
            h = int(base + amp * math.sin(x / per + fase) + 3 * math.sin(x / 11 + fase * 2))
            c.rect(x, h, 1, H - h, cor)
            if i == 2 and x % 7 < 4:                       # fileiras de café na encosta
                for y in range(h + 5, min(H, h + 30), 6):
                    c.px(x, y, '#2e2748')
    # a vila, com janelas acesas
    for k, x in enumerate(range(236, 410, 17)):
        y = 250 + (k * 5) % 7
        w = 11 + (k % 3) * 2
        c.rect(x, y, w, 9, '#2b2244').rect(x - 1, y - 4, w + 2, 4, '#3d2f55')
        c.rect(x + 2 + (k % 2) * 4, y + 3, 2, 3, '#ffd98a')
    c.rect(326, 232, 5, 22, '#2b2244').rect(325, 228, 7, 4, '#3d2f55').px(328, 236, '#ffe27a')
    for k in range(4):                                     # fumaça branca de chaminé (manhã/tarde em paz)
        c.ell(262 + k * 2, 240 - k * 6, 2 + k * 0.7, 1.6 + k * 0.5, '#6a5a8580')
    # árvores e bambus em silhueta na frente
    for (tx, th) in [(40, 120), (92, 80), (585, 130), (530, 76)]:
        c.rect(tx - 3, H - th, 6, th, '#0f0d1c')
        for (dx, dy, r) in [(0, 0, 30), (-22, 14, 20), (22, 12, 22), (-8, -18, 18), (12, -14, 16)]:
            c.ell(tx + dx * th / 120, H - th + dy * th / 120, r * th / 120, r * 0.85 * th / 120, '#0f0d1c')
    for k in range(26):                                    # vaga-lumes
        x, y = int(rnd(k, 5, 9) * W), 262 + int(rnd(k, 6, 9) * 90)
        c.px(x, y, '#ffe08a')
        c.px(x + 1, y, '#ffe08a60').px(x - 1, y, '#ffe08a60').px(x, y - 1, '#ffe08a60').px(x, y + 1, '#ffe08a60')
    return c


def cartao():
    """Fundo do cartão TRISKELION: escuro, com o símbolo bem discreto ao fundo."""
    c = C(640, 360, '#0b0a12')
    for y in range(360):
        for x in range(640):
            d = ((x - 320) / 380) ** 2 + ((y - 170) / 240) ** 2
            if d < 1 and (x + y) % 2 == 0 and d > 0.55 or d <= 0.55:
                c.p[x, y] = col(mix('#1d1730', '#0b0a12', min(1, d * 1.2)))
    triskelion(c, 320, 170, 120, '#1f1936', 7)
    triskelion(c, 320, 170, 120, '#2a2148', 3.5)
    for k in range(40):
        c.px(int(rnd(k, 1, 4) * 640), int(rnd(k, 2, 4) * 360), '#4a3d6a')
    return c


def main():
    os.makedirs(IMG, exist_ok=True)
    fundo_titulo().save(os.path.join(IMG, 'titulo_fundo.png'))
    cartao().save(os.path.join(IMG, 'cartao_titulo_fundo.png'))
    simbolo(64, False).save(os.path.join(IMG, 'simbolo_triskelion.png'))
    simbolo(32, False).save(os.path.join(IMG, 'simbolo_triskelion_32.png'))
    ic = os.path.join(RAIZ, 'assets', 'icons')
    os.makedirs(ic, exist_ok=True)
    base = simbolo(64)
    base.save(os.path.join(ic, 'icone_64.png'))
    for t in (192, 512):
        base.scale(t // 64).save(os.path.join(ic, f'icone_{t}.png'))
    simbolo(32).save(os.path.join(ic, 'favicon_32.png'))
    simbolo(16).save(os.path.join(ic, 'favicon_16.png'))
    # prévia: fundo + título em letras de bloco (o motor desenha o texto de verdade)
    prev = fundo_titulo()
    prev.scale(2).save(os.path.join(RAIZ, 'docs', 'arte', 'capturas', 'titulo_fundo.png'))
    p2 = Image.new('RGBA', (512 + 64 + 192 + 40, 532), (59, 42, 53, 255))
    p2.alpha_composite(Image.open(os.path.join(ic, 'icone_512.png')), (10, 10))
    p2.alpha_composite(Image.open(os.path.join(ic, 'icone_192.png')), (532, 10))
    p2.alpha_composite(base.im, (532, 212))
    p2.alpha_composite(simbolo(32).im, (610, 212))
    p2.alpha_composite(simbolo(16).im, (650, 212))
    p2.alpha_composite(simbolo(64, False).scale(3).im, (532, 300))
    p2.save(os.path.join(RAIZ, 'docs', 'arte', 'capturas', 'icone.png'))
    print('titulo ok')


if __name__ == '__main__':
    main()
