"""As músicas do prólogo, compostas como dados e renderizadas em laço sem emenda.

Uso: python3 tools/audio/musicas.py [id ...]

Notação das trilhas: "NOTA:duração" em tempos (ex.: "F#5:1.5"), "-" = pausa, "A3+E4:2" = acorde,
"@0.5" no fim muda a intensidade. "|" é só separador visual de compasso.
"""
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
import numpy as np
from synth import Faixa, exporta, midi, RAIZ, SR, filtro, ruido, t_

DEST = os.path.join(RAIZ, 'assets', 'audio', 'music')

ACORDES = {
    'D': 'D3 A3 D4 F#4', 'Bm': 'B2 F#3 B3 D4', 'G': 'G2 D3 G3 B3', 'A': 'A2 E3 A3 C#4', 'A7': 'A2 E3 G3 C#4', 'F#m': 'F#2 C#3 F#3 A3',
    'Em': 'E2 B2 E3 G3', 'C': 'C3 G3 C4 E4', 'Am': 'A2 E3 A3 C4', 'Dm': 'D3 A3 D4 F4', 'F': 'F2 C3 F3 A3', 'Bb': 'Bb2 F3 Bb3 D4',
    'Gm': 'G2 D3 G3 Bb3', 'E': 'E2 B2 E3 G#3', 'C7': 'C3 G3 Bb3 E4', 'Dsus': 'D3 A3 D4 G4', 'Asus': 'A2 E3 A3 D4', 'Csus': 'C3 G3 C4 F4',
}


def seq(texto):
    """→ [(t0, dur, [notas], vel)] em tempos."""
    out, t = [], 0.0
    for tok in texto.replace('|', ' ').split():
        vel = None
        if '@' in tok:
            tok, v = tok.split('@')
            vel = float(v)
        n, d = tok.split(':')
        d = float(d)
        if n != '-':
            out.append((t, d, n.split('+'), vel))
        t += d
    return out, t


def toca(fx, instr, texto, bpm, t0=0.0, vel=0.7, ganho=1.0, oitava=0, legato=1.0):
    spb = 60 / bpm
    notas, total = seq(texto)
    for (t, d, ns, v) in notas:
        for n in ns:
            fx.nota(instr, midi(n) + 12 * oitava, (t0 + t) * spb, d * spb * legato, v if v is not None else vel, ganho)
    return total


def dedilhado(fx, acordes, bpm, t0=0.0, padrao=(0, 1, 2, 3, 2, 1, 2, 3), sub=0.5, vel=0.6, instr='violao', ganho=1.0, por_compasso=4):
    """Um acorde por compasso (ou "D/2 A/2" para dividir), dedilhado em colcheias."""
    spb = 60 / bpm
    t = t0
    for comp in acordes.split('|'):
        partes = comp.split()
        for p in partes:
            ac = ACORDES[p].split()
            dur = por_compasso / len(partes)
            passos = int(round(dur / sub))
            for i in range(passos):
                k = padrao[i % len(padrao)]
                v = vel * (1.0 if i == 0 else 0.72 + 0.1 * ((i * 7) % 3))
                fx.nota(instr, ac[k % len(ac)], (t + i * sub) * spb, sub * spb * 2, v, ganho)
            t += dur
    return t - t0


def batida(fx, instr, padrao, bpm, compassos, t0=0.0, sub=0.5, vel=0.5, ganho=1.0, por_compasso=4):
    """padrao: string por compasso, 'x' forte, 'o' fraco, '.' silêncio (uma casa por subdivisão)."""
    spb = 60 / bpm
    for c in range(compassos):
        for i, ch in enumerate(padrao):
            if ch != '.':
                fx.nota(instr, 0, (t0 + c * por_compasso + i * sub) * spb, 0.1, vel * (1.0 if ch == 'x' else 0.55), ganho)


# O leitmotiv do triskelion (tema_mae): 8 notas.
MOTIVO = 'A4:1 D5:1 F#5:1.5 E5:.5 D5:1 B4:1 D5:1 A4:1'

