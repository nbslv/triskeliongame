import Phaser from 'phaser';
import { bus } from './events';
import { settings } from './settings';
import { musicMeta, musicUrls } from '../content';

/**
 * Áudio: música com crossfade e efeitos sonoros.
 * - Se existir arquivo em assets/audio/music/<id>.(ogg|mp3) ou assets/audio/sfx/<id>.*, usa o arquivo.
 * - Senão, toca um PROVISÓRIO gerado por Web Audio (melodia simples / bipe), para nunca ficar mudo
 *   nem quebrar por falta de arquivo enquanto a sessão de arte não entrega o áudio.
 */

interface Track {
  id: string;
  /** Volume-alvo relativo da faixa (0..1). */
  volume: number;
  /** Ganho atual do fade (0..1). */
  fade: number;
  fadeFrom: number;
  fadeTo: number;
  fadeStart: number;
  fadeMs: number;
  /** Arquivo de música: fonte Web Audio (com loopStart/loopEnd) e ganho próprio. */
  source?: AudioBufferSourceNode;
  gain?: GainNode;
  synth?: ProceduralMusic;
  /** Faixa sem laço terminou. */
  ended?: boolean;
}

const SCALES = [
  [0, 2, 4, 7, 9], // pentatônica maior
  [0, 3, 5, 7, 10], // pentatônica menor
  [0, 2, 3, 5, 7, 8, 10], // menor natural
  [0, 2, 4, 5, 7, 9, 11], // maior
];

function hash(s: string): number {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  return h;
}

class ProceduralMusic {
  readonly gain: GainNode;
  private timer: number | undefined;
  private nextTime = 0;
  private stepIdx = 0;
  private readonly pattern: number[];
  private readonly bass: number[];
  private readonly scale: number[];
  private readonly root: number;
  private readonly stepDur: number;

  constructor(private readonly ctx: AudioContext, dest: AudioNode, id: string) {
    const h = hash(id);
    this.gain = ctx.createGain();
    this.gain.gain.value = 0;
    this.gain.connect(dest);
    this.scale = SCALES[h % SCALES.length]!;
    this.root = 48 + (h >>> 4) % 12;
    this.stepDur = 60 / (70 + ((h >>> 8) % 50)) / 2;
    let s = h;
    const rnd = () => ((s = (Math.imul(s, 1103515245) + 12345) >>> 0) >>> 16) / 65536;
    this.pattern = Array.from({ length: 16 }, () => (rnd() < 0.3 ? -1 : Math.floor(rnd() * this.scale.length * 1.5)));
    this.bass = Array.from({ length: 4 }, () => Math.floor(rnd() * this.scale.length));
  }

  start(): void {
    this.nextTime = this.ctx.currentTime + 0.05;
    const tick = () => {
      while (this.nextTime < this.ctx.currentTime + 0.25) {
        this.scheduleStep(this.stepIdx++, this.nextTime);
        this.nextTime += this.stepDur;
      }
    };
    tick();
    this.timer = window.setInterval(tick, 80);
  }

  stop(): void {
    window.clearInterval(this.timer);
    window.setTimeout(() => this.gain.disconnect(), 200);
  }

  private midiToHz(m: number): number {
    return 440 * Math.pow(2, (m - 69) / 12);
  }

  private note(midi: number, t: number, dur: number, type: OscillatorType, vol: number): void {
    if (!Number.isFinite(midi)) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.value = this.midiToHz(midi);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.gain);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  private degree(d: number): number {
    const n = this.scale.length;
    return this.root + 12 + this.scale[d % n]! + 12 * Math.floor(d / n);
  }

  private scheduleStep(i: number, t: number): void {
    const p = this.pattern[i % 16]!;
    if (p >= 0) this.note(this.degree(p), t, this.stepDur * 1.8, 'triangle', 0.12);
    if (i % 8 === 0) {
      const b = this.bass[Math.floor(i / 8) % 4]!;
      this.note(this.root - 12 + this.scale[b]!, t, this.stepDur * 7, 'sine', 0.16);
    }
  }
}

/** Bipes provisórios: [frequência inicial, final, duração s, forma de onda]. */
const SFX_SHAPES: Record<string, [number, number, number, OscillatorType]> = {
  confirmar: [660, 990, 0.08, 'square'],
  cancelar: [440, 260, 0.1, 'square'],
  cursor: [880, 880, 0.03, 'square'],
  texto: [520, 520, 0.015, 'square'],
  alerta: [300, 900, 0.25, 'sawtooth'],
  passo: [140, 90, 0.04, 'triangle'],
};

export class AudioService {
  private game!: Phaser.Game;
  private current: Track | null = null;
  private fadingOut: Track[] = [];
  private musicBus: GainNode | null = null;
  private sfxBus: GainNode | null = null;

  init(game: Phaser.Game): void {
    this.game = game;
    const ctx = this.ctx;
    if (ctx) {
      this.musicBus = ctx.createGain();
      this.sfxBus = ctx.createGain();
      this.musicBus.connect(ctx.destination);
      this.sfxBus.connect(ctx.destination);
    }
    this.applyVolumes();
    bus.on('settings:changed', () => this.applyVolumes());
    game.events.on(Phaser.Core.Events.STEP, () => this.update());
    // Celular: pausa o som quando a aba fica oculta.
    game.sound.pauseOnBlur = true;
  }

  private get ctx(): AudioContext | null {
    const sm = this.game?.sound as Phaser.Sound.WebAudioSoundManager | undefined;
    return sm && 'context' in sm ? sm.context : null;
  }

