"""Tilesets `tiles_fogo`, `tiles_tunel` e `tiles_panorama`."""
import math, os
from px import C, T, Sheet, col, mix, mul, rnd, OUT, OUT2, RAIZ
import tex
from tex import tile
from ext_vila import MAD, MADE, PED


# ---------------------------------------------------------------- fogo

def chama(quadro, negro=False, alto=False):
    H = 32 if alto else 16
    c = C(16, H)
    cores = ['#1a1423', '#2d1f3d', '#4a2a66', '#7b3fa0', '#b06fd8'] if negro else ['#e8452c', '#ff7a2f', '#ffb347', '#ffe27a', '#fff3c4']
    base = H - 2
    alt = H - 4
    for x in range(1, 15):
        fx = (x - 7.5) / 6.5
        h = alt * (1 - fx * fx) * (0.72 + 0.28 * math.sin(x * 1.7 + quadro * 2.1)) + (rnd(x, quadro, 3) - 0.5) * 3
        for k in range(int(max(1, h))):
            y = base - k
            t = k / max(1, h)
            d = abs(fx) * 0.9 + t * 0.9 + (rnd(x, y + quadro * 7, 5) - 0.5) * 0.25
            if negro:   # miolo escuro, borda roxa
                i = 0 if d < 0.55 else 1 if d < 0.8 else 2 if d < 1.0 else 3
                if t > 0.92:
                    i = 4
            else:       # miolo claro, borda vermelha
                i = 4 if d < 0.35 else 3 if d < 0.6 else 2 if d < 0.85 else 1 if d < 1.1 else 0
            c.px(x, y, cores[i])
    # fagulhas
    for k in range(3):
        x = 3 + int(rnd(k, quadro, 9) * 10)
        y = int(rnd(k, quadro, 10) * (H // 3))
        c.px(x, y, cores[3] if negro else cores[2])
    return c


def brasas(seed):
    c = C(16, 16)
    for k in range(10):
        x, y = 1 + int(rnd(k, 1, seed) * 14), 4 + int(rnd(k, 2, seed) * 11)
        c.px(x, y, ['#e8452c', '#ff7a2f', '#ffb347'][k % 3])
        if k % 3 == 0:
            c.px(x + 1, y, '#5e4a4d').px(x, y + 1, '#453639')
    return c


def fumaca(quadro, negra=True):
    c = C(16, 32)
    b, l = ('#3a2d32c8', '#5e4a4dc8') if negra else ('#cfc6bac0', '#f4efe6c0')
    for k, (cx, cy, r) in enumerate([(8, 27, 4), (9, 20, 5), (7, 12, 5.5), (9, 5, 4.5)]):
        ox = math.sin(quadro * 2.1 + k) * 1.5
        c.ell(cx + ox, cy - quadro, r, r * 0.85, b)
        c.ell(cx + ox - 1, cy - quadro - 1, r * 0.5, r * 0.4, l)
    return c


def mancha_negra(seed):
    """Fuligem do fogo negro: 'suja o que toca'."""
    c = C(16, 16)
    for y in range(16):
        for x in range(16):
            d = ((x - 7.5) / 7) ** 2 + ((y - 8) / 6) ** 2 + (rnd(x, y, seed) - 0.5) * 0.8
            if d < 0.5:
                c.px(x, y, '#1a1423c0')
            elif d < 0.85:
                c.px(x, y, '#2d1f3d90')
            elif d < 1.0 and rnd(x, y, seed + 1) < 0.5:
                c.px(x, y, '#7b3fa080')
    return c


def cinza_caindo(q):
    c = C(16, 16)
    for k in range(6):
        x = int(rnd(k, 1, 4) * 16)
        y = (int(rnd(k, 2, 4) * 16) + q * 5) % 16
        c.px(x, y, ['#cfc6bad0', '#93887fd0', '#f4efe6d0'][k % 3])
    return c


def fogo():
    s = Sheet('tiles_fogo', 12)
    nota = ('Tiles ANIMADOS (formato do Tiled, já no JSON do tileset): ponha no mapa sempre o **quadro 1**; os quadros 2 e 3 também podem ser usados parados para variar. '
            'Os mesmos quadros existem como spritesheets em `assets/sprites/fx_*.png` (ver docs/status/arte.md). '
            'Estas cores não escurecem: o fogo "acende" a cena da noite. Tudo passável, exceto onde indicado; '
            'para bloquear o caminho com fogo, use a versão alta na camada de objetos.')
    s.section('Fogo comum (alaranjado)', nota)
    for q in range(3):
        s.add(f'fogo_{q + 1}', chama(q), f'Fogo baixo, quadro {q + 1}.', col=True)
    for q in range(3):
        s.add(f'fogo_alto_{q + 1}', chama(q, alto=True), f'Labareda alta (1×2), quadro {q + 1}.', col=['.', 'x'], acima=['x', '.'])
    s.add('brasas_1', brasas(1), 'Brasas no chão (camada `chao2`).')
    s.add('brasas_2', brasas(2), 'Brasas (variação).')
    s.section('Fogo negro Caligosuin (preto com borda roxa)')
    for q in range(3):
        s.add(f'fogo_negro_{q + 1}', chama(q, True), f'Fogo negro baixo, quadro {q + 1}.', col=True)
    for q in range(3):
        s.add(f'fogo_negro_alto_{q + 1}', chama(q, True, True), f'Labareda negra alta (1×2), quadro {q + 1}.', col=['.', 'x'], acima=['x', '.'])
    s.add('mancha_negra_1', mancha_negra(1), 'Fuligem do fogo negro no chão/parede (camada `chao2`).')
    s.add('mancha_negra_2', mancha_negra(2), 'Fuligem (variação).')
    s.section('Fumaça e cinzas (camada `acima`)')
    for q in range(3):
        s.add(f'fumaca_preta_{q + 1}', fumaca(q), f'Coluna de fumaça preta (1×2), quadro {q + 1}.', acima=True)
    for q in range(3):
        s.add(f'cinzas_caindo_{q + 1}', cinza_caindo(q), f'Cinzas caindo, quadro {q + 1}: espalhe pela camada `acima`.', acima=True)
    for base in ('fogo', 'fogo_alto', 'fogo_negro', 'fogo_negro_alto', 'fumaca_preta', 'cinzas_caindo'):
        s.animar([f'{base}_{q}' for q in (1, 2, 3)], 160 if 'fumaca' not in base and 'cinzas' not in base else 220)
    return s


# ---------------------------------------------------------------- túnel

ROCHA = dict(b='#6f6a78', e='#57525f', l='#8a8592', o='#3b3442')


def rocha_face():
    """Parede de pedra do túnel 3×2 (L, M, R × cima, baixo)."""
    c = C(48, 32)
    for y in range(32):
        for x in range(48):
            fy = y // 6
            lx = (x + fy * 5) % 11
            v = ROCHA['b']
            if y % 6 == 5 or lx == 10:
                v = ROCHA['e']
            elif y % 6 == 0:
                v = ROCHA['l'] if rnd(x // 3, fy, 2) > 0.4 else ROCHA['b']
            elif rnd(x, y, 3) < 0.07:
                v = ROCHA['e']
            c.p[x, y] = col(v)
    c.rect(0, 0, 48, 2, ROCHA['o']).rect(0, 29, 48, 3, ROCHA['e']).rect(0, 31, 48, 1, ROCHA['o'])
    for x in (4, 19, 33, 42):   # umidade escorrendo
        c.rect(x, 3, 1, 8 + (x % 5), '#5d7a99')
    c.rect(0, 0, 2, 32, ROCHA['o']).rect(46, 0, 2, 32, ROCHA['o'])
    return c


def rocha_topo():
    c = C(48, 48, ROCHA['o'])
    for y in range(48):
        for x in range(48):
            if rnd(x, y, 6) < 0.06:
                c.p[x, y] = col('#4a4352')
    c.rect(16, 16, 16, 16, '#2b2530')
    c.rect(13, 13, 22, 1, ROCHA['e']).rect(13, 34, 22, 1, ROCHA['e']).rect(13, 13, 1, 22, ROCHA['e']).rect(34, 13, 1, 22, ROCHA['e'])
    return c


def raiz(tipo):
    c = C(16, 16)
    b, l = '#7a5a3f', '#9c7a58'
    if tipo == 'parede':
        for (x0, w) in [(3, 2), (8, 3), (13, 1)]:
            for y in range(16):
                x = x0 + int(math.sin(y * 0.6 + x0) * 1.5)
                c.rect(x, y, w, 1, b)
                c.px(x, y, l)
        c.line(9, 6, 5, 11, b).line(10, 9, 14, 14, b)
    elif tipo == 'chao':
        c.line(0, 4, 6, 8, b).line(6, 8, 10, 7, b).line(10, 7, 15, 11, b).line(6, 8, 7, 14, b)
        c.line(0, 3, 6, 7, l)
    else:  # pendente
        for (x, h) in [(2, 9), (6, 13), (10, 6), (13, 10)]:
            c.rect(x, 0, 1, h, b).px(x, h, l)
    return c.outline('#4a3129')


def canaleta(tipo):
    c = tile(tex.pedra(9))
    c.rect(0, 5, 16, 6, '#4a4352').rect(0, 5, 16, 1, '#3b3442').rect(0, 10, 16, 1, '#8a8592')
    for x in range(2, 16, 5):
        c.px(x, 8, '#57525f')
    if tipo == 'L':
        c.rect(0, 4, 3, 8, tex.pedra(9)(1, 1)).rect(3, 5, 1, 6, '#3b3442')
    if tipo == 'R':
        c.rect(13, 4, 3, 8, tex.pedra(9)(1, 1)).rect(12, 5, 1, 6, '#8a8592')
    return c


def teia(lado):
    c = C(16, 16)
    f = '#d6d2dcb0'
    for k in range(0, 14, 3):
        c.line(0, k, 13 - k, 0, f)
    c.line(0, 0, 11, 11, f).line(0, 0, 5, 13, f).line(0, 0, 13, 5, f)
    return c if lado == 'no' else c.flip()


def cavalinho():
    c = C(16, 16)
    c.sombra_chao(8, 14, 6, 1.5)
    c.rect(4, 7, 8, 4, '#e3c66a').rect(4, 7, 8, 1, '#f2dc8c')        # corpo de sabugo
    for x in range(5, 12, 2):
        c.px(x, 9, '#c9a84e')
    c.rect(11, 3, 3, 5, '#e3c66a').px(14, 4, '#e3c66a').px(12, 4, OUT)  # cabeça
    c.px(11, 2, '#8cc063').px(12, 2, '#8cc063')                          # orelhas de palha
    for x in (5, 10):
        c.rect(x, 11, 1, 3, MADE['b'])
    c.px(3, 7, '#8cc063').px(2, 8, '#8cc063').px(3, 9, '#8cc063')        # rabo de palha
    return c.outline(OUT2)


def poca():
    c = C(16, 16)
    c.ell(8, 9, 6, 3.5, '#5d7a99b0').ell(7, 8.5, 3, 1.5, '#8fb0ccb0').px(10, 10, '#cfe0ee')
    return c


def gota(q):
    c = C(16, 16)
    c.px(8, [2, 7, 12][q], '#8fb0cc').px(8, [3, 8, 13][q], '#cfe0ee')
    if q == 2:
        c.px(6, 14, '#cfe0ee').px(10, 14, '#cfe0ee')
    return c


def escada_tunel():
    c = tile(tex.pedra(9))
    c.rect(2, 0, 12, 16, '#2b2530')
    c.rect(3, 0, 2, 16, MADE['b']).rect(11, 0, 2, 16, MADE['b']).rect(3, 0, 1, 16, MADE['l'])
    for y in (2, 6, 10, 14):
        c.rect(3, y, 10, 2, MAD['b']).rect(3, y, 10, 1, MAD['l'])
    return c


def pedras():
    c = C(16, 16)
    c.sombra_chao(8, 13, 6, 2)
    for (x, y, w, h) in [(2, 8, 6, 5), (8, 6, 6, 7), (6, 10, 4, 3)]:
        c.ell(x + w / 2, y + h / 2, w / 2, h / 2, ROCHA['b']).px(x + 1, y + 1, ROCHA['l'])
    return c.outline(ROCHA['o'])


def tunel():
    s = Sheet('tiles_tunel', 12)
    s.section('Túnel de pedra e raízes', 'O mapa do túnel usa `escuro: true`; o motor desenha a máscara com o círculo de luz. '
              'Receita: `rocha_topo` em volta (como a `moldura` dos interiores), `rocha_face` nas 2 linhas do fundo, piso de `pedra`.')
    for i, sd in enumerate((9, 19, 29)):
        s.add(f'pedra_{i + 1}', tile(tex.pedra(sd)), 'Chão de pedra úmida.')
    s.add('escada_saida', escada_tunel(), 'Escada de mão subindo (entrada pelo alçapão / saída para o bambuzal).')
    s.add('poca', poca(), 'Poça d\'água (camada `chao2`).')
    for q in range(3):
        s.add(f'goteira_{q + 1}', gota(q), f'Goteira, quadro {q + 1} (o quadro 1 é animado).')
    s.add('pedras_soltas', pedras(), 'Pedras soltas.', col=True)
    s.add('cavalinho_sabugo', cavalinho(), 'Cavalinho de sabugo de milho (`exame_brinquedo`, na reentrância).')
    s.add('rocha_topo', rocha_topo(), 'Rocha maciça vista de cima (3×3: cantos e lados; centro = breu).', col=True)
    s.add('rocha_face', rocha_face(), 'Parede de pedra do fundo (3×2).', col=True)
    s.add('canaleta_L', canaleta('L'), 'Canaleta seca: ponta esquerda (chão).')
    s.add('canaleta_M', canaleta('M'), 'Canaleta seca: meio (repete).')
    s.add('canaleta_R', canaleta('R'), 'Canaleta seca: ponta direita.')
    s.add('raiz_parede', raiz('parede'), 'Raízes descendo pela parede (sobre `rocha_face`).', col=True)
    s.add('raiz_chao', raiz('chao'), 'Raiz atravessando o chão (camada `chao2`).')
    s.add('raiz_pendente', raiz('pend'), 'Raízes pendendo do teto (camada `acima`).', acima=True)
    s.add('teia_no', teia('no'), 'Teia no canto de cima à esquerda (camada `acima`).', acima=True)
    s.add('teia_ne', teia('ne'), 'Teia no canto de cima à direita (camada `acima`).', acima=True)
    s.animar(['goteira_1', 'goteira_2', 'goteira_3', 'goteira_3'], 260)
    return s


# ---------------------------------------------------------------- panoramas

def ceu(w, h, cores):
    c = C(w, h)
    n = len(cores) - 1
    for y in range(h):
        t = y / (h - 1) * n
        i = min(n - 1, int(t))
        f = t - i
        # faixas com pontilhado em vez de degradê liso (cara de pixel art)
        f = 0 if f < 0.33 else 1 if f > 0.66 else None
        for x in range(w):
            ff = f if f is not None else (1 if (x + y) % 2 else 0)
            c.p[x, y] = col(cores[i + int(ff)])
    return c


def pan_capital():
    """Capital ao longe, à noite: muralha, clarões nos portões e a torre com um ponto de luz."""
    W, H = 320, 96
    c = ceu(W, H, ['#1b1830', '#241f3f', '#33294f', '#4a3560'])
    for k in range(70):
        x, y = int(rnd(k, 1, 8) * W), int(rnd(k, 2, 8) * 50)
        c.px(x, y, '#f4ecd8' if k % 4 else '#ffe27a')
    # clarões no horizonte
    for (gx, cor) in [(92, '#fff3c4'), (228, '#b06fd8'), (160, '#fff3c4')]:
        for r, a in [(26, 28), (18, 46), (10, 70)]:
            c.ell(gx, 74, r, r * 0.55, col(cor, a))
    # morros
    for x in range(W):
        h1 = int(70 + 5 * math.sin(x / 31) + 3 * math.sin(x / 11 + 2))
        c.rect(x, h1, 1, H - h1, '#2a2342')
    # muralha e torres
    mur = '#4d4470'
    c.rect(40, 66, 240, 14, mur)
    for x in range(40, 280, 6):
        c.rect(x, 64, 3, 2, mur)
    for tx, th, tw in [(60, 20, 10), (120, 16, 8), (200, 16, 8), (252, 22, 10)]:
        c.rect(tx, 80 - th - 14, tw, th + 14, mur).rect(tx - 1, 80 - th - 16, tw + 2, 3, mur)
        c.px(tx + tw // 2, 80 - th - 8, '#ffd98a')
    # a torre alta
    c.rect(154, 18, 12, 62, '#584c7c').rect(152, 14, 16, 5, '#584c7c')
    for k in range(8):
        c.rect(159 - k // 2, 13 - k, 2 + k, 1, '#584c7c') if k < 7 else None
    c.px(160, 22, '#fff3c4').px(159, 22, '#ffe27a').px(161, 22, '#ffe27a').px(160, 21, '#ffe27a').px(160, 23, '#ffe27a')
    for r, a in [(6, 30), (3, 60)]:
        c.ell(160.5, 22.5, r, r, col('#ffe27a', a))
    # janelinhas e portões
    for k in range(26):
        c.px(46 + int(rnd(k, 3, 2) * 228), 68 + int(rnd(k, 4, 2) * 9), '#ffd98a')
    c.rect(88, 72, 8, 8, '#fff3c4').rect(224, 72, 8, 8, '#7b3fa0').rect(226, 74, 4, 6, '#b06fd8')
    # bambus em silhueta na frente
    for x in list(range(0, 36, 5)) + list(range(288, 320, 5)):
        hh = 30 + int(rnd(x, 0, 3) * 50)
        c.rect(x, H - hh, 2, hh, '#141224')
        for y in range(H - hh, H, 9):
            c.line(x, y, x + (5 if x % 2 else -5), y - 3, '#141224')
    c.rect(0, 90, W, 6, '#141224')
    return c


def pan_vila():
    """Vista do cafezal: vales ensolarados, Valesol ao longe e a coluna de fumaça."""
    W, H = 320, 96
    c = ceu(W, H, ['#f7c873', '#f9d98c', '#fbe6a8', '#fdf0c4'])
    c.ell(250, 30, 9, 9, '#fff6d6')
    for r, a in [(20, 40), (14, 60)]:
        c.ell(250, 30, r, r, col('#fff6d6', a))
    for (cx, cy, w) in [(40, 20, 22), (190, 14, 30), (120, 34, 18)]:
        c.ell(cx, cy, w, 4, '#fff1d0').ell(cx + 6, cy - 3, w * 0.6, 3, '#fff8e6')
    for i, (base, amp, cor) in enumerate([(56, 8, '#c9cf8e'), (66, 6, '#a9c474'), (76, 5, '#8cc063')]):
        for x in range(W):
            h = int(base + amp * math.sin(x / (37 - i * 6) + i * 2) + 2 * math.sin(x / 9 + i))
            c.rect(x, h, 1, H - h, cor)
            if i == 2 and x % 6 < 4 and h + 6 < H:      # fileiras de café nas encostas
                for y in range(h + 4, H, 5):
                    c.px(x, y, '#5fa052')
    # a vila
    for k, x in enumerate(range(118, 190, 10)):
        y = 62 + (k % 3)
        c.rect(x, y, 8, 5, '#f4ead8').rect(x - 1, y - 3, 10, 3, '#cf7350').px(x + 3, y + 2, '#6b8fb0')
    c.rect(150, 52, 4, 12, '#f4ead8').rect(149, 49, 6, 3, '#cf7350')
    # coluna de fumaça
    for k in range(16):
        y = 50 - k * 3
        x = 168 + int(4 * math.sin(k / 2.5)) + k // 3
        r = 2 + k * 0.45
        c.ell(x, y, r, r * 0.8, '#5e4a4de0')
        c.ell(x - 1, y - 1, r * 0.5, r * 0.4, '#85737ae0')
    c.px(168, 56, '#7b3fa0').px(169, 55, '#b06fd8').px(167, 57, '#ff7a2f')
    return c


def pan_ceu_tarde():
    c = ceu(320, 48, ['#5b4a7a', '#8a5a86', '#d9825e', '#f2b266', '#f7d58a'])
    for (cx, cy, w) in [(60, 30, 26), (200, 22, 34), (290, 36, 20)]:
        c.ell(cx, cy, w, 3, '#f6c9a0').ell(cx + 5, cy - 2, w * 0.5, 2, '#fde3c0')
    return c


def panorama():
    s = Sheet('tiles_panorama', 20)
    s.section('Panoramas (fundos de mirante)', 'Imagens grandes fatiadas em tiles: copie o bloco inteiro para a linha de cima do mapa (camada `chao`, '
              'atrás de tudo) e torne a faixa sólida. As mesmas imagens estão inteiras em `assets/images/pan_*.png`.')
    s.add('pan_capital', pan_capital(), 'Bambuzal: a capital ao longe, com clarões brancos e roxos nos portões e a torre com um ponto de luz (`marcador_bambuzal_vista_capital`).', col=True)
    s.add('pan_vila', pan_vila(), 'Cafezal: os vales de Valesol e a coluna de fumaça (`marcador_cafezal_vista_vila`).', col=True)
    s.add('pan_ceu_tarde', pan_ceu_tarde(), 'Céu de fim de tarde, laranja → roxo (estrada).', col=True)
    for it in s.itens:
        it['c'].save(os.path.join(RAIZ, 'assets', 'images', it['nome'] + '.png'))
    return s


if __name__ == '__main__':
    for s in (fogo(), tunel(), panorama()):
        s.export()
        print(s.nome, 'ok', len(s.itens))
