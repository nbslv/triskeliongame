import { describe, expect, it } from 'vitest';
import { FlagStore, evaluateCondition } from '../src/core/flags';

describe('FlagStore', () => {
  it('define, lê, soma e limpa flags', () => {
    const f = new FlagStore(false);
    expect(f.isSet('a')).toBe(false);
    f.set('a');
    expect(f.get('a')).toBe(true);
    f.set('n', 0);
    expect(f.isSet('n')).toBe(false);
    expect(f.add('n', 2)).toBe(2);
    expect(f.add('novo')).toBe(1);
    f.clear('a');
    expect(f.has('a')).toBe(false);
  });

  it('serializa e recarrega', () => {
    const f = new FlagStore(false);
    f.set('x.y', 'texto');
    f.set('z', 3);
    const g = new FlagStore(false);
    g.load(JSON.parse(JSON.stringify(f.toJSON())));
    expect(g.get('x.y')).toBe('texto');
    expect(g.get('z')).toBe(3);
  });
});

describe('evaluateCondition', () => {
  const f = new FlagStore(false);
  f.set('a');
  f.set('n', 3);
  f.set('nome', 'pai');

  it.each([
    ['a', true],
    ['!a', false],
    ['b', false],
    ['!b', true],
    ['a && !b', true],
    ['b || a', true],
    ['b || !a', false],
    ['n >= 3', true],
    ['n > 3', false],
    ['n < 4 && a', true],
    ['n == 3', true],
    ['n != 3', false],
    ['nome == pai', true],
    ['nome == "pai"', true],
    ['inexistente == false', true],
  ])('%s → %s', (expr, expected) => {
    expect(evaluateCondition(expr, f)).toBe(expected);
  });
});
