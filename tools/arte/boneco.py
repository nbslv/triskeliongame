"""Gerador de personagens 16×24 (4 direções × 4 quadros) a partir de uma ficha de cores e traços.

Ficha (dict): pele, cabelo, estilo ('curto','despenteado','coque','trancas','careca'), chapeu
('palha','lenco','touca','elmo'), camisa, manga, calca, sapato, e extras: colete, avental, xadrez,
tabardo, faixa, xale, vestido, capa, barba, bigode, oculos, gordo, crianca, galinha, lanca, remendo.
"""
from px import C, col, mix, mul, OUT

PELES = {'clara': ('#f4cda5', '#dba983'), 'morena': ('#d19a6a', '#b07a4e'), 'escura': ('#94603f', '#774a30')}
OLHO = '#3b2a35'


def _cabelo(c, s, d, hy):
    cab = s.get('cabelo', '#6b4226')
    luz = mix(cab, '#ffffff', 0.28)
    esc = mul(cab, 0.8)
    est = s.get('estilo', 'curto')
    if est == 'careca':
        if d != 'up':
            c.rect(3, hy + 3, 1, 3, cab).rect(12, hy + 3, 1, 3, cab) if d == 'down' else c.rect(9, hy + 2, 4, 4, cab)
        else:
            c.rect(3, hy + 3, 10, 4, cab)
        return
    c.rect(5, hy, 6, 1, cab).rect(4, hy + 1, 8, 1, cab).rect(3, hy + 2, 10, 2, cab)
    c.rect(5, hy + 1, 3, 1, luz)
    if d == 'down':
        c.rect(3, hy + 4, 1, 3, cab).rect(12, hy + 4, 1, 3, cab)
        c.rect(4, hy + 4, 1, 1, cab).rect(11, hy + 4, 1, 1, cab)
    elif d == 'up':
        c.rect(3, hy + 4, 10, 5, cab).rect(4, hy + 9, 8, 1, esc)
        c.rect(3, hy + 8, 10, 1, esc)
    else:
        c.rect(7, hy + 4, 6, 3, cab).rect(9, hy + 7, 4, 2, cab).rect(10, hy + 8, 3, 1, esc)
        c.rect(3, hy + 4, 2, 1, cab)
    if est == 'despenteado':
        for x in ((5, 8, 11) if d != 'left' else (4, 8, 12)):
            c.px(x, hy - 1, cab)
        c.px(2, hy + 3, cab).px(13, hy + 2, cab)
        if d == 'down':
            c.rect(6, hy + 4, 2, 2, cab).px(8, hy + 4, cab)      # mecha no olho
        if d == 'left':
            c.rect(3, hy + 4, 2, 2, cab)
    if est == 'coque':
        if d == 'up':
            c.rect(6, hy + 2, 4, 4, esc).rect(7, hy + 3, 2, 2, luz)
        elif d == 'down':
            c.rect(6, hy - 2, 4, 2, cab).rect(7, hy - 2, 2, 1, luz)
        else:
            c.rect(11, hy, 3, 3, cab).px(12, hy, luz)
    if est == 'trancas':
        fita = s.get('fita', '#d8413a')
        if d in ('down', 'up'):
            for x in (2, 13):
                c.rect(x, hy + 5, 1, 6, cab).px(x, hy + 7, esc).px(x, hy + 9, esc).px(x, hy + 10, fita)
        else:
            c.rect(11, hy + 6, 2, 6, cab).px(11, hy + 8, esc).px(12, hy + 10, esc).rect(11, hy + 11, 2, 1, fita)
    if est == 'comprido':
        if d == 'down':
            c.rect(3, hy + 4, 1, 7, cab).rect(12, hy + 4, 1, 7, cab)
        elif d == 'up':
            c.rect(3, hy + 4, 10, 8, cab).rect(4, hy + 11, 8, 1, esc)
        else:
            c.rect(8, hy + 4, 5, 8, cab)


