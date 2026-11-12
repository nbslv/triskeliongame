"""Síntese dos instrumentos suaves do jogo (numpy) e exportação OGG/MP3 (ffmpeg).

Paleta única (decisão do autor): violão dedilhado, marimba, flauta, celesta, cordas leves e pads.
"""
import os, subprocess, wave
import numpy as np

SR = 44100
RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
NOTAS = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}


def midi(n):
    """'F#4' → 66. Aceita número."""
    if isinstance(n, (int, float)):
        return n
    p = NOTAS[n[0]]
    i = 1
    while n[i] in '#b':
        p += 1 if n[i] == '#' else -1
        i += 1
    return p + 12 * (int(n[i:]) + 1)


def hz(m):
    return 440.0 * 2 ** ((midi(m) - 69) / 12)


def t_(dur):
    return np.arange(int(dur * SR)) / SR


def env(n, a=0.005, r=0.05):
    e = np.ones(n)
    na, nr = max(1, int(a * SR)), max(1, int(r * SR))
    na, nr = min(na, n), min(nr, n)
    e[:na] *= np.linspace(0, 1, na)
    e[-nr:] *= np.linspace(1, 0, nr)
    return e


def filtro(x, lo=None, hi=None, ordem=2.0):
    """Passa-baixa/alta suave por FFT (lo = corta abaixo, hi = corta acima)."""
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    g = np.ones_like(f)
    if hi:
        g *= 1 / (1 + (f / hi) ** (2 * ordem))
    if lo:
        g *= 1 - 1 / (1 + (f / lo) ** (2 * ordem))
    return np.fft.irfft(X * g, len(x))


def ruido(n, seed=0):
    return np.random.default_rng(seed).uniform(-1, 1, n)


# ------------------------------------------------------------------ instrumentos (nota, duração em s, vel 0..1)

def violao(nota, dur, vel=0.8, abafado=False):
    f = hz(nota)
    cauda = 0.35 if abafado else 1.6
    t = t_(dur + cauda) if not abafado else t_(min(dur, 0.12) + cauda)
    x = np.zeros_like(t)
    for h in range(1, 11):
        if f * h > 9000:
            break
        amp = (1.0 / h) * (0.55 + 0.45 * np.cos(h * 0.9))      # ponto do dedilhado
        d = (1.6 + 0.9 * h) * (6 if abafado else 1)
        x += amp * np.exp(-t * d) * np.sin(2 * np.pi * f * h * (1 + 0.0004 * h * h) * t)
    x *= env(len(t), 0.003, 0.08)
    x[:200] += 0.12 * ruido(200, int(f)) * np.linspace(1, 0, 200)   # ataque da unha
    return 0.5 * vel * x


def marimba(nota, dur, vel=0.8):
    f = hz(nota)
    t = t_(0.9 if f > 180 else 1.3)
    x = np.exp(-t * (5.0 if f > 180 else 3.2)) * np.sin(2 * np.pi * f * t)
    x += 0.28 * np.exp(-t * 16) * np.sin(2 * np.pi * f * 3.93 * t)
    x += 0.10 * np.exp(-t * 30) * np.sin(2 * np.pi * f * 9.6 * t)
    return 0.55 * vel * x * env(len(t), 0.002, 0.1)


def flauta(nota, dur, vel=0.7):
    f = hz(nota)
    t = t_(dur + 0.12)
    vib = 1 + 0.004 * np.sin(2 * np.pi * 5.2 * t) * np.clip(t / 0.35, 0, 1)
    ph = 2 * np.pi * np.cumsum(f * vib) / SR
    x = np.sin(ph) + 0.22 * np.sin(2 * ph) + 0.07 * np.sin(3 * ph)
    sopro = filtro(ruido(len(t), int(f * 3)), lo=f * 1.5, hi=f * 5) * 0.10
    e = env(len(t), 0.06, 0.12) * (0.85 + 0.15 * np.sin(2 * np.pi * 5.2 * t))
    return 0.34 * vel * (x + sopro) * e


def celesta(nota, dur, vel=0.7):
    f = hz(nota)
    t = t_(2.4)
    x = np.exp(-t * 2.6) * np.sin(2 * np.pi * f * t)
    x += 0.35 * np.exp(-t * 5.5) * np.sin(2 * np.pi * f * 2.0 * t)
    x += 0.22 * np.exp(-t * 9) * np.sin(2 * np.pi * f * 4.07 * t)
    x += 0.10 * np.exp(-t * 22) * np.sin(2 * np.pi * f * 6.3 * t)
    return 0.42 * vel * x * env(len(t), 0.002, 0.2)


def cordas(nota, dur, vel=0.6, pizz=False):
    f = hz(nota)
    if pizz:
        t = t_(0.5)
        x = sum((1 / h) * np.exp(-t * (7 + 3 * h)) * np.sin(2 * np.pi * f * h * t) for h in range(1, 7))
        return 0.5 * vel * x * env(len(t), 0.003, 0.05)
    t = t_(dur + 0.5)
    x = np.zeros_like(t)
    for det in (-0.006, 0.0, 0.007):
        ff = f * (1 + det)
        vib = 1 + 0.003 * np.sin(2 * np.pi * (4.6 + det * 40) * t)
        ph = 2 * np.pi * np.cumsum(ff * vib) / SR
        for h in range(1, 7):
            if ff * h < 5000:
                x += (1 / h ** 1.25) * np.sin(h * ph + det * 300)
    a = min(0.35, dur * 0.4)
    return 0.11 * vel * x * env(len(t), a, 0.5)


