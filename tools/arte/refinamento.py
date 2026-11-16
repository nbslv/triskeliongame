#!/usr/bin/env python3
"""Pasta de refinamento de arte.

exportar (padrão): copia toda a arte do jogo (assets/**/*.png) para refinamento_arte/,
mantendo as subpastas e acrescentando o tamanho ao nome:
    assets/portraits/icaro_triste.png  ->  refinamento_arte/portraits/icaro_triste__64x64.png
Também gera refinamento_arte/INDICE.csv com tamanho, quadro (para folhas de sprite) e origem.

importar: faz o caminho inverso. Para cada arquivo de refinamento_arte/ com o sufixo __LxA,
copia de volta para assets/ com o nome original, desde que o tamanho continue IGUAL.
Arquivos com tamanho diferente são listados e
não são copiados, para não quebrar sprites e mapas.

Uso:
    python3 tools/arte/refinamento.py            # exportar
    python3 tools/arte/refinamento.py importar   # trazer a arte refinada de volta
"""
import csv
import json
import re
import shutil
import sys
from pathlib import Path

from PIL import Image

RAIZ = Path(__file__).resolve().parents[2]
ASSETS = RAIZ / "assets"
DESTINO = RAIZ / "refinamento_arte"
SUFIXO = re.compile(r"^(?P<nome>.+)__(?P<w>\d+)x(?P<h>\d+)$")


def quadro(png: Path) -> str:
    js = png.with_suffix(".json")
    if js.exists():
        try:
            d = json.loads(js.read_text(encoding="utf-8"))
            if "frameWidth" in d and "frameHeight" in d:
                return f"{d['frameWidth']}x{d['frameHeight']}"
        except Exception:
            pass
    if png.parent.name == "sprites":
        return "16x24 (4 linhas x 3-4 colunas, padrão)"
    if png.parent.name == "tilesets":
        return "16x16 (tile)"
    return ""


def exportar() -> None:
    DESTINO.mkdir(exist_ok=True)
    linhas = []
    for png in sorted(ASSETS.rglob("*.png")):
        rel = png.relative_to(ASSETS)
        with Image.open(png) as im:
            w, h = im.size
        alvo = DESTINO / rel.parent / f"{png.stem}__{w}x{h}.png"
        alvo.parent.mkdir(parents=True, exist_ok=True)
        # Não sobrescreve um arquivo que a autora já editou (data mais nova que o original).
        if alvo.exists() and alvo.stat().st_mtime > png.stat().st_mtime:
            status = "mantido (editado)"
        else:
            shutil.copy2(png, alvo)
            status = "copiado"
        linhas.append([str(alvo.relative_to(DESTINO)), f"{w}x{h}", quadro(png), f"assets/{rel}", status])
    with open(DESTINO / "INDICE.csv", "w", newline="", encoding="utf-8") as f:
        wr = csv.writer(f)
        wr.writerow(["arquivo_para_editar", "tamanho_total", "tamanho_do_quadro", "original_no_jogo", "status"])
        wr.writerows(linhas)
    print(f"{len(linhas)} imagens em {DESTINO.relative_to(RAIZ)}/")


def importar() -> None:
    ok, recusados = 0, []
    for arq in sorted(DESTINO.rglob("*.png")):
        m = SUFIXO.match(arq.stem)
        if not m:
            continue
        rel_dir = arq.parent.relative_to(DESTINO)
        original = ASSETS / rel_dir / f"{m['nome']}.png"
        if not original.exists():
            recusados.append(f"{arq.relative_to(DESTINO)}: sem original em assets/")
            continue
        W, H = int(m["w"]), int(m["h"])
        with Image.open(arq) as im:
            w, h = im.size
        if (w, h) != (W, H):
            recusados.append(f"{arq.relative_to(DESTINO)}: tamanho {w}x{h}, esperado {W}x{H}")
            continue
        shutil.copy2(arq, original)
        ok += 1
    print(f"{ok} imagens trazidas de volta para assets/")
    for r in recusados:
        print("  RECUSADO:", r)


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "importar":
        importar()
    else:
        exportar()
