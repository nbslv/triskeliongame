"""Gera todos os tilesets, o guia docs/arte/TILESET.md e as montagens de exemplo.

Uso: python3 tools/arte/gerar_tilesets.py
"""
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from PIL import Image
from px import RAIZ, T, grade
import tiles_exterior, tiles_interior, tiles_outros

PREFACIO = open(os.path.join(os.path.dirname(__file__), 'TILESET_prefacio.md'), encoding='utf-8').read()


class Mock:
    """Monta uma cena pequena a partir dos nomes dos tiles (confere se as peças casam)."""

    def __init__(s, sheet, w, h, im=None):
        s.sh, s.w, s.h = sheet, w, h
        s.src = im or sheet.render()
        s.im = Image.new('RGBA', (w * T, h * T), (59, 42, 53, 255))

    def t(s, nome, x, y, dx=None, dy=None):
        """Carimba o bloco inteiro (ou só o tile dx,dy do bloco) em x,y."""
        it = next(i for i in s.sh.itens if i['nome'] == nome)
        if dx is None:
            reg = (it['x'] * T, it['y'] * T, (it['x'] + it['w']) * T, (it['y'] + it['h']) * T)
        else:
            reg = ((it['x'] + dx) * T, (it['y'] + dy) * T, (it['x'] + dx + 1) * T, (it['y'] + dy + 1) * T)
        s.im.alpha_composite(s.src.crop(reg), (x * T, y * T))
        return s

    def fill(s, nomes, x0, y0, w, h):
        for y in range(y0, y0 + h):
            for x in range(x0, x0 + w):
                s.t(nomes[(x * 7 + y * 13) % len(nomes)], x, y)
        return s

    def blob(s, nome, x0, y0, w, h):
        for y in range(h):
            for x in range(w):
                dx = 0 if x == 0 else 2 if x == w - 1 else 1
                dy = 0 if y == 0 else 2 if y == h - 1 else 1
                s.t(nome, x0 + x, y0 + y, dx, dy)
        return s

    def casa(s, x, y, w, telhado='telhado', parede='parede', porta='porta', extras=(), linhas=2):
        s.blob(telhado, x, y, w, linhas + 1) if linhas >= 2 else None
        for i in range(w):
            dx = 0 if i == 0 else 2 if i == w - 1 else 1
            s.t(parede, x + i, y + linhas + 1, dx, 0).t(parede, x + i, y + linhas + 2, dx, 1)
        s.t(porta, x + w // 2, y + linhas + 1)
        for nome, off in extras:
            s.t(nome, x + off, y + linhas + 1)
        return s


def mock_vila(sh, im, noite=False):
    m = Mock(sh, 28, 16, im)
    m.fill(['grama_1', 'grama_2', 'grama_3', 'grama_1', 'grama_flores_1'], 0, 0, 28, 16)
    m.blob('borda_terra', 0, 8, 28, 3)
    m.blob('borda_calcamento', 11, 9, 7, 6)
    q = noite
    m.casa(1, 1, 5, 'telhado_queimado' if q else 'telhado', 'parede_queimada' if q else 'parede', 'porta_queimada_aberta' if q else 'porta_aberta',
           [('janela_fogo' if q else 'janela_flores', 1), ('placa_padaria', 3)])
    m.casa(8, 1, 4, 'telhado', 'parede', 'porta', [('janela', 1), ('placa_biblioteca', 3)])
    m.casa(20, 1, 6, 'telhado_palha', 'parede_madeira', 'portao_barracao', [])
    m.t('chamine', 3, 0)
    if not q:
        m.t('fumaca_chamine', 3, -1) if False else None
    m.t('chafariz', 13, 10)
    m.t('carroca_queimada' if q else 'carroca_sacas', 3, 11).t('sacas', 8, 12).t('barril', 7, 7).t('barril_grande', 13, 5)
    m.t('lampiao_derretido' if q else 'lampiao', 19, 9).t('arvore_1', 24, 10).t('arvore_2', 0, 12).t('arbusto', 22, 13).t('arbusto_frutas', 18, 6)
    m.t('bandeira_cali', 17, 10) if q else m.t('varal', 19, 12)
    m.t('galinha_1', 10, 12).t('cesto_cheio', 20, 7).t('mureta_h', 11, 15).t('mureta_h', 12, 15).t('mureta_pilar', 13, 15)
    for x in range(22, 28):
        m.t('cerca_h', x, 15)
    if q:
        fg = tiles_outros.fogo()
        f = Mock(fg, 28, 16)
        f.im = m.im
        f.t('fogo_alto_1', 2, 1).t('fogo_alto_2', 4, 2).t('fogo_1', 6, 7).t('fogo_negro_alto_1', 16, 6).t('fogo_negro_2', 21, 11).t('mancha_negra_1', 20, 11).t('fumaca_preta_1', 3, -1).t('brasas_1', 5, 12).t('fogo_3', 12, 8)
    return m.im


def mock_cafezal(sh, im):
    m = Mock(sh, 28, 12, im)
    m.fill(['grama_1', 'grama_2', 'grama_3'], 0, 0, 28, 12)
    m.blob('borda_terra_vermelha', 1, 5, 20, 6)
    for x in range(28):
        m.t('barranco_vermelho_M', x, 4)
    m.t('barranco_vermelho_escada', 12, 4)
    est = ['pe_cafe_maduro', 'pe_cafe_verde', 'pe_cafe_colhido', 'pe_cafe_maduro', 'pe_cafe_colhido']
    for i, x in enumerate(range(2, 20, 2)):
        m.t(est[i % 5], x, 5).t(est[(i + 2) % 5], x, 8).t('pe_cafe_colhido', x + 1, 1)
    m.t('toco', 22, 9).t('cesto_cheio', 23, 9).t('balanca', 24, 6).t('sacas', 26, 7).t('capim_1', 21, 6).t('capim_2', 0, 9).t('arvore_1', 22, 0)
    return m.im


def mock_interior(sh, im):
    m = Mock(sh, 14, 10, im)
    m.fill(['vazio'], 0, 0, 14, 10)
    m.fill(['tabua_1', 'tabua_2'], 1, 3, 12, 6)
    m.blob('moldura', 0, 0, 14, 10)
    for y in range(1, 9):
        for x in range(1, 13):
            if y >= 3:
                m.t('tabua_1' if (x + y) % 3 else 'tabua_2', x, y)
    for x in range(1, 13):
        dx = 0 if x == 1 else 2 if x == 12 else 1
        m.t('parede_fundo', x, 1, dx, 0).t('parede_fundo', x, 2, dx, 1)
    m.t('janela_luz', 3, 1).t('luz_chao', 3, 3).t('retrato_torto', 6, 1).t('prateleira_pote', 8, 1).t('ferramentas', 11, 1).t('porta_fundos', 5, 1)
    m.t('fogao', 1, 2).t('mesa_posta', 5, 5).t('cadeira_frente', 6, 4).t('cadeira_costas', 6, 7)
    m.t('catre', 11, 3).t('colchao_palha', 10, 6).t('cadeira_balanco', 1, 5).t('caixa_costura', 2, 7).t('tapete_azul', 8, 3).t('soleira', 4, 9).t('vaso_flor', 12, 8)
    return m.im


def main():
    ext = tiles_exterior.montar()
    im_ext = ext.export(('tarde', 'noite'))
    inte = tiles_interior.montar()
    im_int = inte.export(('noite',))
    outros = [tiles_outros.fogo(), tiles_outros.tunel(), tiles_outros.panorama()]
    for s in outros:
        s.export()
    cap = os.path.join(RAIZ, 'docs', 'arte', 'capturas')
    os.makedirs(cap, exist_ok=True)
    k = 3
    def salva(im, nome):
        im.resize((im.size[0] * k, im.size[1] * k), Image.NEAREST).save(os.path.join(cap, nome))
    salva(mock_vila(ext, im_ext), 'mock_vila_dia.png')
    salva(mock_vila(ext, grade(im_ext, 'noite'), True), 'mock_vila_noite.png')
    salva(mock_cafezal(ext, grade(im_ext, 'tarde')), 'mock_cafezal_tarde.png')
    salva(mock_interior(inte, im_int), 'mock_casa_icaro.png')

    md = [PREFACIO]
    for s, var in [(ext, ['tarde', 'noite']), (inte, ['noite'])] + [(o, []) for o in outros]:
        im = s.render()
        md.append(f'\n---\n\n## `{s.nome}`\n')
        nomes = ', '.join(f'`{s.nome}_{v}`' for v in var)
        md.append(f'- Arquivo: `assets/tilesets/{s.nome}.png` — {im.size[0]}×{im.size[1]} px, **{s.cols} colunas**, {(im.size[0] // T) * (im.size[1] // T)} tiles.')
        if var:
            md.append(f'- Variações de luz com os **mesmos índices**: {nomes}.')
        md.append(f'- Tileset pronto para embutir: `docs/arte/tilesets/{s.nome}.json` · nomes → índices: `docs/arte/tilesets/{s.nome}.indices.json`.')
        md.append(f'- Prancha ampliada: ![{s.nome}](tilesets/{s.nome}_prancha.png)')
        md.append(s.markdown())
    open(os.path.join(RAIZ, 'docs', 'arte', 'TILESET.md'), 'w', encoding='utf-8').write('\n'.join(md) + '\n')
    print('ok')


if __name__ == '__main__':
    main()
