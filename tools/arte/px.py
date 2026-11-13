"""Mini-biblioteca de pixel art por código (Pillow) usada por todos os geradores de arte.

- `C`: tela RGBA com primitivas (px, rect, line, ell, art = matriz de caracteres, outline...).
- `Sheet`: monta um tileset 16×16 a partir de blocos nomeados e exporta PNG, tileset do Tiled
  (JSON, com `collides`/`hide`) e a tabela de índices em Markdown.
- `grade`: variações de iluminação (tarde, noite) com os MESMOS índices.
"""
from __future__ import annotations
import json, math, os
from PIL import Image

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
T = 16
_cache: dict = {}


def col(c, a=None):
    """Aceita '#rrggbb', '#rrggbbaa' ou tupla."""
    if c is None:
        return None
    if isinstance(c, tuple):
        return c if len(c) == 4 else (c[0], c[1], c[2], 255)
    k = (c, a)
    if k not in _cache:
        h = c.lstrip('#')
        v = [int(h[i:i + 2], 16) for i in range(0, len(h), 2)]
        if len(v) == 3:
            v.append(255)
        if a is not None:
            v[3] = a
        _cache[k] = tuple(v)
    return _cache[k]


def mix(a, b, t):
    a, b = col(a), col(b)
    return tuple(int(round(a[i] + (b[i] - a[i]) * t)) for i in range(4))


def mul(c, f):
    c = col(c)
    return (min(255, int(c[0] * f)), min(255, int(c[1] * f)), min(255, int(c[2] * f)), c[3])


EMISSIVOS = set()   # cores que não mudam nas variações de luz (fogo, brasas, luzes)

OUT = col('#3b2a35')      # contorno padrão (marrom-arroxeado, nunca preto puro)
OUT2 = col('#5a4046')     # contorno suave


def rnd(x, y, seed=0):
    """Ruído determinístico 0..1 por coordenada (bom para texturas que repetem)."""
    n = (x * 374761393 + y * 668265263 + seed * 2147483647 + 1013904223) & 0xFFFFFFFF
    n = ((n ^ (n >> 13)) * 1274126177) & 0xFFFFFFFF
    n ^= n >> 16
    return (n & 0xFFFF) / 65536.0