CASA_MEL = ('F#5:1.5 E5:.5 D5:1 A4:1 | B4:1.5 D5:.5 F#5:2 | G5:1 F#5:1 E5:1 D5:1 | E5:3 -:1 | '
            'F#5:1.5 E5:.5 D5:1 A5:1 | A5:1.5 F#5:.5 C#5:2 | B4:1 D5:1 G5:1 F#5:1 | E5:1 D5:1 C#5:2')
CASA_HARM = 'D|Bm|G|A|D|F#m|G|A7'


def tema_casa():
    bpm, comp = 80, 16
    fx = Faixa(comp * 4 * 60 / bpm)
    dedilhado(fx, CASA_HARM + '|' + CASA_HARM, bpm, vel=0.62)
    # marimba marcando de leve (tempos 2 e 4) e sugerindo a melodia na primeira volta
    toca(fx, 'marimba', ' '.join(['-:1 %s:1 -:1 %s:1' % (a, b) for a, b in
                                  [('F#4', 'A4'), ('F#4', 'B4'), ('G4', 'B4'), ('E4', 'A4'), ('F#4', 'A4'), ('F#4', 'A4'), ('G4', 'B4'), ('E4', 'G4')] * 2]), bpm, vel=0.42)
    toca(fx, 'marimba', CASA_MEL, bpm, vel=0.38, oitava=-1, ganho=0.8)
    toca(fx, 'flauta', CASA_MEL, bpm, t0=32, vel=0.62, legato=0.95)      # a flauta entra na segunda volta
    toca(fx, 'pad', 'D3+A3:8 G3+B3:4 A3+E4:4 D3+A3:4 F#3+A3:4 G3+D4:4 A3+E4:4', bpm, t0=32, vel=0.35)
    batida(fx, 'shaker', '..o...o.', bpm, 8, t0=32, vel=0.5)
    return fx, bpm


def tema_pai():
    bpm, comp = 60, 16
    fx = Faixa(comp * 4 * 60 / bpm)
    harm = CASA_HARM + '|' + CASA_HARM
    dedilhado(fx, harm, bpm, padrao=(0, 2, 1, 3), sub=1.0, vel=0.5)
    toca(fx, 'violao', CASA_MEL, bpm, vel=0.72, oitava=-1)
    toca(fx, 'violao', CASA_MEL, bpm, t0=32, vel=0.74, oitava=-1)
    # cordas leves entram na promessa (segunda volta)
    toca(fx, 'cordas', 'D4+F#4:4 D4+F#4:4 D4+G4:4 C#4+E4:4 D4+A4:4 C#4+F#4:4 D4+G4:4 C#4+E4:2 C#4+G4:2', bpm, t0=32, vel=0.5)
    toca(fx, 'cordas', 'D3:8 G3:4 A3:4 D3:4 F#3:4 G3:4 A3:4', bpm, t0=32, vel=0.4)
    return fx, bpm


CAFEZAL_MEL = ('D5:.5 G5:.5 B5:1 A5:.5 G5:.5 E5:1 | G5:1.5 E5:.5 D5:2 | E5:.5 G5:.5 C6:1 B5:.5 A5:.5 G5:1 | A5:3 -:1 | '
               'D5:.5 G5:.5 B5:1 D6:1 B5:1 | G5:1.5 B5:.5 E5:2 | C6:1 A5:1 E5:1 A5:1 | F#5:1 A5:1 D5:2')
CAFEZAL_MEL2 = ('D5:.5 G5:.5 B5:1 A5:.5 G5:.5 E5:1 | G5:1.5 E5:.5 D5:2 | E5:.5 G5:.5 C6:1 B5:.5 A5:.5 G5:1 | A5:2 B5:1 A5:1 | '
                'D6:1.5 B5:.5 G5:1 B5:1 | G5:1.5 E5:.5 E5:2 | C6:.5 B5:.5 A5:1 E5:1 A5:1 | F#5:1 E5:1 D5:2')


