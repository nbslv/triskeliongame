import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { assetManifest, musicMeta, musicUrls, speakerVoice } from '../src/content';

const sfxDir = join(__dirname, '..', 'assets', 'audio', 'sfx');

describe('áudio da arte', () => {
  it('manifesto de músicas: tema_lenda e tema_mae tocam uma vez; demais em laço', () => {
    expect(musicMeta.get('tema_lenda')?.loop).toBe(false);
    expect(musicMeta.get('tema_mae')?.loop).toBe(false);
    expect(musicMeta.get('tema_casa')?.loop).toBe(true);
    expect(musicMeta.get('tema_casa')?.loopEnd).toBeGreaterThan(0);
  });

  it('toda música do manifesto tem arquivo (ogg/mp3) para carregar sob demanda', () => {
    for (const id of musicMeta.keys()) expect(musicUrls(id).length, id).toBeGreaterThan(0);
  });

  it('bips de fala por falante', () => {
    expect(speakerVoice('pai')).toBe('fala_grave');
    expect(speakerVoice('nina')).toBe('fala_aguda');
    expect(speakerVoice('cali_3')).toBe('fala_ronco');
    expect(speakerVoice('toucim')).toBe('fala_ronco');
    expect(speakerVoice('icaro')).toBe('fala_media');
    expect(speakerVoice('narrador')).toBe('texto');
  });

  it('SFX usados pelo motor existem em assets/audio/sfx', () => {
    for (const id of ['confirmar', 'cancelar', 'cursor', 'texto', 'alerta', 'fala_media', 'fala_grave', 'fala_aguda', 'fala_ronco']) {
      expect(existsSync(join(sfxDir, `${id}.ogg`)), id).toBe(true);
      expect(assetManifest.sfx.some((s) => s.key === `sfx:${id}`), id).toBe(true);
    }
  });
});
