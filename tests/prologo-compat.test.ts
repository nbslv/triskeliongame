/**
 * Compatibilidade com os roteiros do prólogo da sessão de narrativa.
 * Fonte: tests/fixtures/prologo/ (cópia de origin/claude/triskelion-narrativa:content/dialogues).
 * Se content/dialogues/prologo_*.json existir neste branch (após integração), valida esses também.
 * Atualizar a cópia: scripts/atualizar-fixture-prologo.sh
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { FlagStore } from '../src/core/flags';
import { DialogueRunner, type DialogueHost } from '../src/systems/dialogue/runner';
import { validateDialogue } from '../src/systems/dialogue/schema';
import type { DialogueScript } from '../src/systems/dialogue/types';

const fixtureDir = join(__dirname, 'fixtures', 'prologo');
const contentDir = join(__dirname, '..', 'content', 'dialogues');
const files = new Map<string, string>();
for (const dir of [fixtureDir, contentDir]) {
  if (!existsSync(dir)) continue;
  for (const f of readdirSync(dir)) if (/^prologo_.*\.json$/.test(f)) files.set(f, join(dir, f)); // content/ tem prioridade
}
const ids = new Set([...files.keys()].map((f) => f.replace(/\.json$/, '')));

describe('roteiros do prólogo', () => {
  it('existem (cópia ou content/)', () => {
    expect(files.size).toBeGreaterThanOrEqual(48);
  });

  it.each([...files.keys()])('%s valida no esquema do motor', (f) => {
    const json = JSON.parse(readFileSync(files.get(f)!, 'utf8')) as { id: string };
    const r = validateDialogue(json, ids);
    expect(r.errors).toEqual([]);
    expect(json.id).toBe(f.replace(/\.json$/, ''));
  });

  it.each([...files.keys()])('%s executa até o fim com um host falso', async (f) => {
    const r = validateDialogue(JSON.parse(readFileSync(files.get(f)!, 'utf8')), ids);
    const scripts = new Map<string, DialogueScript>();
    for (const [name, path] of files) {
      const v = validateDialogue(JSON.parse(readFileSync(path, 'utf8')), ids);
      if (v.script) scripts.set(name.replace(/\.json$/, ''), v.script);
    }
    const noop = async () => undefined;
    const host: DialogueHost = {
      say: noop, choice: async () => 0, move: noop, face: () => undefined, emote: noop, wait: noop,
      sfx: () => undefined, music: () => undefined, shake: noop, fade: noop, camera: noop,
      spawn: () => undefined, despawn: () => undefined, scene: async () => 'continue',
      checkpoint: () => undefined, autosave: () => undefined, anim: () => undefined, title: noop,
      activity: noop, light: noop, loadScript: (id) => scripts.get(id),
    };
    const out = await new DialogueRunner(r.script!, host, new FlagStore(false)).run();
    expect(['ended', 'stopped']).toContain(out);
  });
});
