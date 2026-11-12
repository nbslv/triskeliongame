/**
 * Valida TODO o conteúdo de content/ (roteiros e mapas).
 * Sessões de narrativa/mapas: rodem `npm test` antes de entregar.
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { validateDialogue } from '../src/systems/dialogue/schema';
import type { Step, StepType } from '../src/systems/dialogue/types';
import { validateMap, type TiledMap } from '../src/systems/world/tiled';

const root = join(__dirname, '..', 'content');
const list = (dir: string) =>
  existsSync(join(root, dir)) ? readdirSync(join(root, dir)).filter((f) => f.endsWith('.json')) : [];
const load = (dir: string, f: string) => JSON.parse(readFileSync(join(root, dir, f), 'utf8')) as unknown;

const dialogueFiles = list('dialogues');
const mapFiles = list('maps');
const dialogueIds = new Set(dialogueFiles.map((f) => f.replace(/\.json$/, '')));
const mapIds = new Set(mapFiles.map((f) => f.replace(/\.json$/, '')));

describe('content/dialogues', () => {
  it.each(dialogueFiles)('%s é válido', (f) => {
    const json = load('dialogues', f) as { id?: string };
    const r = validateDialogue(json, dialogueIds);
    expect(r.errors).toEqual([]);
    expect(json.id).toBe(f.replace(/\.json$/, ''));
  });

  it('teste.json exercita todos os tipos de passo do contrato', () => {
    const json = load('dialogues', 'teste.json') as { steps: Step[] };
    const seen = new Set<StepType>();
    const walk = (steps: Step[]) =>
      steps.forEach((s) => {
        seen.add(s.type);
        if (s.type === 'choice') s.options.forEach((o) => o.steps && walk(o.steps));
        if (s.type === 'if') {
          if (s.then) walk(s.then);
          if (Array.isArray(s.else)) walk(s.else);
        }
      });
    walk(json.steps);
    const required: StepType[] = ['say', 'choice', 'label', 'goto', 'if', 'flag', 'move', 'face', 'emote', 'wait', 'sfx', 'music', 'shake', 'fade', 'camera', 'spawn', 'despawn', 'scene', 'end'];
    expect(required.filter((t) => !seen.has(t))).toEqual([]);
  });
});

describe('content/maps', () => {
  it.each(mapFiles)('%s é válido', (f) => {
    const errs = validateMap(f.replace(/\.json$/, ''), load('maps', f) as TiledMap, mapIds, dialogueIds);
    expect(errs).toEqual([]);
  });
});

describe('content/jogo.json', () => {
  it('aponta para mapa existente', () => {
    if (!existsSync(join(root, 'jogo.json'))) return;
    const cfg = JSON.parse(readFileSync(join(root, 'jogo.json'), 'utf8')) as { startMap: string; startDialogue?: string };
    expect(mapIds.has(cfg.startMap)).toBe(true);
    if (cfg.startDialogue) expect(dialogueIds.has(cfg.startDialogue)).toBe(true);
  });
});
