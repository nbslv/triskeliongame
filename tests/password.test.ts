import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { sha256Hex } from '../src/core/sha256';
import { checkPassword } from '../src/core/password';

describe('sha256Hex', () => {
  it.each(['', 'abc', 'triskelion', 'Ícaro & ação ✨', 'x'.repeat(1000)])('igual ao node:crypto para %j', (s) => {
    expect(sha256Hex(s)).toBe(createHash('sha256').update(s, 'utf8').digest('hex'));
  });

  it('checkPassword compara com o hash (ignorando espaços nas pontas)', () => {
    const h = createHash('sha256').update('senha123').digest('hex');
    expect(checkPassword(' senha123 ', h)).toBe(true);
    expect(checkPassword('errada', h)).toBe(false);
  });
});
