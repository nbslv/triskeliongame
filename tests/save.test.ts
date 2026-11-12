import { beforeEach, describe, expect, it } from 'vitest';
import { SAVE_PREFIX, SAVE_VERSION, SaveManager, createMemoryStorage, migrate, type StorageLike } from '../src/core/save';

const pos = { map: 'teste', x: 10, y: 20, facing: 'down' as const };

describe('SaveManager', () => {
  let storage: StorageLike;
  let saves: SaveManager;
  beforeEach(() => {
    storage = createMemoryStorage();
    saves = new SaveManager(storage);
  });

  it('grava e lê um espaço com versão atual', () => {
    saves.write('1', { playtimeMs: 1000, position: pos, checkpoint: pos, flags: { a: true } });
    const d = saves.read('1');
    expect(d?.version).toBe(SAVE_VERSION);
    expect(d?.flags).toEqual({ a: true });
    expect(d?.position).toEqual(pos);
  });

  it('retorna null para vazio ou corrompido', () => {
    expect(saves.read('2')).toBeNull();
    storage.setItem(SAVE_PREFIX + '2', '{ isto não é json');
    expect(saves.read('2')).toBeNull();
    storage.setItem(SAVE_PREFIX + '3', JSON.stringify({ version: SAVE_VERSION, position: { map: 1 } }));
    expect(saves.read('3')).toBeNull();
  });

  it('latest() escolhe o mais recente entre auto e manuais', () => {
    saves.write('1', { playtimeMs: 0, position: pos, checkpoint: pos, flags: {}, savedAt: 100 });
    saves.write('auto', { playtimeMs: 0, position: { ...pos, map: 'b' }, checkpoint: pos, flags: {}, savedAt: 300 });
    saves.write('3', { playtimeMs: 0, position: pos, checkpoint: pos, flags: {}, savedAt: 200 });
    expect(saves.latest()?.slot).toBe('auto');
    expect(saves.hasAny()).toBe(true);
    saves.delete('auto');
    expect(saves.latest()?.slot).toBe('3');
    expect(saves.list()).toHaveLength(4);
  });

  it('migra save v1 e regrava na versão atual', () => {
    storage.setItem(SAVE_PREFIX + '1', JSON.stringify({ version: 1, map: 'vila', x: 5, y: 6, facing: 'up', flags: { f: 1 }, time: 42 }));
    const d = saves.read('1');
    expect(d).not.toBeNull();
    expect(d!.position).toEqual({ map: 'vila', x: 5, y: 6, facing: 'up' });
    expect(d!.checkpoint).toEqual(d!.position);
    expect(d!.savedAt).toBe(42);
    expect(JSON.parse(storage.getItem(SAVE_PREFIX + '1')!).version).toBe(SAVE_VERSION);
  });

  it('recusa save de versão futura', () => {
    expect(() => migrate({ version: SAVE_VERSION + 1 })).toThrow(/futura/);
  });
});
