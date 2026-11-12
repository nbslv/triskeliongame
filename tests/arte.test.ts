/**
 * Conferência dos assets da arte usados pelos roteiros e pelo motor.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { normalizeScript } from '../src/systems/dialogue/schema';
import type { Step } from '../src/systems/dialogue/types';

const root = join(__dirname, '..');
const dlgDir = join(root, 'content', 'dialogues');
const prologo = readdirSync(dlgDir).filter((f) => /^prologo_.*\.json$/.test(f));

function walk(steps: Step[], fn: (s: Step) => void): void {
  for (const s of steps) {
    fn(s);
    if (s.type === 'choice') s.options.forEach((o) => o.steps && walk(o.steps, fn));
    if (s.type === 'if') {
      if (s.then) walk(s.then, fn);
      if (Array.isArray(s.else)) walk(s.else, fn);
    }
  }
}
const allSteps = (fn: (s: Step, file: string) => void) => {
  for (const f of prologo) {
    const json = normalizeScript(JSON.parse(readFileSync(join(dlgDir, f), 'utf8'))) as { steps: Step[] };
    walk(json.steps, (s) => fn(s, f));
  }
};

describe('assets da arte usados pelo prólogo', () => {
  it('há roteiros do prólogo em content/dialogues', () => {
    expect(prologo.length).toBeGreaterThanOrEqual(48);
  });

  it('todo retrato usado nos roteiros existe em assets/portraits (64×64)', () => {
    const missing = new Set<string>();
    let used = 0;
    allSteps((s, f) => {
      if (s.type === 'say' && s.portrait) {
        used++;
        if (!existsSync(join(root, 'assets', 'portraits', `${s.portrait}.png`))) missing.add(`${s.portrait} (${f})`);
      }
    });
    expect(used).toBeGreaterThan(0);
    expect([...missing]).toEqual([]);
  });

  it('retratos têm 64×64', () => {
    for (const f of readdirSync(join(root, 'assets', 'portraits'))) {
      const buf = readFileSync(join(root, 'assets', 'portraits', f));
      expect([buf.readUInt32BE(16), buf.readUInt32BE(20)], f).toEqual([64, 64]);
    }
  });

  it('toda pose (`anim`) usada nos roteiros existe numa folha de poses da arte', () => {
    const poses = new Set<string>();
    const spritesDir = join(root, 'assets', 'sprites');
    for (const f of readdirSync(spritesDir).filter((x) => x.endsWith('.json'))) {
      const meta = JSON.parse(readFileSync(join(spritesDir, f), 'utf8')) as { alvo?: string; anims?: Record<string, unknown> };
      for (const name of Object.keys(meta.anims ?? {})) poses.add(`${meta.alvo ?? f.replace(/\.json$/, '')}:${name}`);
    }
    const alias: Record<string, string> = { caligosuin: 'cali_soldado' };
    const missing = new Set<string>();
    allSteps((s, f) => {
      if (s.type !== 'anim' || s.anim === 'normal') return;
      const actor = /^cali_\d+$/.test(s.actor) ? 'cali_soldado' : (alias[s.actor] ?? s.actor);
      if (!poses.has(`${actor}:${s.anim}`)) missing.add(`${actor}:${s.anim} (${f})`);
    });
    expect([...missing]).toEqual([]);
  });

  it('todo emote usado tem ícone em assets/images', () => {
    const icon: Record<string, string> = { '!': 'exclamacao', '?': 'interrogacao', '...': 'reticencias', '💧': 'suor' };
    const missing = new Set<string>();
    allSteps((s) => {
      if (s.type !== 'emote') return;
      const name = icon[s.emote] ?? s.emote;
      if (!existsSync(join(root, 'assets', 'images', `emote_${name}.png`))) missing.add(s.emote);
    });
    expect([...missing]).toEqual([]);
  });
});