def tema_cafezal():
    bpm, comp = 96, 16
    fx = Faixa(comp * 4 * 60 / bpm)
    harm = 'G|Em|C|D|G|Em|Am|D'
    dedilhado(fx, harm + '|' + harm, bpm, padrao=(0, 2, 1, 2, 3, 2, 1, 2), vel=0.6)
    toca(fx, 'flauta', CAFEZAL_MEL, bpm, vel=0.64, legato=0.9)
    toca(fx, 'flauta', CAFEZAL_MEL2, bpm, t0=32, vel=0.66, legato=0.9)
    # marimba em contratempo
    off = {'G': 'B3+D4', 'Em': 'B3+E4', 'C': 'C4+E4', 'D': 'A3+D4', 'Am': 'C4+E4'}
    toca(fx, 'marimba', ' '.join('-:.5 %s:.5 -:.5 %s:.5 -:.5 %s:.5 -:.5 %s:.5' % ((off[a],) * 4) for a in (harm.split('|') * 2)), bpm, vel=0.36)
    # cordas leves no fim da frase
    for t0 in (12, 28, 44, 60):
        toca(fx, 'cordas', 'D4+F#4+A4:4' if t0 in (12, 44) else 'D4+F#4+C5:4', bpm, t0=t0, vel=0.42)
    batida(fx, 'shaker', 'o.o.o.o.', bpm, 16, vel=0.38)
    return fx, bpm


def tema_tensao():
    bpm, comp = 120, 16
    fx = Faixa(comp * 4 * 60 / bpm)
    ost = {'Am': 'A2:.5 E3:.5 A3:.5 E3:.5 C3:.5 E3:.5 A3:.5 E3:.5', 'F': 'F2:.5 C3:.5 F3:.5 C3:.5 A2:.5 C3:.5 F3:.5 C3:.5',
           'G': 'G2:.5 D3:.5 G3:.5 D3:.5 B2:.5 D3:.5 G3:.5 D3:.5', 'Dm': 'D3:.5 A3:.5 D4:.5 A3:.5 F3:.5 A3:.5 D4:.5 A3:.5',
           'E': 'E2:.5 B2:.5 E3:.5 B2:.5 G#2:.5 B2:.5 E3:.5 B2:.5'}
    harm = ['Am', 'Am', 'F', 'G', 'Am', 'Am', 'Dm', 'E'] * 2
    toca(fx, 'marimba', ' '.join(ost[h] for h in harm), bpm, vel=0.62)                      # marimba grave em ostinato
    stab = {'Am': 'A3+C4+E4', 'F': 'A3+C4+F4', 'G': 'B3+D4+G4', 'Dm': 'A3+D4+F4', 'E': 'G#3+B3+E4'}
    toca(fx, 'pizz', ' '.join('-:1 %s:1 -:.5 %s:.5 %s:1' % ((stab[h],) * 3) for h in harm), bpm, vel=0.5)    # cordas em pizzicato
    raiz = {'Am': 'A2', 'F': 'F2', 'G': 'G2', 'Dm': 'D3', 'E': 'E2'}
    toca(fx, 'abafado', ' '.join('%s:1 %s:1 %s:1 %s:1' % ((raiz[h],) * 4) for h in harm), bpm, vel=0.55)     # violão abafado no pulso
    mel = 'E5:1 -:.5 E5:.5 D5:1 C5:1 | B4:2 -:2 | C5:1 -:.5 C5:.5 A4:1 C5:1 | D5:2 B4:2 | E5:1 -:.5 E5:.5 G5:1 E5:1 | A5:2 -:2 | F5:1 E5:1 D5:1 F5:1 | E5:3 -:1'
    toca(fx, 'pizz', mel, bpm, t0=32, vel=0.6)
    toca(fx, 'cordas', 'A3:8 F3:4 G3:4 A3:8 D3:4 E3:4', bpm, t0=32, vel=0.3)
    batida(fx, 'shaker', 'x.o.x.oo', bpm, 16, vel=0.4)
    return fx, bpm


