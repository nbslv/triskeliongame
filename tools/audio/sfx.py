"""Efeitos sonoros do prólogo: síntese curta e suave, exportada em OGG.

Uso: python3 tools/audio/sfx.py [id ...]
"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
import numpy as np
from synth import SR, RAIZ, t_, env, filtro, ruido, hz, exporta, celesta, marimba, Faixa

DEST = os.path.join(RAIZ, 'assets', 'audio', 'sfx')
rng = np.random.default_rng(42)


def mix(dur, partes):
    """partes: [(t0, sinal)] → mono."""
    n = int(dur * SR)
    b = np.zeros(n)
    for t0, x in partes:
        i = int(t0 * SR)
        if i >= n:
            continue
        x = x[:n - i]
        b[i:i + len(x)] += x
    return b


def tom(f0, f1, dur, forma='sin', a=0.005, r=0.03, vib=0.0, vibf=6.0, curva=1.0):
    t = t_(dur)
    f = f0 + (f1 - f0) * (t / dur) ** curva
    if vib:
        f = f * (1 + vib * np.sin(2 * np.pi * vibf * t))
    ph = 2 * np.pi * np.cumsum(f) / SR
    if forma == 'sin':
        x = np.sin(ph)
    elif forma == 'voz':        # rico em harmônicos, como um grasnido
        x = sum(np.sin(h * ph) / h ** 0.8 for h in range(1, 9)) / 3
    else:                       # 'suave': senoide com um pouco de 2º e 3º harmônicos
        x = np.sin(ph) + 0.3 * np.sin(2 * ph) + 0.12 * np.sin(3 * ph)
    return x * env(len(t), a, r)


def sopro(dur, lo, hi, seed=1, a=0.01, r=0.05):
    n = int(dur * SR)
    return filtro(ruido(n, seed), lo=lo, hi=hi) * env(n, a, r)


def estalo(vel=1.0, seed=0, f=2500):
    n = int(0.03 * SR)
    return vel * filtro(ruido(n, seed), lo=f * 0.5, hi=f * 2) * np.exp(-np.arange(n) / (0.004 * SR))


def baque(f=70, dur=0.25, vel=1.0):
    t = t_(dur)
    return vel * np.sin(2 * np.pi * np.cumsum(f * (1 + 1.2 * np.exp(-t * 30))) / SR) * np.exp(-t * (4 / dur))


def rangido(dur, f0=90, seed=3):
    t = t_(dur)
    f = f0 * (1 + 0.25 * np.sin(2 * np.pi * 1.3 * t + seed) + 0.1 * np.sin(2 * np.pi * 7 * t))
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sign(np.sin(ph)) * 0.3 + sum(np.sin(h * ph) / h for h in range(1, 12))
    x = filtro(x, lo=250, hi=2200) * (0.6 + 0.4 * np.sin(2 * np.pi * 9 * t) ** 2)
    return 0.25 * x * env(len(t), 0.05, 0.12)


def pio(f=3000, dur=0.08, sobe=True, vel=0.3):
    return vel * tom(f, f * (1.35 if sobe else 0.75), dur, 'sin', 0.005, 0.03)


def sino_nota(f, dur=3.0, vel=0.5):
    t = t_(dur)
    x = np.zeros_like(t)
    for m, a, d in [(0.5, 0.5, 0.8), (1.0, 1.0, 1.1), (1.19, 0.35, 1.6), (1.5, 0.25, 2.0), (2.0, 0.45, 2.2), (2.74, 0.2, 3.5), (4.07, 0.12, 5)]:
        x += a * np.exp(-t * d) * np.sin(2 * np.pi * f * m * t)
    return vel * 0.4 * x * env(len(t), 0.002, 0.3)


def grunhido(dur=0.25, f=95, vel=0.5, seed=0, agudo=1.0):
    t = t_(dur)
    ff = f * agudo * (1 + 0.25 * np.sin(np.pi * t / dur))
    ph = 2 * np.pi * np.cumsum(ff) / SR
    x = sum(np.sin(h * ph) / h for h in range(1, 14))
    x *= 0.55 + 0.45 * np.sin(2 * np.pi * 28 * t) ** 2          # ronquinho
    x = filtro(x + 0.5 * ruido(len(t), seed), lo=120, hi=1400 * agudo)
    return vel * 0.3 * x * env(len(t), 0.02, 0.07)


# ------------------------------------------------------------------ os efeitos

def galo():
    return mix(1.9, [(0.0, 0.5 * tom(520, 640, 0.16, 'voz', 0.01, 0.03)), (0.2, 0.5 * tom(640, 700, 0.14, 'voz')),
                     (0.38, 0.55 * tom(700, 820, 0.2, 'voz', vib=0.02)), (0.6, 0.6 * tom(840, 560, 1.1, 'voz', 0.02, 0.5, vib=0.03, vibf=9, curva=1.6))])


def cafe_servindo():
    n = int(1.6 * SR)
    t = np.arange(n) / SR
    x = filtro(ruido(n, 4), lo=500, hi=4500) * 0.25
    borb = sum(0.12 * np.sin(2 * np.pi * np.cumsum(f * (1 + 0.5 * t / 1.6)) / SR + k) * (np.sin(2 * np.pi * (5 + k) * t) > 0.3) for k, f in enumerate((420, 610, 830)))
    return (x + borb) * env(n, 0.08, 0.3) * 0.8


def passaros(dur, n, seed, sobe=True):
    r = np.random.default_rng(seed)
    p = []
    for _ in range(n):
        t0 = r.uniform(0, dur - 0.5)
        f = r.uniform(2400, 4200)
        for k in range(r.integers(2, 5)):
            p.append((t0 + k * 0.11, pio(f * (1 + 0.06 * k), 0.07, sobe, r.uniform(0.12, 0.28))))
    return mix(dur, p)


def bater_asas(dur=1.6):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = filtro(ruido(n, 9), lo=300, hi=3000) * (np.sin(2 * np.pi * (11 + 5 * t) * t) ** 2) * np.exp(-t * 1.2) * 0.45
    return x + passaros(dur, 5, 3, False) * 0.9


def livro_fechando():
    return mix(0.4, [(0.0, 0.2 * sopro(0.1, 800, 5000, 2)), (0.07, 0.7 * baque(120, 0.18)), (0.07, 0.3 * estalo(1, 5, 900))])


def colher_cafe():
    return mix(0.45, [(0.0, 0.25 * sopro(0.12, 2000, 7000, 3)), (0.08, 0.35 * estalo(1, 2, 1800)), (0.16, 0.3 * estalo(1, 6, 2400)),
                      (0.24, 0.22 * tom(700, 1100, 0.08))])


def cesto_balanca():
    return mix(0.9, [(0.0, 0.6 * rangido(0.35, 140, 1)), (0.3, 0.7 * baque(85, 0.3)), (0.32, 0.3 * sopro(0.12, 600, 3000, 4)), (0.55, 0.2 * tom(1900, 1900, 0.25, 'sin', 0.002, 0.2))])


def moedas():
    p = []
    for k, t0 in enumerate([0.0, 0.09, 0.2, 0.26, 0.4]):
        f = [3100, 3700, 2800, 4200, 3300][k]
        t = t_(0.35)
        p.append((t0, 0.22 * (np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 1.52 * t)) * np.exp(-t * 16)))
    return mix(0.8, p)


def sino_vila():
    return mix(5.5, [(0.0, sino_nota(392)), (1.1, sino_nota(392, vel=0.55)), (2.2, sino_nota(392, 3.2, 0.6))])


def fogo_crepitar():
    """Laço de 6 s."""
    n = int(6 * SR)
    b = filtro(np.cumsum(ruido(n, 11)) * 0.01, lo=80, hi=900)
    b = b / (np.abs(b).max() + 1e-9) * 0.25
    b += filtro(ruido(n, 12), lo=1500, hi=6000) * 0.035
    r = np.random.default_rng(13)
    for _ in range(70):
        i = r.integers(0, n - 2000)
        e = estalo(r.uniform(0.15, 0.6), int(r.integers(1e6)), r.uniform(1500, 4000))
        b[i:i + len(e)] += e
    f = int(0.4 * SR)       # cruza o fim com o começo para o laço
    b[:f] = b[:f] * np.linspace(0, 1, f) + b[-f:] * np.linspace(1, 0, f)
    return b[:n - f]


def cali_bufo():
    return mix(0.5, [(0.0, 0.8 * grunhido(0.16, 110, 0.8, 1)), (0.12, 0.5 * sopro(0.3, 300, 2500, 6, 0.01, 0.2))])


def cali_espirro():
    return mix(0.9, [(0.0, 0.3 * tom(300, 620, 0.35, 'voz', 0.05, 0.02)), (0.42, 0.7 * sopro(0.22, 800, 6000, 8, 0.003, 0.15)),
                     (0.42, 0.6 * tom(900, 380, 0.18, 'voz', 0.003, 0.1)), (0.66, 0.25 * tom(500, 430, 0.1, 'voz'))])


def cali_alerta():
    return mix(0.6, [(0.0, 0.7 * grunhido(0.12, 150, 0.9, 2, 1.5)), (0.14, 0.6 * tom(420, 880, 0.28, 'voz', 0.01, 0.08, vib=0.02, vibf=14))])


def cali_grunhidos(perto):
    r = np.random.default_rng(5 if perto else 6)
    p, t0 = [], 0.0
    for k in range(6 if perto else 5):
        d = r.uniform(0.16, 0.3)
        p.append((t0, grunhido(d, r.uniform(85, 125), r.uniform(0.6, 1.0), k, r.uniform(0.9, 1.3))))
        t0 += d + r.uniform(0.08, 0.3)
    x = mix(t0 + 0.4, p)
    if not perto:
        x = filtro(x, hi=600) * 0.5
        x = x + 0.4 * np.concatenate([np.zeros(int(0.12 * SR)), x[:-int(0.12 * SR)]])
    return x


def galinha():
    p = []
    for k, t0 in enumerate([0.0, 0.14, 0.27, 0.42]):
        p.append((t0, 0.4 * tom(620 + 40 * k, 480, 0.07, 'voz', 0.004, 0.03)))
    p.append((0.56, 0.5 * tom(700, 1150, 0.22, 'voz', 0.01, 0.1, vib=0.03, vibf=18)))
    return mix(0.9, p)


def madeira_estalando():
    return mix(0.9, [(0.0, 0.8 * estalo(1, 1, 900)), (0.02, 0.5 * baque(160, 0.1)), (0.22, 0.5 * estalo(1, 2, 1400)), (0.4, 0.9 * estalo(1, 3, 700)),
                     (0.42, 0.5 * baque(120, 0.15)), (0.6, 0.3 * estalo(1, 4, 1800))])


def madeira_rangendo():
    return mix(1.5, [(0.0, rangido(0.7, 80, 1)), (0.6, 0.8 * rangido(0.8, 65, 2))])


def magia(falha=False):
    notas = ['D5', 'F#5', 'A5', 'D6'] if not falha else ['D5', 'F#5', 'A5', 'G#5', 'F5', 'C5']
    p = [(k * 0.09, celesta(n, 0.3, 0.4 if not falha or k < 3 else 0.3 - 0.06 * (k - 3))[:int(0.9 * SR)]) for k, n in enumerate(notas)]
    brilho = sopro(0.7, 5000, 12000, 7, 0.2, 0.4) * 0.05
    if falha:
        p.append((0.55, 0.35 * sopro(0.3, 300, 1800, 3, 0.005, 0.25)))
        p.append((0.5, 0.2 * tom(500, 180, 0.3, 'suave', 0.01, 0.2)))
    else:
        p.append((0.0, brilho))
    return mix(1.5, p) * 0.8


def brilho_colar():
    p = [(k * 0.16, celesta(n, 0.5, 0.5)) for k, n in enumerate(['A5', 'D6', 'F#6'])]      # começo do leitmotiv
    p.append((0.1, 0.06 * sopro(1.2, 6000, 14000, 2, 0.3, 0.8)))
    p.append((0.5, 0.2 * tom(1760, 1765, 1.4, 'sin', 0.3, 1.0, vib=0.004)))
    return mix(2.6, p)


def empurrao():
    return mix(0.5, [(0.0, 0.4 * sopro(0.16, 300, 2500, 5, 0.03, 0.05)), (0.12, 0.8 * baque(90, 0.25)), (0.14, 0.2 * estalo(1, 3, 600))])


def caixa_abrindo():
    return mix(1.3, [(0.0, 0.35 * estalo(1, 2, 2500)), (0.05, 0.25 * rangido(0.2, 320, 2)), (0.3, celesta('A5', 0.4, 0.4)), (0.5, celesta('D6', 0.6, 0.45))])


def item_obtido():
    p = [(k * 0.1, celesta(n, 0.3, 0.55)) for k, n in enumerate(['D5', 'F#5', 'A5', 'D6'])]
    p += [(k * 0.1, marimba(n, 0.3, 0.35)) for k, n in enumerate(['D4', 'F#4', 'A4', 'D5'])]
    p.append((0.4, celesta('F#6', 0.8, 0.4)))
    return mix(1.8, p)


def alcapao():
    return mix(1.1, [(0.0, rangido(0.45, 100, 4)), (0.42, 0.9 * baque(60, 0.4)), (0.44, 0.35 * estalo(1, 9, 500)), (0.46, 0.2 * sopro(0.2, 200, 1500, 3))])


def passos_acima_abafados():
    r = np.random.default_rng(8)
    p, t0 = [], 0.1
    for k in range(9):
        p.append((t0, r.uniform(0.5, 0.9) * baque(r.uniform(55, 75), 0.22)))
        t0 += r.uniform(0.22, 0.42)
    x = filtro(mix(t0 + 0.5, p), hi=260)
    return x + 0.03 * sopro(len(x) / SR, 100, 500, 4, 0.3, 0.5)[:len(x)]


def porta_arrombada_abafada():
    x = mix(1.6, [(0.0, baque(60, 0.5)), (0.03, 0.6 * estalo(1, 3, 500)), (0.05, 0.5 * sopro(0.4, 150, 1200, 7, 0.005, 0.3)),
                  (0.35, 0.5 * baque(80, 0.3)), (0.5, 0.3 * estalo(1, 5, 700)), (0.6, 0.3 * grunhido(0.25, 100, 0.8, 4))])
    return filtro(x, hi=420)


def grilos():
    """Laço de 6 s."""
    fx = Faixa(6.0)
    from musicas import grilos_camada
    grilos_camada(fx, 6.0, 0.3)
    return fx.buf.mean(axis=0)


def trovao_magico_longe():
    n = int(3.2 * SR)
    t = np.arange(n) / SR
    x = filtro(np.cumsum(ruido(n, 21)) * 0.01, lo=30, hi=160)
    x = x / (np.abs(x).max() + 1e-9) * np.exp(-t * 1.1) * (1 + 0.6 * np.exp(-((t - 0.9) / 0.2) ** 2))
    cint = 0.05 * sopro(1.5, 4000, 11000, 5, 0.02, 1.2)
    x[:len(cint)] += cint
    x[:int(1.5 * SR)] += 0.06 * tom(1320, 1240, 1.5, 'sin', 0.01, 1.2)
    return 0.8 * x * env(n, 0.01, 0.8)


def ui_texto():
    return 0.25 * tom(900, 860, 0.025, 'suave', 0.002, 0.015)


def ui_cursor():
    return marimba('A5', 0.1, 0.4)[:int(0.12 * SR)] * env(int(0.12 * SR), 0.001, 0.05)


def ui_confirmar():
    return mix(0.4, [(0.0, marimba('D5', 0.1, 0.5)[:int(0.3 * SR)]), (0.07, marimba('A5', 0.2, 0.55)[:int(0.3 * SR)])])


def ui_cancelar():
    return mix(0.4, [(0.0, marimba('A4', 0.1, 0.5)[:int(0.3 * SR)]), (0.07, marimba('E4', 0.2, 0.5)[:int(0.3 * SR)])])


def ui_alerta():
    return mix(0.5, [(0.0, 0.5 * tom(520, 780, 0.12, 'suave')), (0.13, 0.55 * tom(780, 1040, 0.2, 'suave', r=0.12))])


def fala(f, ronco=False):
    if ronco:
        return grunhido(0.05, f, 0.7, 1)
    return 0.3 * tom(f, f * 0.97, 0.035, 'suave', 0.003, 0.02)


SFX = dict(
    galo=galo, cafe_servindo=cafe_servindo,
    passaros_tarde=lambda: passaros(3.0, 9, 1), livro_fechando=livro_fechando, colher_cafe=colher_cafe, cesto_balanca=cesto_balanca,
    moedas=moedas, passaros_fugindo=bater_asas, sino_vila=sino_vila,
    fogo_crepitar=fogo_crepitar, cali_bufo=cali_bufo, cali_espirro=cali_espirro, cali_alerta=cali_alerta,
    cali_grunhidos_longe=lambda: cali_grunhidos(False), cali_grunhidos_perto=lambda: cali_grunhidos(True), galinha=galinha,
    madeira_estalando=madeira_estalando,
    madeira_rangendo=madeira_rangendo, magia_brilho_fraco=magia, magia_falha=lambda: magia(True), brilho_colar=brilho_colar,
    empurrao=empurrao, caixa_abrindo=caixa_abrindo, item_obtido=item_obtido, alcapao=alcapao,
    passos_acima_abafados=passos_acima_abafados, porta_arrombada_abafada=porta_arrombada_abafada, grilos=grilos,
    trovao_magico_longe=trovao_magico_longe,
    # interface (ids usados pelo motor) e bips de fala
    texto=ui_texto, cursor=ui_cursor, confirmar=ui_confirmar, cancelar=ui_cancelar, alerta=ui_alerta,
    fala_grave=lambda: fala(220), fala_media=lambda: fala(440), fala_aguda=lambda: fala(880), fala_ronco=lambda: fala(110, True),
)
PICO = dict(texto=0.3, cursor=0.4, fala_grave=0.35, fala_media=0.35, fala_aguda=0.3, fala_ronco=0.4, grilos=0.35, fogo_crepitar=0.5,
            passos_acima_abafados=0.6, cali_grunhidos_longe=0.4, trovao_magico_longe=0.6, passaros_tarde=0.45, magia_brilho_fraco=0.5)


def main(ids):
    for i in ids:
        x = SFX[i]()
        x = x / (np.abs(x).max() + 1e-9) * PICO.get(i, 0.7)
        if i not in ('fogo_crepitar', 'grilos'):
            nf = min(len(x), int(0.01 * SR))
            x[-nf:] *= np.linspace(1, 0, nf)
        exporta(x, os.path.join(DEST, i), mp3=False, q=3)
        print(i, round(len(x) / SR, 2), 's')


if __name__ == '__main__':
    main(sys.argv[1:] or list(SFX))