class C:
    def __init__(s, w=T, h=T, fill=None, im=None):
        s.im = im if im is not None else Image.new('RGBA', (w, h), col(fill) if fill else (0, 0, 0, 0))
        s.w, s.h = s.im.size
        s.p = s.im.load()

    # ---- primitivas
    def px(s, x, y, c):
        x, y = int(x), int(y)
        if c is not None and 0 <= x < s.w and 0 <= y < s.h:
            c = col(c)
            if c[3] == 255:
                s.p[x, y] = c
            elif c[3] > 0:
                o = s.p[x, y]
                a = c[3] / 255
                oa = o[3] / 255
                na = a + oa * (1 - a)
                s.p[x, y] = tuple(int((c[i] * a + o[i] * oa * (1 - a)) / na) for i in range(3)) + (int(na * 255),)
        return s

    def get(s, x, y):
        return s.p[x, y] if 0 <= x < s.w and 0 <= y < s.h else (0, 0, 0, 0)

    def clear(s, x, y, w=1, h=1):
        for j in range(y, y + h):
            for i in range(x, x + w):
                if 0 <= i < s.w and 0 <= j < s.h:
                    s.p[i, j] = (0, 0, 0, 0)
        return s

    def rect(s, x, y, w, h, c):
        for j in range(int(y), int(y + h)):
            for i in range(int(x), int(x + w)):
                s.px(i, j, c)
        return s

    def box(s, x, y, w, h, c, borda=OUT):
        s.rect(x, y, w, h, borda)
        s.rect(x + 1, y + 1, w - 2, h - 2, c)
        return s

    def line(s, x0, y0, x1, y1, c):
        x0, y0, x1, y1 = int(x0), int(y0), int(x1), int(y1)
        dx, dy = abs(x1 - x0), -abs(y1 - y0)
        sx, sy = (1 if x0 < x1 else -1), (1 if y0 < y1 else -1)
        e = dx + dy
        while True:
            s.px(x0, y0, c)
            if x0 == x1 and y0 == y1:
                break
            e2 = 2 * e
            if e2 >= dy:
                e += dy
                x0 += sx
            if e2 <= dx:
                e += dx
                y0 += sy
        return s

    def ell(s, cx, cy, rx, ry, c, f=None):
        """Elipse cheia. `f(x,y)` opcional devolve a cor por pixel."""
        for j in range(int(cy - ry - 1), int(cy + ry + 2)):
            for i in range(int(cx - rx - 1), int(cx + rx + 2)):
                if ((i + 0.5 - cx) / rx) ** 2 + ((j + 0.5 - cy) / ry) ** 2 <= 1.0:
                    s.px(i, j, f(i, j) if f else c)
        return s

    def art(s, x, y, linhas, pal):
        """Desenha uma matriz de caracteres. '.' e ' ' = transparente."""
        if isinstance(linhas, str):
            linhas = [l for l in linhas.split('\n') if l != '']
        for j, l in enumerate(linhas):
            for i, ch in enumerate(l):
                if ch not in '. ':
                    s.px(x + i, y + j, pal[ch])
        return s

    def blit(s, o, x=0, y=0):
        im = o.im if isinstance(o, C) else o
        s.im.alpha_composite(im, (int(x), int(y))) if (x >= 0 and y >= 0) else s._blit_neg(im, int(x), int(y))
        return s

    def _blit_neg(s, im, x, y):
        cx, cy = max(0, -x), max(0, -y)
        if cx >= im.size[0] or cy >= im.size[1]:
            return
        s.im.alpha_composite(im.crop((cx, cy, im.size[0], im.size[1])), (max(0, x), max(0, y)))

    def copy(s):
        return C(im=s.im.copy())

    def crop(s, x, y, w, h):
        return C(im=s.im.crop((x, y, x + w, y + h)))

    def flip(s):
        return C(im=s.im.transpose(Image.FLIP_LEFT_RIGHT))

    def flipv(s):
        return C(im=s.im.transpose(Image.FLIP_TOP_BOTTOM))

    def rot90(s, k=1):
        return C(im=s.im.rotate(-90 * k, expand=True))

    def scale(s, k):
        return C(im=s.im.resize((s.w * k, s.h * k), Image.NEAREST))

    # ---- efeitos
    def outline(s, c=OUT, diag=False, so_baixo=False):
        """Contorno de 1px em volta do que é opaco (dentro dos limites da tela)."""
        c = col(c)
        src = s.im.copy().load()
        viz = [(1, 0), (-1, 0), (0, 1), (0, -1)] + ([(1, 1), (-1, 1), (1, -1), (-1, -1)] if diag else [])
        if so_baixo:
            viz = [(0, -1)]
        for y in range(s.h):
            for x in range(s.w):
                if src[x, y][3] == 0:
                    for dx, dy in viz:
                        i, j = x + dx, y + dy
                        if 0 <= i < s.w and 0 <= j < s.h and src[i, j][3] > 200:
                            s.p[x, y] = c
                            break
        return s

    def speckle(s, cores, seed=0, x0=0, y0=0, w=None, h=None, so_opaco=True):
        """Salpica pixels: cores = [(cor, densidade)]."""
        w = s.w if w is None else w
        h = s.h if h is None else h
        for j in range(y0, y0 + h):
            for i in range(x0, x0 + w):
                if so_opaco and s.get(i, j)[3] == 0:
                    continue
                r = rnd(i % 64, j % 64, seed)
                acc = 0
                for c, d in cores:
                    acc += d
                    if r < acc:
                        s.px(i, j, c)
                        break
        return s

    def map(s, f):
        for y in range(s.h):
            for x in range(s.w):
                v = s.p[x, y]
                if v[3]:
                    s.p[x, y] = f(v, x, y)
        return s

    def sombra_chao(s, cx, cy, rx, ry=2, c='#3b2a3550'):
        """Sombra oval translúcida, desenhada só onde está transparente."""
        c = col(c)
        for j in range(int(cy - ry), int(cy + ry + 1)):
            for i in range(int(cx - rx), int(cx + rx + 1)):
                if ((i + 0.5 - cx) / rx) ** 2 + ((j + 0.5 - cy) / ry) ** 2 <= 1.0 and s.get(i, j)[3] == 0:
                    s.px(i, j, c)
        return s

    def save(s, caminho, k=1):
        os.makedirs(os.path.dirname(caminho), exist_ok=True)
        (s.scale(k) if k > 1 else s).im.save(caminho)


# ---------------------------------------------------------------- iluminação