  private applyVolumes(): void {
    if (this.musicBus) this.musicBus.gain.value = settings.musicVolume;
    if (this.sfxBus) this.sfxBus.gain.value = settings.sfxVolume;
    for (const t of [this.current, ...this.fadingOut]) if (t) this.applyTrackVolume(t);
  }

  private applyTrackVolume(t: Track): void {
    if (t.gain) t.gain.gain.value = t.volume * t.fade;
    if (t.synth) t.synth.gain.gain.value = t.volume * t.fade;
  }

  get currentMusic(): string | null {
    return this.current?.id ?? null;
  }

  private buffers = new Map<string, Promise<AudioBuffer | null>>();

  /** Carrega e decodifica uma música sob demanda (ogg se o navegador tocar, senão mp3). */
  private loadMusic(id: string): Promise<AudioBuffer | null> {
    const cached = this.buffers.get(id);
    if (cached) return cached;
    const ctx = this.ctx;
    const urls = musicUrls(id);
    if (!ctx || urls.length === 0) return Promise.resolve(null);
    const probe = document.createElement('audio');
    const canOgg = probe.canPlayType('audio/ogg; codecs="vorbis"') !== '';
    const url = urls.find((u) => (canOgg ? /\.ogg/.test(u) : /\.(mp3|m4a)/.test(u))) ?? urls[0]!;
    const p = fetch(url)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((data) => new Promise<AudioBuffer>((res, rej) => ctx.decodeAudioData(data, res, rej)))
      .catch((e) => {
        console.warn(`[áudio] não foi possível carregar a música "${id}":`, e);
        this.buffers.delete(id);
        return null;
      });
    this.buffers.set(id, p);
    return p;
  }

  /** Pré-carrega músicas (ex.: a do próximo mapa) sem tocar. */
  preloadMusic(...ids: string[]): void {
    for (const id of ids) void this.loadMusic(id);
  }

  /**
   * Toca uma faixa (crossfade com a atual). `null` para parar.
   * Arquivos de assets/audio/music respeitam o manifesto: `loop` (false = uma vez só) e `loopStart`/`loopEnd`.
   * Sem arquivo, toca uma melodia provisória gerada por código.
   */
  playMusic(id: string | null, fadeMs = 800, volume = 1): void {
    if (id && this.current?.id === id && !this.current.ended) {
      this.current.volume = volume;
      return;
    }
    const now = performance.now();
    if (this.current) {
      const old = this.current;
      Object.assign(old, { fadeFrom: old.fade, fadeTo: 0, fadeStart: now, fadeMs: Math.max(1, fadeMs) });
      this.fadingOut.push(old);
      this.current = null;
    }
    if (!id) return;
    const track: Track = { id, volume, fade: 0, fadeFrom: 0, fadeTo: 1, fadeStart: now, fadeMs: Math.max(1, fadeMs) };
    this.current = track;
    const ctx = this.ctx;
    if (!ctx || !this.musicBus) return;
    if (musicUrls(id).length > 0) {
      void this.loadMusic(id).then((buf) => {
        if (this.current !== track) return; // trocou de música enquanto carregava
        if (!buf) {
          track.synth = new ProceduralMusic(ctx, this.musicBus!, id);
          track.synth.start();
          return;
        }
        const meta = musicMeta.get(id) ?? { loop: true };
        const gain = ctx.createGain();
        gain.connect(this.musicBus!);
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.loop = meta.loop;
        if (meta.loop && meta.loopEnd !== undefined && meta.loopEnd > (meta.loopStart ?? 0)) {
          src.loopStart = meta.loopStart ?? 0;
          src.loopEnd = Math.min(meta.loopEnd, buf.duration);
        }
        src.connect(gain);
        src.onended = () => {
          track.ended = true;
        };
        track.source = src;
        track.gain = gain;
        // O fade começa quando o som realmente começa.
        Object.assign(track, { fade: 0, fadeFrom: 0, fadeTo: 1, fadeStart: performance.now() });
        this.applyTrackVolume(track);
        src.start();
      });
    } else {
      track.synth = new ProceduralMusic(ctx, this.musicBus, id);
      track.synth.start();
      this.applyTrackVolume(track);
    }
  }

  sfx(id: string, volume = 1): void {
    const key = `sfx:${id}`;
    if (this.game.cache.audio.exists(key)) {
      this.game.sound.play(key, { volume: volume * settings.sfxVolume });
      return;
    }
    const ctx = this.ctx;
    if (!ctx || !this.sfxBus || ctx.state !== 'running') return;
    const shape = SFX_SHAPES[id] ?? (() => {
      const h = hash(id);
      return [200 + (h % 600), 100 + ((h >>> 10) % 900), 0.12 + ((h >>> 20) % 10) / 50, 'square'] as [number, number, number, OscillatorType];
    })();
    const [f0, f1, dur, type] = shape;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(0.18 * volume, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.sfxBus);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  private update(): void {
    const now = performance.now();
    const step = (t: Track) => {
      const k = Math.min(1, (now - t.fadeStart) / t.fadeMs);
      t.fade = t.fadeFrom + (t.fadeTo - t.fadeFrom) * k;
      this.applyTrackVolume(t);
      return k >= 1;
    };
    if (this.current && this.current.fade !== this.current.fadeTo) step(this.current);
    this.fadingOut = this.fadingOut.filter((t) => {
      if (!step(t)) return true;
      try {
        t.source?.stop();
      } catch {
        /* já parou */
      }
      t.source?.disconnect();
      t.gain?.disconnect();
      t.synth?.stop();
      return false;
    });
  }
}

export const audio = new AudioService();
