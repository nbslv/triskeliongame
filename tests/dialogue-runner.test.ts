import { describe, expect, it, vi } from 'vitest';
import { FlagStore } from '../src/core/flags';
import { DialogueRunner, type DialogueHost } from '../src/systems/dialogue/runner';
import type { DialogueScript, Step } from '../src/systems/dialogue/types';

/** Host falso que registra as chamadas e responde escolhas a partir de uma fila. */
function makeHost(choices: number[] = [], scripts: Record<string, DialogueScript> = {}) {
  const log: string[] = [];
  const host: DialogueHost = {
    say: async (s) => void log.push(`say:${s.text}`),
    choice: async (_p, opts) => {
      log.push(`choice:${opts.join('|')}`);
      return choices.shift() ?? 0;
    },
    move: async (s) => void log.push(`move:${s.actor}->${JSON.stringify(s.to)}`),
    face: (s) => void log.push(`face:${s.actor}:${s.dir ?? s.to}`),
    emote: async (s) => void log.push(`emote:${s.actor}:${s.emote}`),
    wait: async (ms) => void log.push(`wait:${ms}`),
    sfx: (id) => void log.push(`sfx:${id}`),
    music: (s) => void log.push(`music:${s.id}`),
    shake: async (s) => void log.push(`shake:${s.ms}`),
    fade: async (s) => void log.push(`fade:${s.to}`),
    camera: async (s) => void log.push(`camera:${JSON.stringify(s.to ?? s.follow)}`),
    spawn: (s) => void log.push(`spawn:${s.actor}`),
    despawn: (a) => void log.push(`despawn:${a}`),
    scene: async (s) => {
      log.push(`scene:${s.map ?? s.scene}`);
      return s.scene ? 'stop' : 'continue';
    },
    checkpoint: () => void log.push('checkpoint'),
    autosave: () => void log.push('autosave'),
    anim: (a, an) => void log.push(`anim:${a}:${an}`),
    title: async (t) => void log.push(`title:${t}`),
    activity: async (id) => void log.push(`activity:${id}`),
    light: async (r) => void log.push(`light:${r}`),
    loadScript: (id) => scripts[id],
  };
  return { host, log };
}

const script = (steps: Step[], id = 't'): DialogueScript => ({ id, steps });