def tema_vila_em_chamas():
    bpm, comp = 104, 16
    fx = Faixa(comp * 4 * 60 / bpm)
    harm = ['Dm', 'Dm', 'Gm', 'A', 'Dm', 'Bb', 'Gm', 'A'] * 2
    baixo = {'Dm': 'D3:1 -:.5 A2:.5 D3:1 F3:1', 'Gm': 'G2:1 -:.5 D3:.5 G2:1 Bb2:1', 'A': 'A2:1 -:.5 E3:.5 A2:1 C#3:1', 'Bb': 'Bb2:1 -:.5 F3:.5 Bb2:1 D3:1'}
    toca(fx, 'marimba', ' '.join(baixo[h] for h in harm), bpm, vel=0.55)                    # na ponta dos pés
    stab = {'Dm': 'F4+A4', 'Gm': 'G4+Bb4', 'A': 'E4+G4', 'Bb': 'F4+Bb4'}
    toca(fx, 'pizz', ' '.join('-:.5 %s:.5 -:1 -:.5 %s:.5 -:1' % ((stab[h],) * 2) for h in harm), bpm, vel=0.46)
    # flauta grave em notas curtas
    fl = 'D4:.5 -:.5 F4:.5 -:.5 E4:.5 -:1.5 | -:4 | G4:.5 -:.5 Bb4:.5 -:.5 A4:.5 -:1.5 | -:2 E4:.5 -:.5 C#4:.5 -:.5 | D4:.5 -:.5 F4:.5 -:.5 A4:.5 -:1.5 | -:4 | Bb4:.5 -:.5 A4:.5 -:.5 G4:.5 -:1.5 | A4:1 -:3'
    toca(fx, 'flauta', fl + ' | ' + fl, bpm, vel=0.5, legato=0.6)
    # motivo "desajeitado" dos Caligosuins: tropeça cromático, sempre um tiquinho atrasado
    desaj = '-:2.25 D5:.25 Eb5:.5 D5:.5 -:.5 | -:.25 F5:.5 E5:.25 Eb5:.5 D5:.5 -:2'
    for t0 in (4, 20, 36, 52):
        toca(fx, 'marimba', desaj, bpm, t0=t0, vel=0.6)
    toca(fx, 'bloco', '-:3.5 C5:.5', bpm, t0=12, vel=0.4)
    toca(fx, 'bloco', '-:3.5 C5:.5', bpm, t0=44, vel=0.4)
    batida(fx, 'shaker', '..o...o.', bpm, 16, vel=0.32)
    return fx, bpm


def gota(fx, t, f0=1500, vel=0.25, pan=0.0):
    tt = t_(0.09)
    x = np.sin(2 * np.pi * np.cumsum(f0 * (1 + 0.5 * np.exp(-tt * 60))) / SR) * np.exp(-tt * 45)
    fx.soma(vel * x, t, pan)


def tema_tunel():
    dur = 36.0
    fx = Faixa(dur)
    # um pad sustentado que respira (sem pulso)
    for t0, ns in [(0, 'D3 A3 E4'), (9, 'D3 A3 F4'), (18, 'Bb2 F3 D4'), (27, 'C3 G3 E4')]:
        for n in ns.split():
            fx.nota('pad', n, t0, 9.5, 0.5)
    for t0, n in [(3.0, 'A5'), (11.5, 'F5'), (16.0, 'E5'), (22.5, 'D5'), (30.0, 'G5'), (33.5, 'E5')]:
        fx.nota('celesta', n, t0, 2, 0.33)             # uma nota de celesta de vez em quando
    for i, t in enumerate([1.2, 5.9, 8.1, 13.3, 19.6, 21.0, 26.2, 31.4, 34.8]):
        gota(fx, t, 1300 + 250 * (i % 3), 0.2, -0.6 + 0.4 * (i % 4))     # goteira
    return fx, 0


