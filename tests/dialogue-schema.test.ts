import { describe, expect, it } from 'vitest';
import { validateDialogue } from '../src/systems/dialogue/schema';

describe('validateDialogue', () => {
  it('aceita o exemplo do contrato (docs/COORDENACAO.md)', () => {
    const r = validateDialogue({
      id: 'prologo_pai',
      steps: [
        { type: 'say', speaker: 'pai', portrait: 'pai_ferido', text: 'Ícaro... você veio.' },
        { type: 'choice', options: [{ text: 'Pai! Aguenta firme!', goto: 'a' }] },
        { type: 'label', name: 'a' },
        { type: 'move', actor: 'icaro', to: [12, 8] },
        { type: 'wait', ms: 500 },
        { type: 'sfx', id: 'madeira_quebrando' },
        { type: 'shake', ms: 300 },
        { type: 'fade', to: 'black', ms: 800 },
        { type: 'flag', set: 'prologo.pai_despedida' },
        { type: 'end' },
      ],
    });
    expect(r.errors).toEqual([]);
    expect(r.ok).toBe(true);
  });

  it.each([
    [{ steps: [] }, /id/],
    [{ id: 'x', steps: [] }, /steps/],
    [{ id: 'x', steps: [{ type: 'dizer', text: 'oi' }] }, /type|discriminator/i],
    [{ id: 'x', steps: [{ type: 'say', txt: 'oi' }] }, /text|Unrecognized/],
    [{ id: 'x', steps: [{ type: 'say', text: 'oi', extra: 1 }] }, /Unrecognized/],
    [{ id: 'x', steps: [{ type: 'move', actor: 'a', to: [1.5, 2] }] }, /integer|inteiro|Expected/],
    [{ id: 'x', steps: [{ type: 'if', flag: 'a', cond: 'b', goto: 'l' }] }, /flag.*OU.*cond/],
    [{ id: 'x', steps: [{ type: 'flag' }] }, /set/],
    [{ id: 'x', steps: [{ type: 'face', actor: 'a' }] }, /dir/],
    [{ id: 'x', steps: [{ type: 'fade', to: 'roxo' }] }, /to/],
    [{ id: 'x', steps: [{ type: 'scene' }] }, /map/],
  ])('rejeita estrutura inválida %#', (json, re) => {
    const r = validateDialogue(json);
    expect(r.ok).toBe(false);
    expect(r.errors.join('\n')).toMatch(re);
  });

  it('valida labels: inexistente, duplicado, aninhado', () => {
    const r = validateDialogue({
      id: 'x',
      steps: [
        { type: 'goto', label: 'nada' },
        { type: 'label', name: 'l' },
        { type: 'label', name: 'l' },
        { type: 'choice', options: [{ text: 'o', steps: [{ type: 'label', name: 'dentro' }] }, { text: 'p', goto: 'sumiu' }] },
        { type: 'if', flag: 'f', goto: 'l', else: 'ausente' },
      ],
    });
    expect(r.ok).toBe(false);
    const all = r.errors.join('\n');
    expect(all).toMatch(/"nada" não existe/);
    expect(all).toMatch(/duplicado "l"/);
    expect(all).toMatch(/lista principal/);
    expect(all).toMatch(/"sumiu" não existe/);
    expect(all).toMatch(/"ausente" não existe/);
  });

  it('valida call contra roteiros conhecidos', () => {
    const json = { id: 'x', steps: [{ type: 'call', id: 'outro' }] };
    expect(validateDialogue(json).ok).toBe(true);
    expect(validateDialogue(json, new Set(['x'])).ok).toBe(false);
    expect(validateDialogue(json, new Set(['x', 'outro'])).ok).toBe(true);
  });
});
