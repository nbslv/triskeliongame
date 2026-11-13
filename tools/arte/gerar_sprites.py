"""Gera assets/sprites/*.png (personagens, Caligosuins, poses, objetos animados, efeitos),
ícones e emotes em assets/images/, e a prancha docs/arte/capturas/sprites.png.

Uso: python3 tools/arte/gerar_sprites.py
"""
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from PIL import Image
from px import C, RAIZ, col, mix, mul, rnd, OUT, OUT2
from boneco import boneco, folha
import tiles_outros
from ext_vila import barril, MAD, MADE
from tiles_interior import mesinha_caixa

SPR = os.path.join(RAIZ, 'assets', 'sprites')
IMG = os.path.join(RAIZ, 'assets', 'images')

# ------------------------------------------------------------------ fichas (ids do roteiro)
FICHAS = {
    'icaro': dict(cabelo='#e8c55a', estilo='despenteado', camisa='#f3e6c8', colete='#6b4226', calca='#5b7fa6', sapato='#6b4226', remendo=True, colar=True),
    'tonho': dict(pele='morena', cabelo='#4a3129', chapeu='palha', torto=True, camisa='#7d8a45', calca='#8a6a4a', sapato='#5a4033'),
    'zefa': dict(pele='morena', cabelo='#8e8a8a', chapeu='lenco', cor_chapeu='#c8372d', camisa='#c9a05a', avental='#b9a67c', vestido='#8a5f41', gordo=True, sapato='#5a4033'),
    'pai': dict(cabelo='#a9a6a3', camisa='#b8c4cf', xadrez='#8f6f6a', barba='#c9c4c0', calca='#6b5a4a', sapato='#5a4033'),
    'juca': dict(cabelo='#6b4226', chapeu='touca', bigode='#f6f0e0', camisa='#b9cbd9', avental='#f6f0e0', calca='#8a6a4a', gordo=True, sapato='#5a4033'),
    'ermelinda': dict(cabelo='#c9c4c0', estilo='coque', oculos=True, camisa='#7a6a8a', xale='#9a9aa3', vestido='#5e5470', sapato='#4a3129'),
    'custodia': dict(cabelo='#d6d2dc', estilo='coque', camisa='#e8d8c0', xale='#b9a3e3', vestido='#8a7aa8', galinha=True, sapato='#4a3129'),
    'nina': dict(pele='morena', cabelo='#4a3129', estilo='trancas', camisa='#ffd23f', vestido='#ffd23f', crianca=True, sapato='#8a5f41'),
    'aldeao': dict(cabelo='#8a5f41', camisa='#c96a4a', calca='#6b5a4a', sapato='#5a4033', barba='#8a5f41'),
    'aldea': dict(pele='morena', cabelo='#5a3a2a', estilo='comprido', camisa='#f3e6c8', vestido='#6fa08a', avental='#f3e6c8', sapato='#5a4033'),
    'aldeao_2': dict(pele='escura', cabelo='#2b1f2a', chapeu='palha', camisa='#e8d8c0', calca='#5b7fa6', sapato='#5a4033'),
    'sobrevivente_1': dict(pele='morena', cabelo='#4a3129', camisa='#8a9a6a', calca='#7a6a5a', sapato='#5a4033', bigode='#4a3129'),
    'sobrevivente_2': dict(cabelo='#b0763f', estilo='coque', camisa='#d98aa8', vestido='#a85a6a', sapato='#5a4033'),
    'soldado_1': dict(cabelo='#6b4226', chapeu='elmo', camisa='#8e99a8', tabardo='#f6f0e0', calca='#6b7480', sapato='#4a4a55', lanca=True),
    'sargento': dict(pele='escura', cabelo='#2b1f2a', camisa='#8e99a8', tabardo='#f6f0e0', faixa='#3f6fb0', capa='#3f6fb0', calca='#6b7480', sapato='#4a4a55'),
}

# ------------------------------------------------------------------ Caligosuins
CG = dict(p='#6b6f7a', s='#3a3d46', l='#8a8e99', f='#b58a95', t='#f2e9d8', m='#5b1f3a', ml='#7a2e4d', me='#451530', o='#ffd23f',
          n='#1a1423', r='#7b3fa0', rl='#b06fd8', c='#3a2d32')


