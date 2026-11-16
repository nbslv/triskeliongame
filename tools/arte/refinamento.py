"""Atualiza `refinamento_arte/`: cópia de toda a arte de `assets/` com o tamanho no nome.

Convenção: mesma subpasta de assets/, nome original + `__LxA.png` (ex.: `portraits/icaro_triste__64x64.png`),
mais `INDICE.csv`. Rode sempre que entregar arte nova ou alterada e inclua a pasta no commit.

Uso: python3 tools/arte/refinamento.py
"""
import csv, os, re, shutil
from PIL import Image

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
ORIG = os.path.join(RAIZ, 'assets')
DEST = os.path.join(RAIZ, 'refinamento_arte')
PADRAO = re.compile(r'__\d+x\d+\.png$')


def main():
    os.makedirs(DEST, exist_ok=True)
    for pasta, _, arqs in os.walk(DEST):            # tira cópias antigas (o tamanho ou o arquivo pode ter mudado)
        for a in arqs:
            if PADRAO.search(a):
                os.remove(os.path.join(pasta, a))
    linhas = []
    for pasta, _, arqs in sorted(os.walk(ORIG)):
        for a in sorted(arqs):
            if not a.lower().endswith('.png'):
                continue
            src = os.path.join(pasta, a)
            sub = os.path.relpath(pasta, ORIG)
            with Image.open(src) as im:
                w, h = im.size
            nome = f'{a[:-4]}__{w}x{h}.png'
            os.makedirs(os.path.join(DEST, sub), exist_ok=True)
            shutil.copyfile(src, os.path.join(DEST, sub, nome))
            linhas.append([os.path.join('assets', sub, a).replace(os.sep, '/'), os.path.join(sub, nome).replace(os.sep, '/'), w, h])
    with open(os.path.join(DEST, 'INDICE.csv'), 'w', newline='', encoding='utf-8') as f:
        w = csv.writer(f)
        w.writerow(['original', 'copia', 'largura', 'altura'])
        w.writerows(linhas)
    print('refinamento ok', len(linhas))


if __name__ == '__main__':
    main()