def _chapeu(c, s, d, hy):
    ch = s.get('chapeu')
    if ch == 'palha':
        b, l, e = '#e3c66a', '#f2dc8c', '#b8944e'
        tor = 1 if s.get('torto') and d == 'down' else 0
        c.rect(4, hy - 1, 8, 3, b).rect(5, hy - 1, 4, 1, l)
        c.rect(1, hy + 2 + tor, 14, 2, b).rect(1, hy + 2 + tor, 14, 1, l).rect(4, hy + 1, 8, 1, '#a85236')
        if tor:
            c.rect(1, hy + 2, 7, 1, b).clear(9, hy + 4, 6, 0)
    elif ch == 'lenco':
        b = s.get('cor_chapeu', '#c8372d')
        l, e = mix(b, '#ffffff', 0.3), mul(b, 0.78)
        c.rect(5, hy, 6, 1, b).rect(4, hy + 1, 8, 1, b).rect(3, hy + 2, 10, 2, b).rect(5, hy + 1, 3, 1, l)
        if d == 'up':
            c.rect(3, hy + 4, 10, 3, b).rect(6, hy + 7, 4, 2, e).px(5, hy + 8, b).px(10, hy + 8, b)
        elif d == 'down':
            c.rect(3, hy + 4, 1, 2, b).rect(12, hy + 4, 1, 2, b).px(8, hy + 2, '#f6f0e0').px(6, hy + 1, '#f6f0e0').px(10, hy + 3, '#f6f0e0')
        else:
            c.rect(7, hy + 4, 6, 2, b).rect(11, hy + 6, 3, 2, e)
    elif ch == 'touca':
        b, l, e = '#f6f0e0', '#ffffff', '#ddd0b8'
        c.rect(4, hy - 2, 8, 3, b).rect(3, hy - 1, 10, 2, b).rect(5, hy - 2, 4, 1, l).rect(3, hy + 1, 10, 2, b).rect(3, hy + 2, 10, 1, e)
    elif ch == 'elmo':
        b, l, e = '#a9b2bf', '#cfd6df', '#7d8794'
        c.rect(5, hy - 1, 6, 1, b).rect(4, hy, 8, 1, b).rect(3, hy + 1, 10, 3, b).rect(5, hy, 3, 1, l)
        c.rect(3, hy + 3, 10, 1, '#e0b83a')
        if d == 'down':
            c.rect(3, hy + 4, 1, 4, b).rect(12, hy + 4, 1, 4, b).rect(7, hy + 4, 2, 3, b)
        elif d == 'up':
            c.rect(3, hy + 4, 10, 5, b).rect(3, hy + 8, 10, 1, e)
        else:
            c.rect(6, hy + 4, 7, 4, b).rect(9, hy + 8, 4, 1, e).rect(3, hy + 4, 1, 2, b)
        c.px(8, hy - 2, '#e0b83a')