describe('DialogueRunner', () => {
  it('executa passos em ordem e para no end', async () => {
    const { host, log } = makeHost();
    const r = new DialogueRunner(
      script([
        { type: 'say', text: 'um' },
        { type: 'wait', ms: 10 },
        { type: 'sfx', id: 'x' },
        { type: 'end' },
        { type: 'say', text: 'nunca' },
      ]),
      host,
      new FlagStore(false),
    );
    expect(await r.run()).toBe('ended');
    expect(log).toEqual(['say:um', 'wait:10', 'sfx:x']);
  });

  it('choice com goto e com passos aninhados', async () => {
    const steps: Step[] = [
      { type: 'choice', options: [{ text: 'A', goto: 'a' }, { text: 'B', steps: [{ type: 'say', text: 'aninhado' }] }] },
      { type: 'say', text: 'depois' },
      { type: 'goto', label: 'fim' },
      { type: 'label', name: 'a' },
      { type: 'say', text: 'em a' },
      { type: 'label', name: 'fim' },
    ];
    const a = makeHost([0]);
    await new DialogueRunner(script(steps), a.host, new FlagStore(false)).run();
    expect(a.log).toEqual(['choice:A|B', 'say:em a']);

    const b = makeHost([1]);
    await new DialogueRunner(script(steps), b.host, new FlagStore(false)).run();
    expect(b.log).toEqual(['choice:A|B', 'say:aninhado', 'say:depois']);
  });

  it('esconde opções cuja condição é falsa', async () => {
    const { host, log } = makeHost([0]);
    const flags = new FlagStore(false);
    flags.set('sabe');
    await new DialogueRunner(
      script([{ type: 'choice', options: [{ text: 'secreta', if: '!sabe' }, { text: 'normal', steps: [{ type: 'say', text: 'ok' }] }] }]),
      host,
      flags,
    ).run();
    expect(log).toEqual(['choice:normal', 'say:ok']);
  });

  it('if por flag, equals, cond, then/else e goto/else-label', async () => {
    const flags = new FlagStore(false);
    flags.set('n', 2);
    const { host, log } = makeHost();
    await new DialogueRunner(
      script([
        { type: 'if', flag: 'falta', then: [{ type: 'say', text: 'X' }], else: [{ type: 'say', text: 'else1' }] },
        { type: 'if', flag: 'n', equals: 2, then: [{ type: 'say', text: 'eq' }] },
        { type: 'if', cond: 'n >= 5', goto: 'grande', else: 'pequeno' },
        { type: 'label', name: 'grande' },
        { type: 'say', text: 'grande' },
        { type: 'label', name: 'pequeno' },
        { type: 'say', text: 'pequeno' },
      ]),
      host,
      flags,
    ).run();
    expect(log).toEqual(['say:else1', 'say:eq', 'say:pequeno']);
  });

  it('goto de dentro de bloco aninhado volta ao nível principal', async () => {
    const { host, log } = makeHost([0]);
    await new DialogueRunner(
      script([
        { type: 'choice', options: [{ text: 'x', steps: [{ type: 'say', text: 'in' }, { type: 'goto', label: 'l' }, { type: 'say', text: 'nao' }] }] },
        { type: 'say', text: 'pulado' },
        { type: 'label', name: 'l' },
        { type: 'say', text: 'fim' },
      ]),
      host,
      new FlagStore(false),
    ).run();
    expect(log).toEqual(['choice:x', 'say:in', 'say:fim']);
  });

  it('flag set/value/clear/add altera o FlagStore', async () => {
    const flags = new FlagStore(false);
    const { host } = makeHost();
    await new DialogueRunner(
      script([
        { type: 'flag', set: 'a' },
        { type: 'flag', set: 'b', value: 'texto' },
        { type: 'flag', add: 'c', by: 5 },
        { type: 'flag', add: 'c' },
        { type: 'flag', set: 'd' },
        { type: 'flag', clear: 'd' },
      ]),
      host,
      flags,
    ).run();
    expect(flags.toJSON()).toEqual({ a: true, b: 'texto', c: 6 });
  });

  it('repassa ao host todos os tipos de ação', async () => {
    const { host, log } = makeHost();
    await new DialogueRunner(
      script([
        { type: 'move', actor: 'icaro', to: [1, 2] },
        { type: 'move', actor: 'pai', to: 'marco', wait: false },
        { type: 'face', actor: 'pai', dir: 'left' },
        { type: 'emote', actor: 'pai', emote: '!' },
        { type: 'music', id: 'tema' },
        { type: 'music', id: null },
        { type: 'shake', ms: 100 },
        { type: 'fade', to: 'black' },
        { type: 'camera', to: 'marco' },
        { type: 'spawn', actor: 'x', at: [0, 0] },
        { type: 'despawn', actor: 'x' },
        { type: 'scene', map: 'outro' },
        { type: 'checkpoint' },
        { type: 'autosave' },
        { type: 'anim', actor: 'icaro', anim: 'colher' },
        { type: 'title', text: 'FIM' },
        { type: 'activity', id: 'treino' },
        { type: 'light', radius: 40 },
      ]),
      host,
      new FlagStore(false),
    ).run();
    expect(log).toEqual([
      'move:icaro->[1,2]',
      'move:pai->"marco"',
      'face:pai:left',
      'emote:pai:!',
      'music:tema',
      'music:null',
      'shake:100',
      'fade:black',
      'camera:"marco"',
      'spawn:x',
      'despawn:x',
      'scene:outro',
      'checkpoint',
      'autosave',
      'anim:icaro:colher',
      'title:FIM',
      'activity:treino',
      'light:40',
    ]);
  });

  it('scene com "scene" encerra o roteiro', async () => {
    const { host, log } = makeHost();
    const r = await new DialogueRunner(
      script([{ type: 'scene', scene: 'Titulo' }, { type: 'say', text: 'não' }]),
      host,
      new FlagStore(false),
    ).run();
    expect(r).toBe('scene');
    expect(log).toEqual(['scene:Titulo']);
  });

  it('call executa outro roteiro e volta; end dentro do call só sai dele', async () => {
    const sub = script([{ type: 'say', text: 'sub' }, { type: 'end' }, { type: 'say', text: 'nunca' }], 'sub');
    const { host, log } = makeHost([], { sub });
    await new DialogueRunner(
      script([{ type: 'say', text: 'antes' }, { type: 'call', id: 'sub' }, { type: 'say', text: 'depois' }]),
      host,
      new FlagStore(false),
    ).run();
    expect(log).toEqual(['say:antes', 'say:sub', 'say:depois']);
  });

  it('stop() interrompe', async () => {
    const { host } = makeHost();
    const flags = new FlagStore(false);
    const r: DialogueRunner = new DialogueRunner(
      script([{ type: 'say', text: 'a' }, { type: 'flag', set: 'nao' }]),
      { ...host, say: vi.fn(async (): Promise<void> => r.stop()) },
      flags,
    );
    expect(await r.run()).toBe('stopped');
    expect(flags.has('nao')).toBe(false);
  });

  it('detecta laço infinito', async () => {
    const { host } = makeHost();
    const r = new DialogueRunner(script([{ type: 'label', name: 'l' }, { type: 'goto', label: 'l' }]), host, new FlagStore(false));
    await expect(r.run()).rejects.toThrow(/laço/);
  });
});
