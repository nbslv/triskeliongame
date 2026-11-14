import { describe, expect, it } from 'vitest';
import { findPath, simplifyPath } from '../src/systems/world/path';

const grid = (rows: string[]) => ({
  w: rows[0]!.length,
  h: rows.length,
  blocked: (x: number, y: number) => rows[y]![x] === '#',
});

describe('A*', () => {
  it('contorna obstáculos com o menor caminho', () => {
    const g = grid(['.....', '.###.', '.....']);
    const p = findPath({ x: 0, y: 1 }, { x: 4, y: 1 }, g.w, g.h, g.blocked)!;
    expect(p[0]).toEqual({ x: 0, y: 1 });
    expect(p[p.length - 1]).toEqual({ x: 4, y: 1 });
    expect(p.length).toBe(7); // 6 passos
    expect(p.every((c) => !g.blocked(c.x, c.y))).toBe(true);
  });

  it('retorna null sem caminho ou destino sólido', () => {
    const g = grid(['..#..', '..#..', '..#..']);
    expect(findPath({ x: 0, y: 0 }, { x: 4, y: 0 }, g.w, g.h, g.blocked)).toBeNull();
    expect(findPath({ x: 0, y: 0 }, { x: 2, y: 0 }, g.w, g.h, g.blocked)).toBeNull();
  });

  it('simplifica para os cantos', () => {
    const p = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 1 }, { x: 2, y: 2 }];
    expect(simplifyPath(p)).toEqual([{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 2 }]);
  });
});