def boneco(s, d='down', f=0, pose=None):
    """Um quadro. d: down/left/right/up; f: 0 parado, 1 passo, 2 meio, 3 passo oposto."""
    if d == 'right':
        return boneco(s, 'left', f, pose).flip()
    c = C(16, 24)
    g = s.get
    pele, pele_e = PELES[g('pele', 'clara')]
    cr = g('crianca', False)
    gd = 1 if g('gordo') else 0
    bob = 1 if f in (1, 3) else 0
    TH, LH, FH = (5, 2, 1) if cr else (7, 3, 2)
    bra = 'baixo'
    if pose in ('ajoelhar', 'sentado', 'sentado_fechado', 'beber'):
        LH, FH = 1, 1
    if pose in ('agachar', 'encolhido'):
        TH, LH, FH = 5, 0, 1
    if pose in ('colher', 'erguer', 'erguer2', 'alerta'):
        bra = 'cima'
    if pose in ('conjurar', 'conjurar2', 'brilho', 'brilho2', 'colar', 'colar2', 'segurar', 'livro', 'beber', 'caixa', 'entregar', 'varrer', 'carimbar', 'empurrar'):
        bra = 'frente'
    hy = 23 - (10 + TH + LH + FH) + bob + (1 if pose in ('encolhido', 'erguer2') else 0)
    by = hy + 10
    ly = by + TH
    cam = g('camisa', '#f3e6c8')
    cam_e = mul(cam, 0.84)
    man = g('manga', cam)
    cal = g('calca', '#5b7fa6')
    cal_e = mul(cal, 0.82)
    sap = g('sapato', '#6b4226')

    # ---------- pernas e pés
    saia = g('vestido')
    if d in ('down', 'up'):
        e1 = 1 if f == 1 else 0   # perna esquerda levantada
        e3 = 1 if f == 3 else 0
        if LH:
            c.rect(5, ly, 6, 1, cal)
            c.rect(5, ly, 2 + gd, LH - e1, cal).rect(9 - gd, ly, 2 + gd, LH - e3, cal)
            c.rect(8, ly + 1, 0, 0, cal_e)
        c.rect(4, ly + LH - e1, 3, FH, sap).rect(9, ly + LH - e3, 3, FH, sap)
        if g('remendo') and LH and d == 'down':
            c.px(5, ly + 1, '#c9b48a')
    else:
        if f == 1:
            c.rect(5, ly, 2, LH, cal).rect(9, ly, 2, LH, cal_e) if LH else None
            c.rect(3, ly + LH, 4, FH, sap).rect(9, ly + LH - 1, 3, FH, sap)
            c.rect(6, ly, 4, 1, cal) if LH else None
        elif f == 3:
            c.rect(6, ly, 3, LH, cal).rect(8, ly, 2, max(0, LH - 1), cal_e) if LH else None
            c.rect(5, ly + LH, 4, FH, sap).rect(9, ly + LH - 1, 2, 1, sap)
        else:
            c.rect(6, ly, 4, LH, cal) if LH else None
            c.rect(5, ly + LH, 5, FH, sap)

    # ---------- tronco
    if d in ('down', 'up'):
        x0, w = 4 - gd, 8 + 2 * gd
        c.rect(x0, by, w, TH, cam)
        c.rect(x0, by + TH - 1, w, 1, cam_e)
        if g('xadrez'):
            for y in range(by, by + TH):
                for x in range(x0, x0 + w):
                    if (x % 3 == 0) or (y % 3 == 0):
                        c.px(x, y, g('xadrez'))
        if g('colete'):
            ct = g('colete')
            if d == 'down':
                c.rect(x0, by, 2, TH, ct).rect(x0 + w - 2, by, 2, TH, ct).px(x0 + 2, by, ct).px(x0 + w - 3, by, ct)
            else:
                c.rect(x0, by, w, TH, ct).rect(x0, by + TH - 1, w, 1, mul(ct, 0.8))
        if g('tabardo') and True:
            tb = g('tabardo')
            c.rect(x0 + 1, by, w - 2, TH + (1 if LH else 0), tb)
            c.rect(x0 + 1, by + TH - 1 + (1 if LH else 0), w - 2, 1, '#e0b83a')
            if d == 'down':
                c.rect(7, by + 2, 2, 2, '#e0b83a').px(7, by + 1, '#e0b83a').px(8, by + 4, '#e0b83a')
            if g('faixa'):
                for k in range(w - 2):
                    c.px(x0 + 1 + k, by + (k * (TH - 1)) // (w - 3), g('faixa'))
        if saia:
            c.rect(x0, by, w, TH, saia)
            c.rect(x0 - 1 if not cr else x0, ly - 1, w + (2 if not cr else 0), LH + 1, saia)
            c.rect(x0 - 1 if not cr else x0, ly + LH - 1, w + (2 if not cr else 0), 1, mul(saia, 0.82))
        if g('avental') and d == 'down':
            av = g('avental')
            c.rect(5, by + 1, 6, TH + LH - 1, av).rect(5, by + TH + LH - 1, 6, 1, mul(av, 0.86)).px(5, by, av).px(10, by, av)
        if g('avental') and d == 'up':
            c.rect(x0, by + 2, w, 1, g('avental')).rect(7, by + 2, 2, 3, g('avental'))
        if g('xale'):
            xl = g('xale')
            c.rect(x0 - 1, by, w + 2, 3, xl).rect(x0, by + 3, w, 1, mul(xl, 0.85))
            if d == 'down':
                c.rect(7, by, 2, 2, cam).px(7, by + 3, xl).px(8, by + 4, xl)
        if g('capa') and d == 'up':
            c.rect(x0, by, w, TH + 1, g('capa')).rect(x0, by + TH, w, 1, mul(g('capa'), 0.8))
        if g('colar') and d == 'down':
            c.px(7, by, '#8a6a55').px(8, by + 1, '#c9a3a8')
        # braços
        ax0, ax1 = x0 - 1, x0 + w
        if g('xale') and d in ('down', 'up'):
            pass
        ae = (1 if f == 1 else 0)
        ad = (1 if f == 3 else 0)
        if bra == 'baixo':
            c.rect(ax0, by + 1 + ae, 1, TH - 3, man).rect(ax1, by + 1 + ad, 1, TH - 3, man)
            c.rect(ax0, by + TH - 2 + ae, 1, 1, pele).rect(ax1, by + TH - 2 + ad, 1, 1, pele)
        elif bra == 'cima':
            c.rect(ax0, by - 2, 1, 4, man).rect(ax1, by - 2, 1, 4, man)
            c.rect(ax0, by - 4, 1, 2, pele).rect(ax1, by - 4, 1, 2, pele)
        else:  # mãos juntas à frente do peito
            c.rect(ax0, by + 1, 1, 2, man).rect(ax1, by + 1, 1, 2, man)
            if d == 'down':
                c.rect(x0 + 1, by + 3, 2, 1, man).rect(x0 + w - 3, by + 3, 2, 1, man)
                c.rect(6, by + 3, 4, 1, pele)
    else:
        x0, w = 5 - gd, 6 + gd
        c.rect(x0, by, w, TH, cam).rect(x0, by + TH - 1, w, 1, cam_e)
        if g('xadrez'):
            for y in range(by, by + TH):
                for x in range(x0, x0 + w):
                    if (x % 3 == 0) or (y % 3 == 0):
                        c.px(x, y, g('xadrez'))
        if g('colete'):
            c.rect(x0 + 2, by, w - 2, TH, g('colete'))
        if g('tabardo'):
            c.rect(x0, by, w, TH + (1 if LH else 0), g('tabardo')).rect(x0, by + TH - 1 + (1 if LH else 0), w, 1, '#e0b83a')
            if g('faixa'):
                c.rect(x0, by + 2, w, 1, g('faixa'))
        if saia:
            c.rect(x0, by, w, TH, saia).rect(x0 - 1, ly - 1, w + 2, LH + 1, saia).rect(x0 - 1, ly + LH - 1, w + 2, 1, mul(saia, 0.82))
        if g('avental'):
            c.rect(x0, by + 1, 2, TH + LH - 1, g('avental'))
        if g('xale'):
            c.rect(x0 - 1, by, w + 2, 3, g('xale'))
        if g('capa'):
            c.rect(x0 + w - 1, by, 2, TH + 1, g('capa'))
        man_e = mul(man, 0.86)
        if bra == 'baixo':
            dx = {1: -1, 3: 1}.get(f, 0)
            c.rect(7 + dx, by + 1, 2, TH - 3, man_e).rect(7 + dx, by + TH - 2, 2, 1, pele)
        elif bra == 'cima':
            c.rect(5, by - 2, 2, 4, man_e).rect(5, by - 4, 2, 2, pele)
        else:
            c.rect(4, by + 2, 4, 2, man_e).rect(2, by + 2, 2, 2, pele)

    # ---------- cabeça
    if d == 'down':
        c.rect(4, hy + 3, 8, 6, pele).rect(5, hy + 9, 6, 1, pele).rect(3, hy + 4, 1, 4, pele).rect(12, hy + 4, 1, 4, pele)
        c.rect(5, hy + 9, 6, 1, pele_e)
        fechado = pose in ('sentado_fechado', 'encolhido')
        for x in (5, 10):
            if fechado:
                c.px(x, hy + 7, OLHO)
            else:
                c.rect(x, hy + 6, 1, 2, OLHO)
        c.px(4, hy + 8, mix(pele, '#e8607a', 0.35)).px(11, hy + 8, mix(pele, '#e8607a', 0.35))
        if g('barba'):
            c.rect(4, hy + 8, 8, 1, g('barba')).rect(5, hy + 9, 6, 1, g('barba')).rect(6, hy + 8, 4, 1, pele)
        if g('bigode'):
            c.rect(5, hy + 8, 6, 1, g('bigode')).px(4, hy + 9, g('bigode')).px(11, hy + 9, g('bigode'))
        if g('oculos'):
            c.rect(4, hy + 6, 3, 1, '#c9c4c0').rect(9, hy + 6, 3, 1, '#c9c4c0').px(7, hy + 6, '#8e8a8a').px(8, hy + 6, '#8e8a8a')
            c.px(5, hy + 7, OLHO).px(10, hy + 7, OLHO).px(5, hy + 6, '#c9c4c0').px(10, hy + 6, '#c9c4c0')
    elif d == 'up':
        c.rect(4, hy + 3, 8, 6, pele).rect(5, hy + 9, 6, 1, pele_e).rect(3, hy + 4, 1, 4, pele).rect(12, hy + 4, 1, 4, pele)
    else:
        c.rect(3, hy + 3, 9, 6, pele).rect(4, hy + 9, 6, 1, pele_e).px(2, hy + 7, pele)
        c.rect(4, hy + 6, 1, 2, OLHO)
        c.px(5, hy + 8, mix(pele, '#e8607a', 0.35))
        if g('barba'):
            c.rect(3, hy + 8, 5, 2, g('barba'))
        if g('bigode'):
            c.rect(2, hy + 8, 4, 1, g('bigode'))
        if g('oculos'):
            c.rect(3, hy + 6, 3, 1, '#c9c4c0').px(4, hy + 7, OLHO)
    _cabelo(c, s, d, hy)
    _chapeu(c, s, d, hy)

    # ---------- acessórios
    if g('galinha') and pose is None:
        gx = {'down': 11, 'up': 1, 'left': 3}[d]
        c.rect(gx, by + 2, 4, 3, '#f6f0e0').rect(gx + (0 if d != 'up' else 2), by + 1, 2, 2, '#f6f0e0')
        if d != 'up':
            c.px(gx, by, '#d8413a').px(gx - 1 if d == 'left' else gx + 2, by + 2, '#e8884a').px(gx + (0 if d == 'left' else 1), by + 1, OLHO)
    if g('lanca'):
        lx = {'down': 14, 'up': 1, 'left': 12}[d]
        c.rect(lx, 3, 1, 20, '#8a5f41')
        c.rect(lx, 1, 1, 3, '#cfd6df').px(lx, 0, '#a9b2bf')
    c.outline(OUT)

    # ---------- efeitos de pose (por cima do contorno)
    if pose in ('brilho', 'brilho2', 'conjurar2') and d == 'down':
        k = 1 if pose == 'brilho2' else 0
        cor = ['#ffe08a', '#fff3c4']
        if pose == 'conjurar2':
            c.px(7, by + 2, '#ffe08a').px(8, by + 2, '#ffe08a')
        else:
            c.rect(6 - k, by + 1, 4 + 2 * k, 3, cor[0]).rect(7, by + 2, 2, 1, cor[1])
            for (x, y) in [(4 - k, by - 1), (11 + k, by), (7, by - 2 - k), (9, by + 5 + k)]:
                c.px(x, y, cor[k])
    if pose in ('colar', 'colar2') and d == 'down':
        k = 1 if pose == 'colar2' else 0
        c.rect(7, by + 1, 2, 2, '#fff3c4')
        for (x, y) in [(6 - k, by + 1), (9 + k, by + 2), (7, by - k), (8, by + 3 + k)]:
            c.px(x, y, '#ffe08a')
    if pose == 'segurar' and d == 'down':
        c.px(7, by + 2, '#c9a3a8').px(8, by + 2, '#8a6a55')
    if pose == 'livro' and d == 'down':
        c.rect(5, by + 2, 6, 4, '#a52a33').rect(5, by + 2, 6, 1, '#c8545a').rect(10, by + 3, 1, 3, '#f6f0e0')
    if pose == 'beber' and d == 'down':
        c.rect(6, by - 1, 4, 3, '#f3e6c8').px(10, by, '#f3e6c8').rect(6, by - 1, 4, 1, '#ddd0b8')
    if pose in ('caixa', 'entregar') and d == 'down':
        yy = by + (2 if pose == 'caixa' else 4)
        c.rect(5, yy, 6, 4, '#a3553a').rect(5, yy, 6, 1, '#c8774f').px(8, yy + 2, '#ffe08a').rect(4, yy, 1, 4, OUT).rect(11, yy, 1, 4, OUT).rect(5, yy + 4, 6, 1, OUT)
    if pose == 'varrer' and d == 'down':
        c.rect(12, by - 2, 1, 12, '#8a5f41').rect(11, by + 10, 3, 3, '#e3c66a')
    if pose == 'carimbar' and d == 'down':
        c.rect(6, by + 4, 3, 2, '#7a2e3b').rect(7, by + 2, 1, 2, '#8a5f41')
    return c


def folha(s, quadros=4):
    """Spritesheet do motor: 4 linhas (baixo, esquerda, direita, cima) × 4 colunas (0 = parado)."""
    sh = C(16 * quadros, 24 * 4)
    for r, d in enumerate(('down', 'left', 'right', 'up')):
        for f in range(quadros):
            sh.blit(boneco(s, d, f), f * 16, r * 24)
    return sh
