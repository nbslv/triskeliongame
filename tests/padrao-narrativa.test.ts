/**
 * Falas padrão REAIS da narrativa (content/dialogues/padrao_*.json) com o período do dia do motor.
 * Contrato: docs/status/narrativa.md §5 — flags periodo.manha/tarde/noite (uma ligada) e rodízio padrao.<tipo>.vez.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { flags } from '../src/core/flags';
import { setPeriod } from '../src/core/period';
import { DialogueRunner, type DialogueHost } from '../src/systems/dialogue/runner';
import { validateDialogue } from '../src/systems/dialogue/schema';

const dir = join(__dirname, '..', 'content', 'dialogues');
const files = readdirSync(dir).filter((f) => /^padrao_(?!teste|porta)[a-z_]+\.json$/.test(f));
const load = (f: string) => validateDialogue(JSON.parse(readFileSync(join(dir, f), 'utf8'))).script!;

async function talk(f: string): Promise<string[]> {
  const said: string[] = [];
  const noop = async () => undefined;
  const host: DialogueHost = {
    say: async (s) => void said.push(s.text), choice: async () => 0, move: noop, face: () => undefined, emote: noop,
    wait: noop, sfx: () => undefined, music: () => undefined, shake: noop, fade: noop, camera: noop,
    spawn: () => undefined, despawn: () => undefined, scene: async () => 'continue', checkpoint: () => undefined,
    autosave: () => undefined, anim: () => undefined, title: noop, activity: noop, light: noop, loadScript: () => undefined,
  };
  await new DialogueRunner(load(f), host, flags).run();
  return said;
}

describe('falas padrão da narrativa', () => {
  beforeEach(() => flags.reset());

  it('existem os tipos do contrato', () => {
    for (const t of ['aldeao', 'aldea', 'crianca', 'idoso', 'galinha', 'soldado', 'sobrevivente']) {
      expect(files, t).toContain(`padrao_${t}.json`);
    }
  });

  it.each(['padrao_aldeao.json', 'padrao_aldea.json', 'padrao_idoso.json'])('%s saúda conforme o período do mapa', async (f) => {
    setPeriod('manha');
    expect((await talk(f))[0]).toMatch(/^Bom dia/);
    setPeriod('tarde');
    expect((await talk(f))[0]).toMatch(/^Boa tarde/);
    setPeriod('noite');
    expect((await talk(f))[0]).toMatch(/^Boa noite/);
    expect(flags.get('periodo')).toBe('noite'); // formato com valor também em sincronia
  });

  it.each(files)('%s faz rodízio sem repetir em seguida e volta ao início', async (f) => {
    setPeriod('tarde');
    const tipo = f.replace(/^padrao_|\.json$/g, '');
    const seen: string[] = [];
    for (let i = 0; i < 12; i++) {
      const said = await talk(f);
      seen.push(said[said.length - 1] ?? '');
    }
    const vez = flags.get(`padrao.${tipo}.vez`);
    const distinct = new Set(seen).size;
    if (vez === undefined) {
      expect(distinct).toBeGreaterThanOrEqual(1); // tipo sem rodízio
      return;
    }
    expect(distinct).toBeGreaterThan(1);
    for (let i = 1; i < seen.length; i++) expect(seen[i], `${f} repetiu na conversa ${i + 1}`).not.toBe(seen[i - 1]);
    // o ciclo recomeça: a sequência se repete com período = nº de variações
    const n = distinct;
    expect(seen.slice(n, 2 * n)).toEqual(seen.slice(0, n));
  });
});
