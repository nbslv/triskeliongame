import { beforeEach, describe, expect, it } from 'vitest';
import {
  SAVE_PREFIX,
  SAVE_VERSION,
  SaveManager,
  createMemoryStorage,
  defaultPlayerState,
  migrate,
  type SaveInput,
  type StorageLike,
} from '../src/core/save';
import { session } from '../src/core/session';
import { flags } from '../src/core/flags';

const pos = { map: 'teste', x: 10, y: 20, facing: 'down' as const };
const base = (extra: Partial<SaveInput> = {}): SaveInput => ({
  playtimeMs: 1000,
  position: pos,
  checkpoint: pos,
  flags: {},
  state: defaultPlayerState(),
  ...extra,
});

describe('SaveManager', () => {
  let storage: StorageLike;
  let saves: SaveManager;
  beforeEach(() => {
    storage = createMemoryStorage();
    saves = new SaveManager(storage);
  });

  it('salva e carrega manualmente (espaços 1–3), com estado completo', () => {
    const state = { ...defaultPlayerState(), coins: 12, inventory: { rapadura: 1 }, attributes: { forca: 2, magia: 3 } };
    saves.write('2', base({ flags: { a: true, n: 3 }, state, returnPoint: { ...pos, map: 'vila' } }));
    const d = saves.read('2');
    expect(d?.version).toBe(SAVE_VERSION);
    expect(d?.flags).toEqual({ a: true, n: 3 });
    expect(d?.position).toEqual(pos);
    expect(d?.state).toEqual(state);
    expect(d?.returnPoint?.map).toBe('vila');
    expect(d?.state.difficulty).toBe('tranquila');
  });

  it('escrita atômica: não deixa .tmp e guarda a versão anterior em .bak', () => {
    saves.write('1', base({ playtimeMs: 1 }));
    saves.write('1', base({ playtimeMs: 2 }));
    expect(storage.getItem(SAVE_PREFIX + '1.tmp')).toBeNull();
    expect(JSON.parse(storage.getItem(SAVE_PREFIX + '1.bak')!).playtimeMs).toBe(1);
    expect(saves.read('1')?.playtimeMs).toBe(2);
  });

  it('save corrompido cai para a última cópia válida (.bak) e a restaura', () => {
    saves.write('1', base({ playtimeMs: 111 }));
    saves.write('1', base({ playtimeMs: 222 }));
    storage.setItem(SAVE_PREFIX + '1', '{ corrompido');
    expect(saves.read('1')?.playtimeMs).toBe(111);
    expect(JSON.parse(storage.getItem(SAVE_PREFIX + '1')!).playtimeMs).toBe(111);
  });

  it('gravação interrompida (principal ruim, .tmp completo) usa o .tmp', () => {
    storage.setItem(SAVE_PREFIX + '3', '{"version":3,"posi');
    storage.setItem(SAVE_PREFIX + '3.tmp', JSON.stringify({ ...base({ playtimeMs: 5 }), version: SAVE_VERSION, savedAt: 1 }));
    expect(saves.read('3')?.playtimeMs).toBe(5);
  });

  it('retorna null para vazio ou tudo corrompido', () => {
    expect(saves.read('2')).toBeNull();
    storage.setItem(SAVE_PREFIX + '2', '{ isto não é json');
    expect(saves.read('2')).toBeNull();
    storage.setItem(SAVE_PREFIX + '3', JSON.stringify({ version: SAVE_VERSION, position: { map: 1 } }));
    expect(saves.read('3')).toBeNull();
  });

  it('falha de armazenamento (cota cheia) retorna null sem estourar', () => {
    const full: StorageLike = { ...storage, setItem: () => { throw new Error('QuotaExceededError'); } };
    expect(new SaveManager(full).write('1', base())).toBeNull();
  });

  it('latest() escolhe o mais recente entre retomada, auto e manuais', () => {
    saves.write('1', base({ savedAt: 100 }));
    saves.write('auto', base({ savedAt: 300 }));
    saves.write('retomada', base({ savedAt: 400 }));
    saves.write('3', base({ savedAt: 200 }));
    expect(saves.latest()?.slot).toBe('retomada');
    saves.delete('retomada');
    expect(saves.latest()?.slot).toBe('auto');
    expect(saves.list()).toHaveLength(5);
  });

  it('exporta e importa todos os saves (com validação)', () => {
    saves.write('1', base({ flags: { x: 'y' } }));
    saves.write('auto', base({ playtimeMs: 9 }));
    const text = saves.exportAll();
    const other = new SaveManager(createMemoryStorage());
    expect(other.importAll(text).sort()).toEqual(['1', 'auto']);
    expect(other.read('1')?.flags).toEqual({ x: 'y' });
    expect(other.read('auto')?.playtimeMs).toBe(9);
    expect(() => other.importAll('{"format":"triskelion-saves","saves":{"1":{"version":3}}}')).toThrow();
    expect(() => other.importAll('lixo')).toThrow();
  });

  it('importa um save avulso para o espaço 1', () => {
    const other = new SaveManager(createMemoryStorage());
    expect(other.importAll(JSON.stringify({ ...base(), version: 2 }))).toEqual(['1']);
    expect(other.read('1')?.state.difficulty).toBe('tranquila');
  });

  it('migra save v1 até a versão atual e regrava', () => {
    storage.setItem(SAVE_PREFIX + '1', JSON.stringify({ version: 1, map: 'vila', x: 5, y: 6, facing: 'up', flags: { f: 1 }, time: 42 }));
    const d = saves.read('1');
    expect(d).not.toBeNull();
    expect(d!.position).toEqual({ map: 'vila', x: 5, y: 6, facing: 'up' });
    expect(d!.checkpoint).toEqual(d!.position);
    expect(d!.savedAt).toBe(42);
    expect(d!.state).toEqual(defaultPlayerState());
    expect(JSON.parse(storage.getItem(SAVE_PREFIX + '1')!).version).toBe(SAVE_VERSION);
  });

  it('recusa save de versão futura', () => {
    expect(() => migrate({ version: SAVE_VERSION + 1 })).toThrow(/futura/);
  });
});

describe('session', () => {
  beforeEach(() => session.reset());

  it('durante cutscene, o save usa a foto do início e marca o roteiro para recomeçar', () => {
    session.position = { ...pos };
    flags.set('antes');
    session.beginCutscene('prologo_12');
    flags.set('durante');
    session.position = { ...pos, x: 999 };
    session.addCoins(50);
    const snap = session.snapshot()!;
    expect(snap.position.x).toBe(10);
    expect(snap.flags).toEqual({ antes: true });
    expect(snap.state.coins).toBe(0);
    expect(snap.resumeDialogue).toBe('prologo_12');
    session.endCutscene();
    expect(session.snapshot()!.position.x).toBe(999);
    expect(session.snapshot()!.resumeDialogue).toBeUndefined();
  });

  it('inventário, moedas e atributos', () => {
    expect(session.addItem('rapadura', 2)).toBe(2);
    expect(session.addItem('rapadura', -2)).toBe(0);
    expect(session.state.inventory).toEqual({});
    expect(session.addCoins(-10)).toBe(0);
    expect(session.addAttribute('magia', 1)).toBe(2);
  });
});
