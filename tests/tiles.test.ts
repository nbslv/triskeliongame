import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { animFrameAt, tileAnimations, type TiledMap, type TiledTileset } from '../src/systems/world/tiled';

describe('tiles animados (formato do Tiled)', () => {
  const map = {
    tilesets: [
      { firstgid: 1, name: 'a', tiles: [{ id: 0, properties: [] }] },
      {
        firstgid: 101,
        name: 'fogo',
        tiles: [
          { id: 0, animation: [{ tileid: 0, duration: 100 }, { tileid: 1, duration: 100 }, { tileid: 2, duration: 200 }] },
          { id: 5, animation: [{ tileid: 5, duration: 100 }] }, // 1 quadro: ignorado
        ],
      },
    ],
  } as unknown as Pick<TiledMap, 'tilesets'>;

  it('lê animações com gid absoluto (firstgid + tileid)', () => {
    const anims = tileAnimations(map);
    expect([...anims.keys()]).toEqual([101]);
    expect(anims.get(101)).toEqual({ frames: [{ gid: 101, duration: 100 }, { gid: 102, duration: 100 }, { gid: 103, duration: 200 }], total: 400 });
  });

  it('escolhe o quadro pelo tempo, em ciclo', () => {
    const a = tileAnimations(map).get(101)!;
    expect([0, 99, 100, 199, 200, 399, 400, 450].map((t) => animFrameAt(a, t))).toEqual([101, 101, 102, 102, 103, 103, 101, 101]);
  });
});

describe('tilesets da arte (docs/arte/tilesets)', () => {
  const dir = join(__dirname, '..', 'docs', 'arte', 'tilesets');
  const files = existsSync(dir) ? readdirSync(dir).filter((f) => /^tiles_[a-z_]+\.json$/.test(f) && !f.includes('indices')) : [];

  it.each(files)('%s é embutível: nome = imagem em assets/tilesets, 16×16, propriedades válidas', (f) => {
    const ts = JSON.parse(readFileSync(join(dir, f), 'utf8')) as TiledTileset & { tilecount: number; columns: number };
    expect(ts.tilewidth).toBe(16);
    expect(ts.tileheight).toBe(16);
    expect(existsSync(join(__dirname, '..', 'assets', 'tilesets', `${ts.name}.png`))).toBe(true);
    for (const t of ts.tiles ?? []) {
      expect(t.id).toBeGreaterThanOrEqual(0);
      expect(t.id).toBeLessThan(ts.tilecount);
      for (const p of t.properties ?? []) {
        expect(['collides', 'hide', 'colisao', 'esconderijo']).toContain(p.name);
        expect(typeof p.value).toBe('boolean');
      }
    }
  });
});