def grilos_camada(fx, dur, vel=0.06):
    rng = np.random.default_rng(5)
    for voz, (f, per, pan) in enumerate([(4300, 0.62, -0.7), (4750, 0.81, 0.6), (3900, 1.13, 0.1)]):
        t = rng.uniform(0, per)
        while t < dur - 0.3:
            for k in range(3):
                tt = t_(0.035)
                x = np.sin(2 * np.pi * f * tt) * np.sin(np.pi * tt / 0.035) ** 2
                fx.soma(vel * x, t + k * 0.055, pan)
            t += per * rng.uniform(0.9, 1.25)


def tema_noite_esperanca():
    bpm, comp = 70, 16
    fx = Faixa(comp * 4 * 60 / bpm)
    harm = 'F|Dm|Bb|C|F|Am|Bb|Csus C'
    dedilhado(fx, harm + '|' + harm, bpm, padrao=(0, 1, 2, 3, 2, 1, 2, 1), vel=0.55)
    mel = 'A5:2 G5:1 F5:1 | F5:1.5 E5:.5 D5:2 | D5:1 F5:1 Bb5:1 A5:1 | G5:3 -:1 | A5:2 C6:1 A5:1 | G5:1.5 E5:.5 C5:2 | D5:1 F5:1 G5:1 A5:1 | G5:2 E5:2'
    mel2 = 'C5:1 F5:1 A5:1.5 G5:.5 | F5:1 D5:1 F5:1 C5:1 | D5:1 F5:1 Bb5:1 A5:1 | G5:3 -:1 | A5:2 C6:1 A5:1 | G5:1.5 E5:.5 C5:2 | D5:1 F5:1 A5:1 G5:1 | F5:2 E5:2'
    toca(fx, 'flauta', mel, bpm, vel=0.55, legato=0.97)
    toca(fx, 'flauta', mel2, bpm, t0=32, vel=0.58, legato=0.97)      # começa com o motivo da mãe, transposto
    toca(fx, 'pad', 'F3+C4:4 D3+A3:4 Bb2+F3:4 C3+G3:4 F3+C4:4 A2+E3:4 Bb2+F3:4 C3+G3:4', bpm, t0=32, vel=0.32)
    grilos_camada(fx, fx.dur)
    return fx, bpm


def tema_triskelion():
    bpm, comp = 72, 16
    fx = Faixa(comp * 4 * 60 / bpm)
    m2 = 'A4:1 D5:1 F#5:1.5 E5:.5 D5:1 B4:1 D5:1 A4:1 | B4:1 D5:1 G5:1.5 F#5:.5 E5:1 A5:1 F#5:2'
    m3 = 'A4:1 D5:1 F#5:1.5 E5:.5 D5:1 B4:1 D5:1 A5:1 | B5:1 A5:1 G5:1.5 F#5:.5 E5:1 C#5:1 D5:2'
    toca(fx, 'celesta', m2, bpm, vel=0.62)                                             # começa pequeno
    toca(fx, 'pad', 'D3+A3:8 G3+D4:4 A3+E4:4', bpm, vel=0.22)
    dedilhado(fx, 'D|Bm|G|A', bpm, t0=16, vel=0.58)                                    # o violão assume
    toca(fx, 'violao', m2, bpm, t0=16, vel=0.75)
    toca(fx, 'celesta', '-:3 A5:1 -:3 F#5:1 -:3 B5:1 -:3 A5:1', bpm, t0=16, vel=0.35)
    dedilhado(fx, 'D|Bm|G|A|D|F#m|G|A7', bpm, t0=32, vel=0.6)                          # ...e abre
    toca(fx, 'flauta', m3 + ' | ' + m2, bpm, t0=32, vel=0.66, legato=0.95)
    toca(fx, 'cordas', 'D4+F#4+A4:4 D4+F#4+B4:4 D4+G4+B4:4 C#4+E4+A4:4 D4+F#4+A4:4 C#4+F#4+A4:4 D4+G4+B4:4 C#4+E4+G4:4', bpm, t0=32, vel=0.55)
    toca(fx, 'cordas', 'D3:4 B2:4 G2:4 A2:4 D3:4 F#2:4 G2:4 A2:4', bpm, t0=32, vel=0.45)
    toca(fx, 'celesta', m3 + ' | ' + m2, bpm, t0=32, vel=0.3, oitava=1)
    batida(fx, 'shaker', '..o...o.', bpm, 8, t0=32, vel=0.35)
    return fx, bpm


