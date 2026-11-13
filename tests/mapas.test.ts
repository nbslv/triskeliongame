// Valida os mapas do Prólogo (tools/mapas/validar.mjs): referências dos roteiros, portas,
// esconderijos/rotas/checkpoints e caminho transitável (BFS) da entrada até cada saída/objeto.
import { describe, expect, it } from 'vitest';
// @ts-expect-error módulo .mjs sem tipos
import { validar } from '../tools/mapas/validar.mjs';

describe('mapas do prólogo', () => {
  it('validam sem erros', () => {
    const r = validar() as { erros: string[]; mapas: string[] };
    expect(r.erros).toEqual([]);
    expect(r.mapas.length).toBeGreaterThanOrEqual(10);
  });
});
