/**
 * Leitura do JSON do Tiled (sem Phaser), usada pelo Mundo e pelos testes.
 * Propriedades e classes esperadas: docs/tecnico/MAPAS.md
 */
export type PropValue = string | number | boolean;

export interface TiledProperty {
  name: string;
  type?: string;
  value: PropValue;
}

export interface TiledObject {
  id: number;
  name: string;
  type?: string;
  class?: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  point?: boolean;
  ellipse?: boolean;
  polyline?: { x: number; y: number }[];
  polygon?: { x: number; y: number }[];
  properties?: TiledProperty[];
  gid?: number;
}

export interface TiledLayer {
  id?: number;
  name: string;
  type: 'tilelayer' | 'objectgroup' | 'imagelayer' | 'group';
  objects?: TiledObject[];
  layers?: TiledLayer[];
  properties?: TiledProperty[];
  visible?: boolean;
  data?: number[];
  width?: number;
  height?: number;
}

export interface TiledTileset {
  firstgid: number;
  name?: string;
  source?: string;
  image?: string;
  tilewidth?: number;
  tileheight?: number;
  tiles?: { id: number; properties?: TiledProperty[]; animation?: { tileid: number; duration: number }[] }[];
}

export interface TiledMap {
  width: number;
  height: number;
  tilewidth: number;
  tileheight: number;
  orientation: string;
  infinite?: boolean;
  layers: TiledLayer[];
  tilesets: TiledTileset[];
  properties?: TiledProperty[];
}

export type EntityKind = 'npc' | 'enemy' | 'hide' | 'trigger' | 'exit' | 'checkpoint' | 'route' | 'marker' | 'inspect' | 'locked' | 'unknown';

const KIND_ALIASES: Record<string, EntityKind> = {
  npc: 'npc',
  inimigo: 'enemy',
  enemy: 'enemy',
  esconderijo: 'hide',
  hide: 'hide',
  gatilho: 'trigger',
  trigger: 'trigger',
  saida: 'exit',
  'saída': 'exit',
  exit: 'exit',
  checkpoint: 'checkpoint',
  rota: 'route',
  route: 'route',
  marcador: 'marker',
  marker: 'marker',
  examinar: 'inspect',
  examinavel: 'inspect',
  'examinável': 'inspect',
  inspect: 'inspect',
  interativo: 'inspect',
  atividade: 'inspect',
  activity: 'inspect',
  porta: 'exit',
  door: 'exit',
  porta_trancada: 'locked',
  locked_door: 'locked',
  trancada: 'locked',
};

export function props(o: { properties?: TiledProperty[] } | undefined): Record<string, PropValue> {
  const out: Record<string, PropValue> = {};
  const raw = o?.properties as unknown;
  if (Array.isArray(raw)) for (const p of raw as TiledProperty[]) out[p.name] = p.value;
  else if (raw && typeof raw === 'object') Object.assign(out, raw); // formato antigo do Tiled
  return out;
}

export function objectKind(o: TiledObject, layerName = ''): EntityKind {
  const cls = (o.type || o.class || '').trim().toLowerCase();
  if (KIND_ALIASES[cls]) return KIND_ALIASES[cls]!;
  if (layerName.toLowerCase() === 'markers' || layerName.toLowerCase() === 'marcadores') return 'marker';
  if (o.polyline || o.polygon) return 'route';
  if (o.properties?.some((p) => p.name === 'activity' || p.name === 'atividade')) return 'inspect';
  if (o.properties?.some((p) => p.name === 'trancada_texto' || p.name === 'locked_text')) return 'locked';
  return 'unknown';
}

/** Todas as camadas de objetos (inclusive dentro de grupos). */
export function objectLayers(map: TiledMap): TiledLayer[] {
  const out: TiledLayer[] = [];
  const walk = (ls: TiledLayer[]) => {
    for (const l of ls) {
      if (l.type === 'objectgroup') out.push(l);
      else if (l.type === 'group' && l.layers) walk(l.layers);
    }
  };
  walk(map.layers);
  return out;
}

export function allObjects(map: TiledMap): { obj: TiledObject; layer: string; kind: EntityKind }[] {
  return objectLayers(map).flatMap((l) =>
    (l.objects ?? []).map((obj) => ({ obj, layer: l.name, kind: objectKind(obj, l.name) })),
  );
}

/** Ponto de referência do objeto: pontos = (x,y); retângulos = centro. */
export function objectCenter(o: TiledObject): { x: number; y: number } {
  if (o.point || (!o.width && !o.height)) return { x: o.x, y: o.y };
  return { x: o.x + (o.width ?? 0) / 2, y: o.y + (o.height ?? 0) / 2 };
}

/** Pontos absolutos de uma polilinha/polígono. */
export function routePoints(o: TiledObject): { x: number; y: number }[] {
  const pts = o.polyline ?? o.polygon ?? [];
  return pts.map((p) => ({ x: o.x + p.x, y: o.y + p.y }));
}

export interface TileAnimation {
  /** gids dos quadros, em ordem. */
  frames: { gid: number; duration: number }[];
  /** Duração total do ciclo (ms). */
  total: number;
}

/**
 * Tiles animados no formato padrão do Tiled: no tileset embutido,
 * `tiles: [{ id, animation: [{ tileid, duration }, ...] }]`. Retorna gid → animação.
 */