def tema_mae():
    """Leitmotiv do triskelion: 8 notas de caixinha de música (4 s + cauda)."""
    bpm = 120
    fx = Faixa(4.0, laco=False, cauda=2.2)
    toca(fx, 'celesta', MOTIVO, bpm, vel=0.7)
    toca(fx, 'celesta', MOTIVO, bpm, vel=0.22, oitava=1)
    return fx, bpm


def tema_lenda():
    """Narração de abertura: celesta sozinha, depois um pad de cordas. 20 s, sem laço."""
    bpm = 60
    fx = Faixa(20.0, laco=False, cauda=2.5)
    toca(fx, 'celesta', 'D5:1.5 A4:.5 D5:1 F5:1 | E5:2 C5:2 | D5:1.5 A4:.5 F5:1 A5:1 | G5:2 E5:2 | F5:1 E5:1 D5:1 A4:1', bpm, vel=0.6)
    toca(fx, 'celesta', '-:8 D4:4 C4:4 Bb3:2 A3:2', bpm, vel=0.4)
    toca(fx, 'cordas', 'D3+A3+F4:4 C3+G3+E4:4 Bb2+F3+D4:2 A2+E3+C#4:2', bpm, t0=8, vel=0.5)
    toca(fx, 'pad', 'D3+A3:6 D3+A3+D4:6', bpm, t0=8, vel=0.4)
    return fx, bpm


TEMAS = dict(tema_lenda=tema_lenda, tema_casa=tema_casa, tema_cafezal=tema_cafezal, tema_tensao=tema_tensao,
             tema_vila_em_chamas=tema_vila_em_chamas, tema_pai=tema_pai, tema_mae=tema_mae, tema_tunel=tema_tunel,
             tema_noite_esperanca=tema_noite_esperanca, tema_triskelion=tema_triskelion)
REVERB = dict(tema_tunel=(0.45, 2.6), tema_lenda=(0.3, 2.2), tema_mae=(0.3, 2.0), tema_pai=(0.24, 1.9), tema_tensao=(0.14, 1.2), tema_vila_em_chamas=(0.16, 1.3))

PICO = dict(tema_tunel=0.45, tema_mae=0.6, tema_lenda=0.7, tema_pai=0.72, tema_noite_esperanca=0.7, tema_casa=0.78)


def main(ids):
    os.makedirs(DEST, exist_ok=True)
    mpath = os.path.join(DEST, 'manifest.json')
    manifesto = {m['id']: m for m in json.load(open(mpath))} if os.path.exists(mpath) else {}
    for i in ids:
        fx, bpm = TEMAS[i]()
        fx.reverb(*REVERB.get(i, (0.2, 1.7)))
        b = fx.final(PICO.get(i, 0.82))
        exporta(b, os.path.join(DEST, i))
        manifesto[i] = dict(id=i, arquivo=f'{i}.ogg', mp3=f'{i}.mp3', loop=fx.laco, loopStart=0.0,
                            loopEnd=round(fx.n / SR, 4), duracao=round(fx.n / SR, 4), bpm=bpm)
        print(i, round(fx.n / SR, 2), 's')
    if 'tema_triskelion' in ids:        # a tela de título do motor toca `titulo`
        for ext in ('ogg', 'mp3'):
            open(os.path.join(DEST, 'titulo.' + ext), 'wb').write(open(os.path.join(DEST, 'tema_triskelion.' + ext), 'rb').read())
        manifesto['titulo'] = dict(manifesto['tema_triskelion'], id='titulo', arquivo='titulo.ogg', mp3='titulo.mp3')
    json.dump([manifesto[k] for k in sorted(manifesto)], open(mpath, 'w'), ensure_ascii=False, indent=1)


if __name__ == '__main__':
    main(sys.argv[1:] or list(TEMAS))