def cali(d='down', f=0, capitao=False, pose=None, sopro=0):
    """Porco bípede rechonchudo de manto vinho. `sopro` 1..3 = fumacinha negra no focinho."""
    if d == 'right':
        return cali('left', f, capitao, pose, sopro).flip()
    H = 32 if capitao else 24
    c = C(16, H)
    o = H - 24
    bob = 1 if f in (1, 3) else 0
    hy = 3 + bob + (0 if not capitao else 3)        # topo do capuz
    by = hy + 11
    TH = 6 + (o - 3 if capitao else 0)
    ly = by + TH
    P = CG
    # pernas e cascos
    e1, e3 = (1 if f == 1 else 0), (1 if f == 3 else 0)
    if d in ('down', 'up'):
        c.rect(5, ly, 2, 23 + o - ly - e1, P['p']).rect(9, ly, 2, 23 + o - ly - e3, P['p'])
        c.rect(4, 22 + o - e1, 3, 1, P['s']).rect(9, 22 + o - e3, 3, 1, P['s'])
    else:
        dx = {1: -1, 3: 1}.get(f, 0)
        c.rect(6 + dx, ly, 2, 23 + o - ly, P['p']).rect(9 - dx, ly, 2, 22 + o - ly, P['s'])
        c.rect(5 + dx, 22 + o, 3, 1, P['s']).rect(9 - dx, 21 + o, 2, 1, P['s'])
    # manto (curto demais)
    if d in ('down', 'up'):
        c.rect(3, by, 10, TH, P['m']).rect(4, by + TH, 8, 1, P['me'])
        c.rect(3, by + TH - 1, 10, 1, P['me'])
        if d == 'down':
            c.rect(7, by, 2, TH, P['ml']).px(7, by + 2, P['o']).px(8, by + 4, P['o'])
        else:   # rabo enrolado saindo por um buraco
            c.rect(7, by + 3, 2, 2, P['me']).px(8, by + 3, P['f']).px(9, by + 2, P['f']).px(9, by + 4, P['f']).px(10, by + 3, P['f'])
        # braços
        ae, ad = (1 if f == 1 else 0), (1 if f == 3 else 0)
        if pose in ('alerta', 'bronca'):
            c.rect(2, by - 3, 1, 4, P['m']).rect(13, by - 3, 1, 4, P['m']).px(2, by - 4, P['p']).px(13, by - 4, P['p'])
        elif pose == 'apontar' and d == 'down':
            c.rect(2, by + 1, 1, 3, P['m']).px(2, by + 4, P['p'])
            c.rect(13, by + 1, 2, 2, P['m']).px(15, by + 1, P['p'])
        else:
            c.rect(2, by + 1 + ae, 1, 3, P['m']).rect(13, by + 1 + ad, 1, 3, P['m'])
            c.px(2, by + 4 + ae, P['p']).px(13, by + 4 + ad, P['p'])
    else:
        c.rect(4, by, 8, TH, P['m']).rect(4, by + TH - 1, 8, 1, P['me']).rect(5, by + TH, 6, 1, P['me'])
        c.px(12, by + 3, P['f']).px(13, by + 2, P['f']).px(13, by + 4, P['f']).px(14, by + 3, P['f'])   # rabo
        dx = {1: -1, 3: 1}.get(f, 0)
        c.rect(7 + dx, by + 1, 2, 3, P['me']).rect(7 + dx, by + 4, 2, 1, P['p'])
    # cabeça com capuz
    if d == 'down':
        c.rect(4, hy, 8, 1, P['m']).rect(3, hy + 1, 10, 10, P['m']).rect(5, hy, 4, 1, P['ml'])
        c.rect(4, hy + 3, 8, 8, P['p']).rect(5, hy + 2, 6, 1, P['p']).rect(4, hy + 3, 8, 1, P['l'])
        c.rect(1, hy + 3, 2, 4, P['p']).px(1, hy + 7, P['s']).px(2, hy + 7, P['s'])         # orelhas caídas
        c.rect(13, hy + 3, 2, 4, P['p']).px(13, hy + 7, P['s']).px(14, hy + 7, P['s'])
        zang = pose in ('bronca', 'alerta')
        for x in (4, 10):
            c.rect(x, hy + 5, 2, 2, P['o'])
            c.px(x + (1 if x == 4 else 0), hy + 6, P['n'])
            if zang:
                c.px(x + (0 if x == 4 else 1), hy + 4, P['s']).px(x + (1 if x == 4 else 0), hy + 5, P['s'])
        c.rect(6, hy + 7, 4, 3, P['f']).px(7, hy + 8, P['s']).px(8, hy + 8, P['s']).rect(6, hy + 7, 4, 1, mix(P['f'], '#ffffff', 0.25))
        c.rect(4, hy + 8, 1, 3, P['t']).px(5, hy + 10, P['t'])                                 # presas
        if capitao:
            c.px(11, hy + 10, P['t']).px(10, hy + 10, P['t'])                                  # presa quebrada
        else:
            c.rect(11, hy + 8, 1, 3, P['t']).px(10, hy + 10, P['t'])
    elif d == 'up':
        c.rect(4, hy, 8, 1, P['m']).rect(3, hy + 1, 10, 10, P['m']).rect(5, hy, 4, 1, P['ml']).rect(3, hy + 9, 10, 2, P['me'])
        c.rect(1, hy + 3, 2, 4, P['p']).rect(13, hy + 3, 2, 4, P['p']).px(7, hy + 4, P['me']).px(8, hy + 5, P['me'])
    else:
        c.rect(4, hy, 8, 1, P['m']).rect(4, hy + 1, 9, 10, P['m']).rect(5, hy, 4, 1, P['ml'])
        c.rect(3, hy + 3, 6, 8, P['p']).rect(3, hy + 3, 6, 1, P['l'])
        c.rect(9, hy + 3, 2, 5, P['p']).px(9, hy + 8, P['s']).px(10, hy + 8, P['s'])           # orelha
        c.rect(4, hy + 5, 2, 2, P['o']).px(4, hy + 6, P['n'])
        c.rect(0, hy + 7, 4, 3, P['f']).px(0, hy + 8, P['s']).rect(0, hy + 7, 4, 1, mix(P['f'], '#ffffff', 0.25))
        c.rect(3, hy + 8, 1, 3, P['t']).px(2, hy + 10, P['t'])
    # cajado de madeira queimada / detalhes do capitão
    if not capitao:
        cx = {'down': 14, 'up': 1, 'left': 11}[d]
        if pose != 'alerta':
            c.rect(cx, by - 5, 1, 23 + o - by + 5, '#7a5440').px(cx - 1 if d != 'up' else cx + 1, by - 5, '#7a5440').px(cx, by - 6, P['r']).px(cx, by - 4, P['c']).px(cx, by + 2, P['c'])
    else:
        if d == 'down':
            c.rect(1, by - 1, 4, 3, '#8e99a8').rect(1, by - 1, 4, 1, '#c9ced6').px(2, by + 2, '#6b7480')     # ombreira de um lado só
            c.rect(3, by - 3, 1, 3, P['ml']).rect(12, by - 3, 1, 3, P['ml'])                               # gola alta demais
        elif d == 'up':
            c.rect(11, by - 1, 4, 3, '#8e99a8').rect(11, by - 1, 4, 1, '#c9ced6')
            c.rect(3, by - 3, 10, 3, P['ml'])
        else:
            c.rect(10, by - 3, 3, 4, P['ml'])
        fx = {'down': 12, 'up': 3, 'left': 12}[d]                                                           # bandeirinha chamuscada nas costas
        c.rect(fx, 1, 1, by - 1, P['c'])
        c.rect(fx + 1 if d != 'up' else fx - 3, 1, 3, 3, P['m']).px(fx + 3 if d != 'up' else fx - 3, 3, P['n'])
    c.outline(OUT)
    # fogo negro pelo focinho
    if sopro and d != 'up':
        sx, sy = (9, hy + 7) if d == 'down' else (0, hy + 7)
        pts = {1: [(0, 0, 'n'), (1, 0, 'n'), (1, -1, 'r'), (2, 0, 'r')],
               2: [(0, 0, 'n'), (1, 0, 'n'), (1, -1, 'n'), (2, -1, 'n'), (2, 0, 'r'), (0, -1, 'r'), (2, -2, 'r'), (3, -1, 'r'), (3, -3, 'rl')],
               3: [(1, 0, 'n'), (1, -1, 'n'), (2, -1, 'n'), (2, -2, 'n'), (3, -2, 'n'), (2, -3, 'n'), (0, 0, 'r'), (1, -2, 'r'), (3, -1, 'r'), (4, -2, 'r'),
                   (3, -3, 'r'), (2, -4, 'r'), (4, -4, 'rl'), (3, -5, 'rl')]}[sopro]
        for dx, dy, k in pts:
            c.px(sx + (dx if d == 'down' else -dx + 1), sy + (dy // 2 + 2 if d == 'down' else dy), P[k])
    if pose == 'espirrar' and d == 'down':
        for (x, y, k) in [(5, hy + 11, 'n'), (7, hy + 12, 'r'), (9, hy + 11, 'n'), (10, hy + 13, 'rl'), (4, hy + 13, 'r'), (7, hy + 14, 'n'), (8, hy + 10, 'n')]:
            c.px(x, y, P[k])
    return c


def bufo(q):
    """Lufada de chama negra com borda roxa que sai do focinho (16×16, 4 quadros): ponha na frente do focinho."""
    c = C(16, 16)
    P = CG
    formas = [[(8, 13, 1.6)], [(8, 12, 2.4), (9, 9, 1.6)], [(8, 11, 3), (10, 7, 2.3), (8, 4, 1.5)], [(9, 9, 2.4), (11, 5, 2), (9, 2, 1.2)]][q]
    for (x, y, r) in formas:
        c.ell(x, y, r + 1, r + 1, P['r'])
    for (x, y, r) in formas:
        c.ell(x, y, r, r, P['n'])
    for (x, y, r) in formas[-1:]:
        c.px(x + r, y - r, P['rl'])
    if q == 3:
        c.map(lambda v, x, y: (v[0], v[1], v[2], 190))
    return c


def folha_cali(capitao=False):
    H = 32 if capitao else 24
    sh = C(64, H * 4)
    for r, d in enumerate(('down', 'left', 'right', 'up')):
        for f in range(4):
            sh.blit(cali(d, f, capitao, sopro=(2 if f == 0 else 1 if f == 2 else 0)), f * 16, r * H)
    return sh


# ------------------------------------------------------------------ galinha

def galinha(d='down', f=0):
    if d == 'right':
        return galinha('left', f).flip()
    c = C(16, 24)
    b, e = '#f6f0e0', '#ddd0b8'
    bob = 1 if f in (1, 3) else 0
    y = 12 + bob
    if d == 'left':
        c.ell(9, y + 5, 4.5, 3.5, b).ell(5, y + 2, 2.2, 2.2, b).rect(11, y + 2, 3, 3, b).px(13, y + 1, b)
        c.px(5, y - 1, '#d8413a').px(4, y - 1, '#d8413a').px(2, y + 2, '#e8884a').px(4, y + 2, OUT).px(4, y + 4, '#d8413a')
        c.rect(8, y + 5, 3, 1, e)
    else:
        c.ell(8, y + 5, 4, 3.5, b).ell(8, y + 2, 2.5, 2.5, b)
        c.px(7, y - 1, '#d8413a').px(8, y - 1, '#d8413a')
        if d == 'down':
            c.px(7, y + 2, OUT).px(9, y + 2, OUT).px(8, y + 3, '#e8884a').px(8, y + 4, '#d8413a')
        else:
            c.rect(7, y + 7, 2, 2, e)
    px1, px2 = (7, 10) if f != 1 else (6, 10)
    if f == 3:
        px1, px2 = 7, 11
    c.px(px1, 22, '#e8884a').px(px2, 22, '#e8884a').px(px1, 21, '#e8884a').px(px2, 21, '#e8884a')
    return c.outline(OUT2)


# ------------------------------------------------------------------ poses

def tira(quadros, w=16, h=24):
    sh = C(w * len(quadros), h)
    for i, q in enumerate(quadros):
        sh.blit(q, i * w, 0)
    return sh


def deitar(q):
    """Personagem deitado de costas no chão (cabeça à esquerda): 24×16."""
    return q.rot90(3)


def poses():
    """Devolve {arquivo: (tira, frameW, frameH, alvo, anims)}."""
    I, P = FICHAS['icaro'], FICHAS['pai']
    b = lambda s, pose=None, d='down', f=0: boneco(s, d, f, pose)
    out = {}
    q = [b(I, 'sentado_fechado'), b(I, 'sentado'),            # 0-1 acordar
         b(I, 'livro'),                                       # 2 esconder_livro
         b(I, 'colher'), b(I, None),                          # 3-4 colher
         b(I, 'agachar'),                                     # 5
         b(I, 'ajoelhar'),                                    # 6
         b(I, 'conjurar'), b(I, 'conjurar2'),                 # 7-8
         b(I, 'brilho'), b(I, 'brilho2'),                     # 9-10
         b(I, 'erguer'), b(I, 'erguer2'),                     # 11-12
         b(I, 'encolhido'),                                   # 13
         b(I, 'colar'), b(I, 'colar2'),                       # 14-15
         b(I, 'segurar')]                                     # 16
    A = lambda fr, rate=4, rep=-1: dict(frames=fr, frameRate=rate, repeat=rep)
    out['icaro_poses'] = (tira(q), 16, 24, 'icaro', {
        'acordar': A([0, 0, 1], 2, 0), 'esconder_livro': A([2]), 'colher': A([3, 4, 3], 5, 0), 'agachar': A([5]), 'ajoelhar': A([6]),
        'conjurar': A([7, 8], 4), 'conjurar_brilho': A([9, 10], 5), 'erguer_viga': A([11, 12], 3), 'encolhido': A([13]),
        'colar_brilho': A([14, 15], 5), 'segurar_colar': A([16])})
    q = [b(P, 'sentado'), b(P, 'beber')]
    out['pai_poses'] = (tira(q), 16, 24, 'pai', {'sentado': A([0]), 'beber_cafe': A([0, 1, 1, 0], 2, 0)})
    q = [deitar(b(P, 'sentado_fechado')), deitar(b(P, 'sentado')), deitar(b(P, 'caixa')), deitar(b(P, 'empurrar')), deitar(b(P, 'entregar'))]
    out['pai_deitado'] = (tira(q, 24, 16), 24, 16, 'pai', {
        'parado': A([1, 1, 1, 0], 1), 'mostrar_caixa': A([2]), 'empurrar': A([3, 1], 6, 0), 'entregar_caixa': A([4])})
    out['aldeao_poses'] = (tira([b(FICHAS['aldeao'], 'varrer'), b(FICHAS['aldeao'], 'varrer', f=1)]), 16, 24, 'aldeao', {'varrer': A([0, 1], 3)})
    out['ermelinda_poses'] = (tira([b(FICHAS['ermelinda']), b(FICHAS['ermelinda'], 'carimbar')]), 16, 24, 'ermelinda', {'carimbar': A([0, 1, 0], 6, 0)})
    cb = dict(pele='morena', cabelo='#5a3a2a', camisa='#b8a67c', xale='#b8644a', vestido='#b8644a', calca='#b8644a')
    out['sobrevivente_poses'] = (tira([b(FICHAS['sobrevivente_1'] | dict(xale='#b8644a'), 'agachar'), b(FICHAS['sobrevivente_2'] | dict(xale='#5b7fa6'), 'agachar')]), 16, 24,
                                 'sobrevivente_1', {'sentado_cobertor': A([0]), 'sentado_cobertor_2': A([1])})
    q = [cali('down', 0, sopro=k) for k in (0, 1, 2, 3)] + [cali('down', 0, pose='espirrar'), cali('down', 0, pose='alerta')] + [cali('left', 0, sopro=k) for k in (1, 2, 3)] + [cali('left', 0), cali('right', 0)]
    out['cali_poses'] = (tira(q), 16, 24, 'cali_soldado', {'bufar': A([0, 1, 2, 3], 6), 'espirrar': A([0, 4, 4, 0], 6, 0), 'alerta': A([5]), 'bufar_lado': A([6, 7, 8], 6),
                                                        'olhar_em_volta': A([9, 9, 0, 10, 10, 0], 3)})
    q = [cali('down', 0, True), cali('down', 0, True, 'apontar'), cali('down', 0, True, 'bronca'), cali('down', 1, True, 'bronca')]
    out['toucim_poses'] = (tira(q, 16, 32), 16, 32, 'toucim', {'apontar': A([1]), 'bronca': A([2, 3], 6)})
    # objetos animados
    cx = [mesinha_caixa(), mesinha_caixa(True)]
    p2 = mesinha_caixa().copy()
    for (x, y) in [(3, 2), (12, 1), (8, 0), (13, 6)]:
        p2.px(x, y, '#ffe08a')
    p2.px(8, 5, '#fff3c4')
    out['caixa_costura'] = (tira([cx[0], p2, cx[1]], 16, 16), 16, 16, 'caixa_costura', {'fechada': A([0]), 'piscar': A([0, 1], 3), 'aberta': A([2])})
    bf = barril(True)
    ba = barril(True, True)
    bc = ba.copy()
    bc.rect(5, 1, 6, 5, '#f4cda5').rect(5, 0, 6, 2, '#d6d2dc').px(6, 3, '#3b2a35').px(9, 3, '#3b2a35').rect(6, -1, 4, 1, '#d6d2dc')   # a cabeça dela
    bc.rect(11, 2, 4, 3, '#f6f0e0').px(13, 1, '#d8413a').px(15, 3, '#e8884a').px(13, 3, '#3b2a35')                                    # e a galinha
    bc.outline(OUT2)
    out['barril_custodia'] = (tira([bf, ba, bc], 16, 32), 16, 32, 'barril_custodia', {'fechado': A([0]), 'abrir': A([0, 1, 2], 4, 0), 'aberto': A([2])})
    out['fx_bufo'] = (tira([bufo(k) for k in range(4)], 16, 16), 16, 16, 'fx_bufo', {'bufar': A([0, 1, 2, 3], 8, 0), 'respirar': A([0, 1, 0], 4)})
    # efeitos (tiles_fogo animados)
    T_ = tiles_outros
    out['fx_fogo'] = (tira([T_.chama(k, False, True) for k in range(3)], 16, 32), 16, 32, 'fx_fogo', {'queimar': A([0, 1, 2], 8)})
    out['fx_fogo_negro'] = (tira([T_.chama(k, True, True) for k in range(3)], 16, 32), 16, 32, 'fx_fogo_negro', {'queimar': A([0, 1, 2], 7)})
    out['fx_fumaca'] = (tira([T_.fumaca(k) for k in range(3)], 16, 32), 16, 32, 'fx_fumaca', {'subir': A([0, 1, 2], 4)})
    return out


# ------------------------------------------------------------------ ícones e emotes

def icones():
    r = {}
    c = C(16, 16)      # Colar da Mãe: cordão gasto + pedrinha opaca cinza-rosada
    for (x, y) in [(3, 2), (2, 4), (2, 6), (3, 8), (5, 10), (12, 2), (13, 4), (13, 6), (12, 8), (10, 10), (5, 1), (10, 1), (7, 1), (8, 1)]:
        c.px(x, y, '#8a6a55').px(x, y + 1, '#6b4a35')
    c.ell(8, 12, 2.6, 2.6, '#c9a3a8').px(7, 11, '#e6ccd0').px(9, 13, '#a8848a')
    r['item_colar_mae'] = c.outline(OUT2)
    c = C(16, 16)      # Rapadura Amassada
    c.rect(3, 6, 10, 6, '#a0622e').rect(3, 6, 10, 1, '#c98a4c').rect(11, 7, 2, 5, '#7d4a22').px(4, 12, '#a0622e').px(12, 5, '#a0622e')
    c.rect(2, 9, 5, 4, '#f3e6c8').rect(2, 9, 5, 1, '#ffffff').px(6, 13, '#ddd0b8')
    r['item_rapadura_amassada'] = c.outline(OUT2)
    c = C(16, 16)      # Ovos da Pamonha
    c.ell(8, 11, 6, 3, '#c9a05a')
    for (x, y, cor) in [(5.5, 8, '#f6f0e0'), (10.5, 8, '#f3e6c8'), (8, 6, '#fff8ea')]:
        c.ell(x, y, 2.2, 2.8, cor)
    c.px(7, 5, '#ffffff')
    r['item_ovos_pamonha'] = c.outline(OUT2)
    c = C(16, 16)      # Pão de Ontem
    c.ell(8, 9, 6, 3.5, '#d9a05b').ell(7, 7.5, 4, 1.6, '#f0c98a')
    for x in (5, 8, 11):
        c.line(x, 7, x + 1, 10, '#a8703a')
    r['item_pao_de_ontem'] = c.outline(OUT2)
    c = C(16, 16)      # moeda de cobre
    c.ell(8, 8, 5, 5, '#b8733a').ell(7.5, 7.5, 3.5, 3.5, '#d9965a').ell(8, 8, 2, 2, '#b8733a').px(6, 5, '#f0c090')
    r['item_moeda_cobre'] = c.outline(OUT2)
    c = C(16, 16)      # livro do Ícaro
    c.rect(3, 3, 10, 11, '#a52a33').rect(3, 3, 10, 1, '#c8545a').rect(12, 4, 1, 10, '#f6f0e0').rect(3, 3, 2, 11, '#7a1f24')
    c.px(8, 7, '#ffe08a').px(7, 8, '#ffe08a').px(9, 8, '#ffe08a').px(8, 9, '#ffe08a')
    r['item_livro_icaro'] = c.outline(OUT2)
    # emotes: balão 16×16
    def balao():
        b = C(16, 16)
        b.rect(2, 1, 12, 11, '#fffbe8').rect(1, 2, 14, 9, '#fffbe8').px(7, 12, '#fffbe8').px(8, 12, '#fffbe8').px(7, 13, '#fffbe8')
        return b.outline(OUT)
    e = balao(); e.rect(7, 3, 2, 5, '#d8413a').rect(7, 9, 2, 2, '#d8413a'); r['emote_exclamacao'] = e
    e = balao(); e.rect(6, 3, 4, 1, '#5b7fa6').rect(9, 4, 2, 2, '#5b7fa6').rect(7, 6, 2, 2, '#5b7fa6').rect(7, 9, 2, 2, '#5b7fa6').px(5, 4, '#5b7fa6'); r['emote_interrogacao'] = e
    e = balao()
    for x in (4, 7, 10):
        e.rect(x, 6, 2, 2, '#6b5560')
    r['emote_reticencias'] = e
    e = balao(); e.px(8, 3, '#6fb0c8').rect(7, 4, 2, 2, '#6fb0c8').rect(6, 6, 4, 3, '#6fb0c8').rect(7, 9, 2, 1, '#6fb0c8').px(7, 6, '#d6eef6'); r['emote_suor'] = e
    return r


def main():
    os.makedirs(SPR, exist_ok=True)
    os.makedirs(IMG, exist_ok=True)
    folhas = {}
    for nome, s in FICHAS.items():
        folhas[nome] = folha(s)
    folhas['cali_soldado'] = folha_cali()
    folhas['caligosuin'] = folhas['cali_soldado']     # chave padrão dos inimigos no motor
    folhas['toucim'] = folha_cali(True)
    g = C(64, 96)
    for r, d in enumerate(('down', 'left', 'right', 'up')):
        for f in range(4):
            g.blit(galinha(d, f), f * 16, r * 24)
    folhas['galinha'] = g
    for nome, sh in folhas.items():
        sh.save(os.path.join(SPR, nome + '.png'))
    json.dump({'frameWidth': 16, 'frameHeight': 32}, open(os.path.join(SPR, 'toucim.json'), 'w'))
    ps = poses()
    for nome, (sh, fw, fh, alvo, anims) in ps.items():
        sh.save(os.path.join(SPR, nome + '.png'))
        json.dump({'frameWidth': fw, 'frameHeight': fh, 'alvo': alvo, 'anims': anims}, open(os.path.join(SPR, nome + '.json'), 'w'), ensure_ascii=False, indent=1)
    for nome, c in icones().items():
        c.save(os.path.join(IMG, nome + '.png'))
    # prancha de conferência
    ordem = list(folhas)
    W = 6
    lin = (len(ordem) + W - 1) // W
    pr = Image.new('RGBA', (W * 72, lin * 136 + 120), (140, 192, 99, 255))
    for i, n in enumerate(ordem):
        pr.alpha_composite(folhas[n].im, ((i % W) * 72 + 4, (i // W) * 136 + 4))
    y = lin * 136
    x = 4
    for nome, (sh, fw, fh, alvo, anims) in ps.items():
        if x + sh.w > pr.size[0]:
            x, y = 4, y + 36
        pr.alpha_composite(sh.im, (x, y))
        x += sh.w + 8
    x = 4
    for c in icones().values():
        pr.alpha_composite(c.im, (x, pr.size[1] - 18))
        x += 18
    pr = pr.resize((pr.size[0] * 3, pr.size[1] * 3), Image.NEAREST)
    pr.save(os.path.join(RAIZ, 'docs', 'arte', 'capturas', 'sprites.png'))
    print('sprites ok', len(folhas), len(ps))


if __name__ == '__main__':
    main()