def pad(nota, dur, vel=0.5):
    f = hz(nota)
    t = t_(dur + 1.5)
    x = np.zeros_like(t)
    for det in (-0.004, 0.003, 0.0):
        x += np.sin(2 * np.pi * f * (1 + det) * t) + 0.3 * np.sin(2 * np.pi * 2 * f * (1 - det) * t) + 0.08 * np.sin(2 * np.pi * 3 * f * t)
    return 0.12 * vel * x * env(len(t), min(1.2, dur * 0.45), 1.5)


def shaker(nota=0, dur=0.1, vel=0.5):
    n = int(0.07 * SR)
    return 0.16 * vel * filtro(ruido(n, 7), lo=5000) * np.exp(-np.arange(n) / (0.012 * SR))


def bumbo(nota=0, dur=0.2, vel=0.6):
    t = t_(0.28)
    ph = 2 * np.pi * np.cumsum(55 + 60 * np.exp(-t * 28)) / SR
    return 0.5 * vel * np.sin(ph) * np.exp(-t * 13)


def bloco(nota=0, dur=0.1, vel=0.5):
    t = t_(0.12)
    return 0.3 * vel * np.sin(2 * np.pi * 880 * t) * np.exp(-t * 55)


INSTR = dict(violao=violao, marimba=marimba, flauta=flauta, celesta=celesta, cordas=cordas, pad=pad,
             shaker=shaker, bumbo=bumbo, bloco=bloco,
             pizz=lambda n, d, v=0.6: cordas(n, d, v, True), abafado=lambda n, d, v=0.6: violao(n, d, v, True))
PAN = dict(violao=-0.25, marimba=0.3, flauta=0.12, celesta=-0.1, cordas=0.0, pad=0.0, shaker=0.35, bumbo=0.0, bloco=-0.3, pizz=0.2, abafado=-0.3)


# ------------------------------------------------------------------ mixagem

class Faixa:
    def __init__(s, dur, laco=True, cauda=0.0):
        s.dur, s.laco = dur, laco
        s.n = int(round((dur + (0 if laco else cauda)) * SR))
        s.buf = np.zeros((2, s.n))

    def soma(s, x, t0, pan=0.0, ganho=1.0):
        i0 = int(round(t0 * SR))
        gl, gr = np.cos((pan + 1) * np.pi / 4) * ganho, np.sin((pan + 1) * np.pi / 4) * ganho
        if s.laco:
            idx = (i0 + np.arange(len(x))) % s.n
            np.add.at(s.buf[0], idx, x * gl)
            np.add.at(s.buf[1], idx, x * gr)
        else:
            if i0 >= s.n:
                return
            x = x[:s.n - i0]
            s.buf[0, i0:i0 + len(x)] += x * gl
            s.buf[1, i0:i0 + len(x)] += x * gr

    def nota(s, instr, nota, t0, dur, vel=0.7, ganho=1.0):
        s.soma(INSTR[instr](nota, dur, vel), t0, PAN.get(instr, 0), ganho)

    def reverb(s, molhado=0.2, tempo=1.7):
        n = int(tempo * SR)
        for c in range(2):
            ir = np.zeros(s.n)
            m = min(n, s.n)
            ir[:m] = ruido(m, 100 + c) * np.exp(-np.arange(m) / (tempo * SR / 5.5))
            ir[:int(0.012 * SR)] = 0
            ir = filtro(ir, lo=250, hi=5000)
            ir /= np.sqrt(np.sum(ir ** 2)) + 1e-9
            w = np.fft.irfft(np.fft.rfft(s.buf[c]) * np.fft.rfft(ir), s.n)   # convolução circular = laço sem emenda
            s.buf[c] = s.buf[c] + molhado * w

    def final(s, pico=0.82):
        m = np.max(np.abs(s.buf)) + 1e-9
        b = np.tanh(s.buf / m * 1.15) / np.tanh(1.15) * pico
        if not s.laco:
            nf = int(0.05 * SR)
            b[:, -nf:] *= np.linspace(1, 0, nf)
        return b


def exporta(b, caminho_sem_ext, mp3=True, q=4):
    """b: array (2, n) ou (n,). Grava .ogg (Vorbis) e, se pedido, .mp3."""
    os.makedirs(os.path.dirname(caminho_sem_ext), exist_ok=True)
    if b.ndim == 1:
        b = np.stack([b, b])
    pcm = (np.clip(b.T, -1, 1) * 32767).astype('<i2')
    wav = caminho_sem_ext + '.tmp.wav'
    with wave.open(wav, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav, '-c:a', 'libvorbis', '-q:a', str(q), caminho_sem_ext + '.ogg'], check=True)
    if mp3:
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav, '-c:a', 'libmp3lame', '-b:a', '128k', caminho_sem_ext + '.mp3'], check=True)
    os.remove(wav)