export function tileAnimations(map: Pick<TiledMap, 'tilesets'>): Map<number, TileAnimation> {
  const out = new Map<number, TileAnimation>();
  for (const ts of map.tilesets) {
    for (const t of ts.tiles ?? []) {
      const frames = (t.animation ?? [])
        .filter((f) => Number.isInteger(f.tileid) && f.duration > 0)
        .map((f) => ({ gid: ts.firstgid + f.tileid, duration: f.duration }));
      if (frames.length < 2) continue;
      out.set(ts.firstgid + t.id, { frames, total: frames.reduce((a, f) => a + f.duration, 0) });
    }
  }
  return out;
}

/** Quadro (gid) da animação no instante `ms` (relógio global: todos os tiles iguais ficam sincronizados, como no Tiled). */
export function animFrameAt(anim: TileAnimation, ms: number): number {
  let t = ((ms % anim.total) + anim.total) % anim.total;
  for (const f of anim.frames) {
    if (t < f.duration) return f.gid;
    t -= f.duration;
  }
  return anim.frames[anim.frames.length - 1]!.gid;
}

/** Validação leve de um mapa (usada pelos testes de conteúdo). */
export function validateMap(id: string, map: TiledMap, knownMaps: ReadonlySet<string>, knownDialogues: ReadonlySet<string>): string[] {
  const errs: string[] = [];
  if (map.orientation !== 'orthogonal') errs.push(`${id}: orientação deve ser "orthogonal"`);
  if (map.infinite) errs.push(`${id}: mapas infinitos não são suportados`);
  if (map.tilewidth !== 16 || map.tileheight !== 16) errs.push(`${id}: tiles devem ser 16×16`);
  for (const ts of map.tilesets) {
    if (ts.source) errs.push(`${id}: tileset "${ts.source}" é externo; use "Embed tileset" no Tiled`);
    for (const t of ts.tiles ?? []) {
      for (const f of t.animation ?? []) {
        const count = (ts as { tilecount?: number }).tilecount;
        if (!(f.duration > 0)) errs.push(`${id}: tileset "${ts.name}" tile ${t.id}: quadro com duração inválida`);
        if (count !== undefined && (f.tileid < 0 || f.tileid >= count)) errs.push(`${id}: tileset "${ts.name}" tile ${t.id}: quadro ${f.tileid} fora do tileset`);
      }
    }
  }
  const markerNames = new Set<string>();
  const routeNames = new Set<string>();
  const objs = allObjects(map);
  for (const { obj, kind } of objs) {
    if (kind === 'marker' && obj.name) markerNames.add(obj.name);
    if ((kind === 'route' || obj.polyline || obj.polygon) && obj.name) routeNames.add(obj.name);
  }
  if (!objectLayers(map).some((l) => /^(markers|marcadores)$/i.test(l.name))) {
    errs.push(`${id}: falta a camada de objetos "markers"`);
  }
  for (const { obj, kind } of objs) {
    const p = props(obj);
    const where = `${id}: objeto #${obj.id} "${obj.name}" (${kind})`;
    for (const key of ['dialogue', 'dialogo', 'alt_dialogue', 'dialogo_alt', 'locked_dialogue', 'dialogo_trancada', 'used_dialogue']) {
      const dlg = p[key];
      if (typeof dlg !== 'string' || !dlg) continue;
      for (const id of dlg.split(',').map((x) => x.trim())) {
        if (!knownDialogues.has(id)) errs.push(`${where}: diálogo "${id}" (${key}) não existe`);
      }
    }
    if (kind === 'exit') {
      const target = String(p.map ?? p.mapa ?? '');
      const isReturn = p.return === true || p.voltar === true;
      if (!target && !isReturn) errs.push(`${where}: saída sem propriedade "map" (ou "return": true)`);
      else if (target && !knownMaps.has(target)) errs.push(`${where}: mapa "${target}" não existe`);
    }
    if (kind === 'enemy' && !obj.polyline && !obj.polygon) {
      const r = p.route ?? p.rota;
      const byMarkers = typeof r === 'string' && [...markerNames].some((m) => m.startsWith(`${r}_p`));
      if (typeof r === 'string' && r && !routeNames.has(r) && !byMarkers) errs.push(`${where}: rota "${r}" não existe`);
    }
    if (kind === 'npc' || kind === 'enemy') {
      if (!obj.name) errs.push(`${where}: NPC/inimigo precisa de nome (é o id usado nos roteiros)`);
    }
  }
  return errs;
}

/**
 * Fala padrão de um NPC sem `dialogue`: procura, nesta ordem,
 * padrao_<tipo>_<periodo>, padrao_<tipo>, padrao_pessoa_<periodo>, padrao_pessoa.
 * `tipo` vem da propriedade `tipo` do NPC ou do nome do sprite (sem números no fim).
 */
export function defaultNpcDialogueId(
  tipo: string | undefined,
  sprite: string | undefined,
  periodo: string | undefined,
  exists: (id: string) => boolean,
): string | undefined {
  const t = (tipo || (sprite ?? '').replace(/_poses$/, '').replace(/_\d+$/, '') || 'pessoa').toLowerCase();
  const cands = [periodo && `padrao_${t}_${periodo}`, `padrao_${t}`, periodo && `padrao_pessoa_${periodo}`, 'padrao_pessoa'];
  return cands.find((c): c is string => !!c && exists(c));
}
