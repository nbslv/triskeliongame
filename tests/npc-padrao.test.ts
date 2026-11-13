import { describe, expect, it } from 'vitest';
import { defaultNpcDialogueId, objectKind, type TiledObject } from '../src/systems/world/tiled';

describe('fala padrão de NPC', () => {
  const have = (ids: string[]) => (id: string) => ids.includes(id);

  it('prefere tipo + período, depois tipo, depois pessoa', () => {
    const all = have(['padrao_galinha_noite', 'padrao_galinha', 'padrao_pessoa_noite', 'padrao_pessoa']);
    expect(defaultNpcDialogueId('galinha', undefined, 'noite', all)).toBe('padrao_galinha_noite');
    expect(defaultNpcDialogueId('galinha', undefined, 'manha', all)).toBe('padrao_galinha');
    expect(defaultNpcDialogueId('soldado', undefined, 'noite', all)).toBe('padrao_pessoa_noite');
    expect(defaultNpcDialogueId('soldado', undefined, undefined, all)).toBe('padrao_pessoa');
    expect(defaultNpcDialogueId('soldado', undefined, undefined, have([]))).toBeUndefined();
  });

  it('sem `tipo`, usa o sprite sem número no fim', () => {
    const ids = have(['padrao_aldeao', 'padrao_soldado']);
    expect(defaultNpcDialogueId(undefined, 'aldeao_2', undefined, ids)).toBe('padrao_aldeao');
    expect(defaultNpcDialogueId(undefined, 'soldado_1', undefined, ids)).toBe('padrao_soldado');
  });
});

describe('porta trancada', () => {
  const obj = (o: Partial<TiledObject>): TiledObject => ({ id: 1, name: 'p', x: 0, y: 0, ...o });
  it('classe porta_trancada ou propriedade trancada_texto', () => {
    expect(objectKind(obj({ type: 'porta_trancada' }))).toBe('locked');
    expect(objectKind(obj({ properties: [{ name: 'trancada_texto', value: 'x' }] }))).toBe('locked');
  });
});