def grade(im, modo):
    """Variação de iluminação com os mesmos pixels: 'tarde' (dourado) ou 'noite' (azul-arroxeado)."""
    if isinstance(im, C):
        im = im.im
    out = im.copy()
    p = out.load()
    for y in range(out.size[1]):
        for x in range(out.size[0]):
            r, g, b, a = p[x, y]
            if a == 0 or (r, g, b) in EMISSIVOS:
                continue
            if modo == 'tarde':
                l = (r * 0.3 + g * 0.59 + b * 0.11) / 255
                r2 = r * 1.04 + 14 * l
                g2 = g * 0.90 + 4
                b2 = b * 0.74 + 10
            elif modo == 'noite':
                l = (r * 0.3 + g * 0.59 + b * 0.11)
                r2 = (r * 0.62 + l * 0.38) * 0.50 + 14
                g2 = (g * 0.62 + l * 0.38) * 0.47 + 10
                b2 = (b * 0.62 + l * 0.38) * 0.66 + 30
            else:
                r2, g2, b2 = r, g, b
            p[x, y] = (max(0, min(255, int(r2))), max(0, min(255, int(g2))), max(0, min(255, int(b2))), a)
    return out


# ---------------------------------------------------------------- tileset

class Sheet:
    """Empacota blocos de tiles (múltiplos de 16 px) num tileset de `cols` colunas.

    A ordem de inclusão define os índices: para não quebrar mapas já feitos, só ACRESCENTE
    blocos no fim de cada tileset (ou crie seções novas no fim).
    """

    def __init__(s, nome, cols=16, titulo=''):
        s.nome, s.cols, s.titulo = nome, cols, titulo
        s.x = s.y = s.rowh = 0
        s.itens = []      # dict(nome, x, y, w, h, c, desc, col, hide, acima, secao)
        s.secao = ''
        s.secoes = []
        s.anims = []      # (nomes dos quadros, duração em ms)

    def section(s, titulo, nota=''):
        if s.x:
            s.y += s.rowh
            s.x = s.rowh = 0
        s.secao = titulo
        s.secoes.append((titulo, nota))

    def add(s, nome, c, desc='', col=False, hide=False, acima=None):
        """c: tela com múltiplos de 16. col/hide: bool ou máscara ['x.', '..'] por tile.
        acima: None, True ou máscara — tiles que devem ir numa camada `acima` (por cima do jogador)."""
        w, h = c.w // T, c.h // T
        assert c.w % T == 0 and c.h % T == 0, nome
        if s.x + w > s.cols:
            s.y += s.rowh
            s.x = s.rowh = 0
        it = dict(nome=nome, x=s.x, y=s.y, w=w, h=h, c=c, desc=desc, col=col, hide=hide, acima=acima, secao=s.secao)
        s.itens.append(it)
        s.x += w
        s.rowh = max(s.rowh, h)
        return it

    def animar(s, nomes, ms=160):
        """Animação de tile no formato do Tiled: o bloco `nomes[0]` é o que vai no mapa."""
        s.anims.append((list(nomes), ms))

    def idx(s, nome, dx=0, dy=0):
        for it in s.itens:
            if it['nome'] == nome:
                return (it['y'] + dy) * s.cols + it['x'] + dx
        raise KeyError(nome)

    @staticmethod
    def _m(mask, i, j):
        if isinstance(mask, (list, tuple)):
            return mask[j][i] not in '. '
        return bool(mask)

    def render(s):
        linhas = s.y + s.rowh
        im = Image.new('RGBA', (s.cols * T, linhas * T), (0, 0, 0, 0))
        for it in s.itens:
            im.paste(it['c'].im, (it['x'] * T, it['y'] * T))
        return im

    def tiled(s, im):
        tiles = {}
        for it in s.itens:
            for j in range(it['h']):
                for i in range(it['w']):
                    tid = (it['y'] + j) * s.cols + it['x'] + i
                    props = []
                    if s._m(it['col'], i, j):
                        props.append({'name': 'collides', 'type': 'bool', 'value': True})
                    if s._m(it['hide'], i, j):
                        props.append({'name': 'hide', 'type': 'bool', 'value': True})
                    if props:
                        tiles[tid] = {'id': tid, 'properties': props}
        for nomes, ms in s.anims:
            its = [next(i for i in s.itens if i['nome'] == n) for n in nomes]
            for j in range(its[0]['h']):
                for i in range(its[0]['w']):
                    ids = [(it['y'] + j) * s.cols + it['x'] + i for it in its]
                    tiles.setdefault(ids[0], {'id': ids[0]})['animation'] = [{'tileid': t, 'duration': ms} for t in ids]
        return {
            'name': s.nome, 'image': f'../../assets/tilesets/{s.nome}.png',
            'imagewidth': im.size[0], 'imageheight': im.size[1],
            'tilewidth': T, 'tileheight': T, 'tilecount': (im.size[0] // T) * (im.size[1] // T),
            'columns': s.cols, 'margin': 0, 'spacing': 0,
            'tiles': [tiles[k] for k in sorted(tiles)],
        }

    def markdown(s):
        out = []
        sec = None
        for it in s.itens:
            if it['secao'] != sec:
                sec = it['secao']
                nota = dict(s.secoes).get(sec, '')
                out.append(f'\n### {sec}\n')
                if nota:
                    out.append(nota + '\n')
                out.append('| Nome | Índices | Tam. | Sólido | Uso |')
                out.append('|---|---|---|---|---|')
            w, h = it['w'], it['h']
            base = it['y'] * s.cols + it['x']
            if w == 1 and h == 1:
                ind = f'**{base}**'
            else:
                ind = '<br>'.join(' '.join(str((it['y'] + j) * s.cols + it['x'] + i) for i in range(w)) for j in range(h))
            flags = []
            def desc_mask(m, sim):
                if isinstance(m, (list, tuple)):
                    return '<br>'.join(''.join('■' if ch not in '. ' else '·' for ch in l) for l in m)
                return sim if m else ''
            solido = desc_mask(it['col'], 'sim')
            uso = it['desc']
            if it['hide']:
                uso += ' **Esconderijo (`hide`).**'
            if it['acima'] is not None:
                if isinstance(it['acima'], (list, tuple)):
                    uso += ' Camada `acima`: ' + desc_mask(it['acima'], '') .replace('<br>', ' / ') + '.'
                elif it['acima']:
                    uso += ' Vai na camada `acima`.'
            out.append(f"| `{it['nome']}` | {ind} | {w}×{h} | {solido or '—'} | {uso} |")
        return '\n'.join(out)

    def export(s, variantes=()):
        """Grava assets/tilesets/<nome>.png (+ variantes de luz), docs/arte/tilesets/<nome>.json e devolve o md."""
        im = s.render()
        p = os.path.join(RAIZ, 'assets', 'tilesets')
        os.makedirs(p, exist_ok=True)
        im.save(os.path.join(p, f'{s.nome}.png'))
        d = os.path.join(RAIZ, 'docs', 'arte', 'tilesets')
        os.makedirs(d, exist_ok=True)
        nomes = [s.nome]
        for v in variantes:
            grade(im, v).save(os.path.join(p, f'{s.nome}_{v}.png'))
            nomes.append(f'{s.nome}_{v}')
        for n in nomes:
            js = s.tiled(im)
            js['name'] = n
            js['image'] = f'../../assets/tilesets/{n}.png'
            json.dump(js, open(os.path.join(d, f'{n}.json'), 'w'), ensure_ascii=False, indent=1)
        # nomes → índices, para scripts de mapa
        mapa = {}
        for it in s.itens:
            if it['w'] == 1 and it['h'] == 1:
                mapa[it['nome']] = it['y'] * s.cols + it['x']
            else:
                mapa[it['nome']] = [[(it['y'] + j) * s.cols + it['x'] + i for i in range(it['w'])] for j in range(it['h'])]
        json.dump(mapa, open(os.path.join(d, f'{s.nome}.indices.json'), 'w'), ensure_ascii=False, indent=0)
        # prancha ampliada com grade, para consulta visual
        k = 3
        big = im.resize((im.size[0] * k, im.size[1] * k), Image.NEAREST)
        fundo = Image.new('RGBA', big.size, (58, 52, 64, 255))
        fundo.alpha_composite(big)
        pp = fundo.load()
        for y in range(0, big.size[1], T * k):
            for x in range(big.size[0]):
                pp[x, y] = (90, 80, 100, 255)
        for x in range(0, big.size[0], T * k):
            for y in range(big.size[1]):
                pp[x, y] = (90, 80, 100, 255)
        fundo.save(os.path.join(d, f'{s.nome}_prancha.png'))
        return im
