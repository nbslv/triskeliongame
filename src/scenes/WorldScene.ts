import Phaser from 'phaser';
import {
  DEPTH,
  GAME_HEIGHT,
  GAME_WIDTH,
  NPC_SPEED,
  PLAYER_RUN_SPEED,
  PLAYER_SPEED,
  SCENES,
  TILE_SIZE,
  type Direction,
} from '../config/constants';
import { audio } from '../core/audio';
import { bus } from '../core/events';
import { evaluateCondition, flags } from '../core/flags';
import { input } from '../core/input';
import { session } from '../core/session';
import { SPRITE_ALIASES, characterSprite, gameConfig, maps } from '../content';
import { director, resolveScript } from '../systems/dialogue/director';
import { runActivity } from '../systems/activity/registry';
import type { Target } from '../systems/dialogue/types';
import { Patrol } from '../systems/stealth/Patrol';
import { Actor } from '../systems/world/Actor';
import {
  allObjects,
  objectCenter,
  props,
  routePoints,
  tileAnimations,
  animFrameAt,
  type TileAnimation,
  type PropValue,
  type TiledMap,
  type TiledObject,
} from '../systems/world/tiled';
import { PLACEHOLDER_TILESET_KEY } from '../ui/placeholders';

export interface WorldData {
  map: string;
  /** Marcador, tile [x,y] ou posição em pixels {x,y}. */
  at?: Target | { x: number; y: number };
  facing?: Direction;
  /** Renascendo após ser visto (não faz autosave). */
  respawn?: boolean;
  /** Roteiro a executar quando o mapa ficar pronto. */
  dialogue?: string;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Zone {
  obj: TiledObject;
  rect: Rect;
  p: Record<string, PropValue>;
  inside: boolean;
}

const contains = (r: Rect, x: number, y: number) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
const str = (v: PropValue | undefined): string | undefined => (v === undefined || v === '' ? undefined : String(v));
const isTrue = (v: PropValue | undefined): boolean => v === true || v === 'true';
const OPPOSITE: Record<Direction, Direction> = { up: 'down', down: 'up', left: 'right', right: 'left' };
const AUTOSAVE_EVERY_MS = 60_000;
const num = (v: PropValue | undefined, d: number): number => (typeof v === 'number' ? v : v !== undefined && v !== '' ? Number(v) || d : d);

/**
 * Exploração top-down: mapa Tiled, colisão, câmera, NPCs, gatilhos, saídas,
 * furtividade (inimigos com cone de visão, esconderijos, checkpoints).
 */
export class WorldScene extends Phaser.Scene {
  mapId = '';
  private mapData!: TiledMap;
  private tilemap!: Phaser.Tilemaps.Tilemap;
  private collisionLayers: Phaser.Tilemaps.TilemapLayer[] = [];
  private tileLayers: Phaser.Tilemaps.TilemapLayer[] = [];
  player!: Actor;
  private actors = new Map<string, Actor>();
  private npcs: { actor: Actor; p: Record<string, PropValue> }[] = [];
  private patrols: Patrol[] = [];
  private triggers: Zone[] = [];
  private exits: Zone[] = [];
  private hides: Rect[] = [];
  private checkpoints: Zone[] = [];
  private inspects: Zone[] = [];
  private glows = new Map<Zone, Phaser.GameObjects.GameObject>();
  private lastSafe = { x: 0, y: 0 };
  private exploreMs = 0;
  /** Tiles animados (formato do Tiled): instâncias por animação. */
  private animTiles: { anim: TileAnimation; tiles: Phaser.Tilemaps.Tile[]; current: number }[] = [];
  private dark: { rt: Phaser.GameObjects.RenderTexture; brush: Phaser.GameObjects.Image; radius: number } | null = null;
  private markers = new Map<string, { x: number; y: number }>();
  private fadeRect!: Phaser.GameObjects.Rectangle;
  private transitioning = false;
  private caught = false;
  private hidden = false;
  private ready = false;
  private pendingDialogue: string | undefined;

  constructor() {
    super(SCENES.mundo);
  }

  init(): void {
    this.actors = new Map();
    this.npcs = [];
    this.patrols = [];
    this.triggers = [];
    this.exits = [];
    this.hides = [];
    this.checkpoints = [];
    this.inspects = [];
    this.glows = new Map();
    this.dark = null;
    this.animTiles = [];
    this.exploreMs = 0;
    this.markers = new Map();
    this.collisionLayers = [];
    this.tileLayers = [];
    this.transitioning = false;
    this.caught = false;
    this.hidden = false;
    this.ready = false;
  }

  create(data: WorldData): void {
    const raw = maps.get(data.map);
    if (!raw) {
      console.error(`[mundo] mapa "${data.map}" não existe em content/maps/`);
      this.add.text(20, 20, `Mapa "${data.map}" não encontrado`, { color: '#ff6666' });
      return;
    }
    this.mapId = data.map;
    this.mapData = raw as TiledMap;
    this.buildTilemap();
    this.collectAnimatedTiles();
    this.buildObjects();

    // Jogador
    const start = this.resolveStart(data);
    const facing = data.facing ?? 'down';
    this.player = new Actor(this, gameConfig.playerId, gameConfig.playerSprite, start.x, start.y, facing);
    this.actors.set(gameConfig.playerId, this.player);
    for (const l of this.collisionLayers) this.physics.add.collider(this.player.sprite, l);
    for (const { actor } of this.npcs) this.physics.add.collider(this.player.sprite, actor.sprite);
    this.player.body.setCollideWorldBounds(true);

    // Câmera
    const mw = this.tilemap.widthInPixels;
    const mh = this.tilemap.heightInPixels;
    this.physics.world.setBounds(0, 0, mw, mh);
    const cam = this.cameras.main;
    cam.setBounds(Math.min(0, (mw - GAME_WIDTH) / 2), Math.min(0, (mh - GAME_HEIGHT) / 2), Math.max(mw, GAME_WIDTH), Math.max(mh, GAME_HEIGHT));
    cam.startFollow(this.player.sprite, true, 0.15, 0.15);
    cam.setRoundPixels(true);
    cam.setBackgroundColor('#0b0a12');

    // Tela de fade (mantida entre mapas durante cutscenes)
    this.fadeRect = this.add
      .rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, director.fadeState.color, director.active ? director.fadeState.alpha : 0)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(DEPTH.overlay);
    if (!director.active) {
      director.fadeState.alpha = 0;
      cam.fadeIn(250, 0, 0, 0);
    }

    // Mapa escuro (túnel): círculo de luz em volta do jogador
    const mp0 = props(this.mapData);
    if (isTrue(mp0.escuro ?? mp0.dark)) this.createDarkness(num(mp0.luz_raio ?? mp0.light_radius, 56));

    // Posição e checkpoint
    session.active = true;
    this.lastSafe = { x: this.player.x, y: this.player.y };
    session.position = this.currentPosition();
    if (!data.respawn) this.setCheckpointAt(this.player.x, this.player.y);

    // Música do mapa (propriedade "music"/"musica" do mapa)
    const mp = props(this.mapData);
    const music = str(mp.music ?? mp.musica);
    if (music && !director.active) audio.playMusic(music, 1000);

    this.pendingDialogue = data.dialogue;
    input.setJoystickEnabled(!director.active);
    input.clearPresses();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      bus.emit('map:leave', { map: this.mapId });
      this.patrols.forEach((p) => p.destroy());
    });

    // Pronto no próximo quadro (corpos de física já posicionados).
    this.time.delayedCall(0, () => {
      this.ready = true;
      if (!data.respawn && !director.active) this.autosave(false);
      bus.emit('map:ready', { map: this.mapId });
      if (data.respawn) bus.emit('stealth:respawn', { map: this.mapId });
      if (this.pendingDialogue) {
        const id = this.pendingDialogue;
        this.pendingDialogue = undefined;
        void director.run(id);
      } else if (!director.active) {
        // Gatilhos "ao carregar" (activation = load)
        for (const z of this.triggers) {
          if (this.activation(z) === 'load' && this.fireTrigger(z)) break;
        }
      }
    });
  }

  // ---------------------------------------------------------------- construção

  private buildTilemap(): void {
    const key = `map:${this.mapId}`;
    if (!this.cache.tilemap.exists(key)) {
      this.cache.tilemap.add(key, { format: Phaser.Tilemaps.Formats.TILED_JSON, data: this.mapData });
    }
    this.tilemap = this.make.tilemap({ key });
    const tilesets: Phaser.Tilemaps.Tileset[] = [];
    for (const ts of this.tilemap.tilesets) {
      const texKey = this.textures.exists(`tileset:${ts.name}`) ? `tileset:${ts.name}` : PLACEHOLDER_TILESET_KEY;
      if (texKey === PLACEHOLDER_TILESET_KEY && ts.name !== 'placeholder') {
        console.warn(`[mundo] tileset "${ts.name}" sem imagem em assets/tilesets/; usando placeholder`);
      }
      const added = this.tilemap.addTilesetImage(ts.name, texKey, ts.tileWidth, ts.tileHeight, ts.tileMargin, ts.tileSpacing);
      if (added) tilesets.push(added);
    }
    this.tilemap.layers.forEach((ld, i) => {
      const layer = this.tilemap.createLayer(ld.name, tilesets, 0, 0);
      if (!layer) return;
      const lp = props({ properties: ld.properties as never });
      const above = lp.above === true || lp.acima === true || /^(acima|above|topo)/i.test(ld.name);
      layer.setDepth(above ? DEPTH.above + i : DEPTH.ground + i);
      if (lp.collides === true || lp.colisao === true) {
        layer.setCollisionByExclusion([-1]);
      } else {
        layer.setCollisionByProperty({ collides: true });
        layer.setCollisionByProperty({ colisao: true });
      }
      this.tileLayers.push(layer);
      if (layer.layer.collideIndexes.length > 0 || lp.collides === true || lp.colisao === true || this.layerHasCollision(layer)) {
        this.collisionLayers.push(layer);
      }
    });
  }

  /** Junta as instâncias de cada tile animado (o gid original guarda a animação). */
  private collectAnimatedTiles(): void {
    const anims = tileAnimations(this.mapData);
    if (anims.size === 0) return;
    const byGid = new Map<number, Phaser.Tilemaps.Tile[]>();
    for (const layer of this.tileLayers) {
      layer.forEachTile((t) => {
        if (anims.has(t.index)) {
          const list = byGid.get(t.index) ?? [];
          list.push(t);
          byGid.set(t.index, list);
        }
      });
    }
    for (const [gid, tiles] of byGid) this.animTiles.push({ anim: anims.get(gid)!, tiles, current: gid });
  }

  private updateAnimatedTiles(time: number): void {
    for (const a of this.animTiles) {
      const gid = animFrameAt(a.anim, time);
      if (gid === a.current) continue;
      a.current = gid;
      for (const t of a.tiles) t.index = gid;
    }
  }

  private layerHasCollision(layer: Phaser.Tilemaps.TilemapLayer): boolean {
    let found = false;
    layer.forEachTile((t) => {
      if (t.collides) found = true;
    });
    return found;
  }

  private buildObjects(): void {
    const objs = allObjects(this.mapData);
    const routes = new Map<string, TiledObject>();
    for (const { obj, kind } of objs) {
      if (kind === 'marker' && obj.name) this.markers.set(obj.name, objectCenter(obj));
      if ((obj.polyline || obj.polygon) && obj.name) routes.set(obj.name, obj);
    }
    for (const { obj, kind } of objs) {
      const p = props(obj);
      if (!this.conditionsMet(p)) continue;
      const rect: Rect = { x: obj.x, y: obj.y, w: obj.width ?? 0, h: obj.height ?? 0 };
      switch (kind) {
        case 'npc': {
          const c = objectCenter(obj);
          const sprite = str(p.sprite) ?? characterSprite(obj.name) ?? obj.name;
          const a = new Actor(this, obj.name, sprite, c.x, c.y, (str(p.facing ?? p.direcao) as Direction) ?? 'down');
          a.body.setImmovable(true);
          a.body.pushable = false;
          this.actors.set(obj.name, a);
          this.npcs.push({ actor: a, p });
          break;
        }
        case 'enemy':
          this.spawnEnemy(obj, p, routes);
          break;
        case 'hide':
          this.hides.push(rect);
          break;
        case 'trigger':
          this.triggers.push({ obj, rect, p, inside: false });
          break;
        case 'exit':
          this.exits.push({ obj, rect, p, inside: false });
          break;
        case 'checkpoint':
          this.checkpoints.push({ obj, rect, p, inside: false });
          break;
        case 'inspect': {
          // Pontos viram uma área de 1 tile em volta.
          const r = rect.w && rect.h ? rect : { x: obj.x - 8, y: obj.y - 12, w: 16, h: 16 };
          const z: Zone = { obj, rect: r, p, inside: false };
          this.inspects.push(z);
          if (isTrue(p.glow ?? p.brilho) && !flags.isSet(this.usedFlag(z))) this.addGlow(z);
          break;
        }
        default:
          break;
      }
    }
  }

  private addGlow(z: Zone): void {
    const cx = z.rect.x + z.rect.w / 2;
    const cy = z.rect.y + z.rect.h / 2;
    const g = this.add.star(cx, cy - 6, 4, 1.5, 4, 0xfff3b0).setDepth(DEPTH.above - 1).setAlpha(0.9);
    this.tweens.add({ targets: g, alpha: 0.2, scale: 0.6, yoyo: true, repeat: -1, duration: 600, ease: 'Sine.easeInOut' });
    this.glows.set(z, g);
  }

  private createDarkness(radius: number): void {
    if (!this.textures.exists('luz_pincel')) {
      const t = this.textures.createCanvas('luz_pincel', 256, 256)!;
      const ctx = t.getContext();
      const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(0.6, 'rgba(255,255,255,0.9)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);
      t.refresh();
    }
    const rt = this.add.renderTexture(0, 0, GAME_WIDTH, GAME_HEIGHT).setOrigin(0).setScrollFactor(0).setDepth(DEPTH.above + 50);
    const brush = this.make.image({ key: 'luz_pincel', add: false });
    this.dark = { rt, brush, radius };
  }

  private drawDarkness(): void {
    const d = this.dark;
    if (!d) return;
    const cam = this.cameras.main;
    d.rt.clear();
    d.rt.fill(0x000000, 0.97);
    if (d.radius > 0) {
      d.brush.setScale((d.radius * 2) / 256 * 1.25);
      d.brush.setPosition(this.player.x - cam.scrollX, this.player.y - 10 - cam.scrollY);
      d.rt.erase(d.brush);
    }
  }

  /** Muda o raio de luz em mapas escuros (passo `light`). */
  setLight(radius: number, ms: number): Promise<void> {
    if (!this.dark) {
      const mp = props(this.mapData);
      this.createDarkness(num(mp.luz_raio ?? mp.light_radius, 56));
    }
    const d = this.dark!;
    return new Promise((resolve) => {
      this.tweens.add({ targets: d, radius, duration: Math.max(1, ms), onComplete: () => resolve() });
    });
  }

  private spawnEnemy(obj: TiledObject, p: Record<string, PropValue>, routes: Map<string, TiledObject>): void {
    const routeName = String(p.route ?? p.rota ?? '');
    const routeObj = obj.polyline || obj.polygon ? obj : routes.get(routeName);
    let route = routeObj ? routePoints(routeObj) : [];
    if (!routeObj && routeName) {
      // Rota por marcadores numerados: <rota>_p1, <rota>_p2, ...
      route = [...this.markers.entries()]
        .map(([name, pt]) => ({ n: Number(new RegExp(`^${routeName}_p(\\d+)$`).exec(name)?.[1]), pt }))
        .filter((e) => Number.isFinite(e.n))
        .sort((a, b) => a.n - b.n)
        .map((e) => e.pt);
    }
    const start = route[0] ?? objectCenter(obj);
    const sprite = str(p.sprite) ?? characterSprite(obj.name) ?? 'caligosuin';
    const a = new Actor(this, obj.name || `inimigo_${obj.id}`, sprite, start.x, start.y, (str(p.facing ?? p.direcao) as Direction) ?? 'down');
    this.actors.set(a.id, a);
    const modeProp = str(p.mode ?? p.modo);
    const patrol = new Patrol(
      a,
      {
        route,
        mode: modeProp === 'loop' || modeProp === 'pingpong' ? modeProp : routeObj?.polygon ? 'loop' : 'pingpong',
        speed: num(p.speed ?? p.velocidade, 40),
        waitMs: num(p.wait ?? p.espera, 700),
        range: num(p.vision ?? p.visao, 80),
        angleDeg: num(p.angle ?? p.angulo, 70),
        turnMs: num(p.turn ?? p.girar, 0),
      },
      (x, y) => this.isSolid(x, y),
    );
    this.patrols.push(patrol);
  }

  private conditionsMet(p: Record<string, PropValue>): boolean {
    const req = str(p.requires ?? p.requer);
    const unless = str(p.unless ?? p.exceto);
    if (req && !evaluateCondition(req, flags)) return false;
    if (unless && evaluateCondition(unless, flags)) return false;
    return true;
  }

  private resolveStart(data: WorldData): { x: number; y: number } {
    const at = data.at;
    if (at && typeof at === 'object' && !Array.isArray(at)) return at;
    if (at !== undefined) {
      const r = this.resolveTarget(at);
      if (r) return r;
    }
    return this.markers.get(gameConfig.startMarker) ?? this.markers.values().next().value ?? { x: 32, y: 32 };
  }

  /** Converte tile [x,y] / nome de marcador / id de ator em pixels (ponto nos pés). */
  resolveTarget(t: Target): { x: number; y: number } | null {
    if (Array.isArray(t)) return { x: t[0] * TILE_SIZE + TILE_SIZE / 2, y: t[1] * TILE_SIZE + TILE_SIZE - 1 };
    const m = this.markers.get(t);
    if (m) return { ...m };
    const a = this.actors.get(t);
    if (a) return { x: a.x, y: a.y };
    console.warn(`[mundo] alvo "${t}" não é marcador nem ator em ${this.mapId}`);
    return null;
  }

  isSolid(x: number, y: number): boolean {
    for (const l of this.collisionLayers) {
      const t = l.getTileAtWorldXY(x, y);
      if (t?.collides) return true;
    }
    return x < 0 || y < 0 || x >= this.tilemap.widthInPixels || y >= this.tilemap.heightInPixels;
  }

  private tileHides(x: number, y: number): boolean {
    for (const l of this.tileLayers) {
      const t = l.getTileAtWorldXY(x, y);
      const tp = t?.properties as Record<string, unknown> | undefined;
      if (tp && (tp.hide === true || tp.esconderijo === true)) return true;
    }
    return false;
  }

  // ---------------------------------------------------------------- loop

  override update(time: number, delta: number): void {
    if (!this.player || !this.ready) return;
    this.updateAnimatedTiles(time);
    const cutscene = director.active;
    this.drawDarkness();
    if (!cutscene && !this.transitioning) {
      session.playtimeMs += delta;
      this.exploreMs += delta;
      if (this.exploreMs >= AUTOSAVE_EVERY_MS && !this.caught) {
        this.exploreMs = 0;
        this.autosave(false);
      }
    }

    for (const p of this.patrols) {
      p.paused = cutscene || this.transitioning;
      p.update(time);
    }
    for (const a of this.actors.values()) a.syncDepth();

    if (cutscene || this.transitioning || this.caught) {
      if (!cutscene) this.player.walk(0, 0);
      else this.player.body.setVelocity(0, 0);
      return;
    }

    // Menu
    if (input.consume('MENU')) {
      this.player.walk(0, 0);
      this.openMenu();
      return;
    }

    // Movimento
    const ax = input.axis();
    const run = input.isDown('B');
    const speed = run ? PLAYER_RUN_SPEED : PLAYER_SPEED;
    this.player.walk(ax.x * speed, ax.y * speed);
    session.position = this.currentPosition();

    // Esconderijo
    const fx = this.player.x;
    const fy = this.player.y - 3;
    this.hidden = this.hides.some((r) => contains(r, fx, fy)) || this.tileHides(fx, fy);
    this.player.sprite.setAlpha(this.hidden ? 0.45 : 1);

    // Interação
    if (input.consume('A')) {
      if (this.tryInteract()) return;
    }

    // Zonas
    if (this.checkZones()) return;
    if (!this.exits.some((z) => z.inside)) this.lastSafe = { x: this.player.x, y: this.player.y };

    // Furtividade
    if (!this.hidden) {
      const eyeTarget = { x: this.player.x, y: this.player.y - 8 };
      for (const p of this.patrols) {
        const close = Phaser.Math.Distance.Between(p.actor.x, p.actor.y, this.player.x, this.player.y) < 12;
        if (close || p.canSee(eyeTarget) || p.canSee({ x: this.player.x, y: this.player.y - 2 })) {
          this.onSpotted(p);
          return;
        }
      }
    }
  }

  private tryInteract(): boolean {
    const off: Record<Direction, [number, number]> = { down: [0, 12], up: [0, -14], left: [-12, -3], right: [12, -3] };
    const [ox, oy] = off[this.player.facing];
    const px = this.player.x + ox;
    const py = this.player.y + oy;
    // NPC mais próximo do ponto à frente
    let best: { actor: Actor; p: Record<string, PropValue> } | null = null;
    let bestD = 14;
    for (const n of this.npcs) {
      if (!n.actor.sprite.active) continue;
      const d = Phaser.Math.Distance.Between(px, py, n.actor.x, n.actor.y - 4);
      if (d < bestD) {
        bestD = d;
        best = n;
      }
    }
    if (best) {
      const dlg = this.dialogueFor(best.p);
      if (dlg) {
        this.player.walk(0, 0);
        best.actor.faceToward(this.player.x, this.player.y);
        this.player.faceToward(best.actor.x, best.actor.y);
        void director.run(dlg, { self: best.actor.id });
        return true;
      }
    }
    // Examináveis / atividades / gatilhos de interação — o mais próximo do ponto à frente
    // Área um pouco maior que o objeto: não exige alinhamento ao pixel.
    const grown = (r: Rect): Rect => ({ x: r.x - 4, y: r.y - 4, w: r.w + 8, h: r.h + 8 });
    const here = (z: Zone) => contains(grown(z.rect), px, py) || contains(z.rect, this.player.x, this.player.y - 3);
    for (const z of this.inspects) {
      if (here(z) && this.useInspect(z)) return true;
    }
    for (const z of this.triggers) {
      if (this.activation(z) !== 'interact') continue;
      if (here(z) && this.fireTrigger(z)) return true;
    }
    return false;
  }

  private activation(z: Zone): 'touch' | 'interact' | 'load' {
    const a = str(z.p.activation ?? z.p.ativacao);
    if (a === 'interact' || a === 'interagir') return 'interact';
    if (a === 'load' || a === 'carregar' || a === 'ao_carregar') return 'load';
    return 'touch';
  }

  /** Diálogo do objeto: `alt_dialogue` quando `alt_if` for verdadeira, senão `dialogue`. */
  private dialogueFor(p: Record<string, PropValue>): string | undefined {
    const altIf = str(p.alt_if ?? p.alt_se);
    const alt = str(p.alt_dialogue ?? p.dialogo_alt);
    if (alt && altIf && evaluateCondition(altIf, flags)) return alt;
    return str(p.dialogue ?? p.dialogo);
  }

  private usedFlag(z: Zone): string {
    return `usado.${this.mapId}.${z.obj.name || z.obj.id}`;
  }

  /**
   * Objeto examinável/atividade (botão A). Propriedades: dialogue, alt_dialogue/alt_if, activity (+ param_*),
   * once, used_dialogue, counter/counter_goal/counter_flag (contador, ex.: colheita), glow.
   */
  private useInspect(z: Zone): boolean {
    const p = z.p;
    if (!this.conditionsMet(p)) return false;
    const counter = str(p.counter ?? p.contador);
    const once = isTrue(p.once ?? p.unica) || !!counter;
    const used = flags.isSet(this.usedFlag(z));
    if (once && used) {
      const again = str(p.used_dialogue ?? p.dialogo_usado);
      if (again && resolveScript(again)) {
        void director.run(again, { self: z.obj.name || undefined });
        return true;
      }
      return false;
    }
    const activity = str(p.activity ?? p.atividade);
    const dlg = this.dialogueFor(p);
    if (!activity && !(dlg && resolveScript(dlg))) {
      console.warn(`[mundo] examinável "${z.obj.name}" sem diálogo/atividade válido`);
      return false;
    }
    this.player.walk(0, 0);
    flags.set(this.usedFlag(z), true);
    this.glows.get(z)?.destroy();
    this.glows.delete(z);
    if (counter) {
      const n = flags.add(counter, 1);
      const goal = num(p.counter_goal ?? p.contador_meta, 0);
      const done = str(p.counter_flag ?? p.contador_flag);
      if (goal > 0 && n >= goal && done) flags.set(done, true);
    }
    if (activity) {
      const params: Record<string, PropValue> = {};
      for (const [k, v] of Object.entries(p)) if (k.startsWith('param_')) params[k.slice(6)] = v;
      input.clearPresses();
      void runActivity(this, activity, params).then(() => {
        input.clearPresses();
        input.setJoystickEnabled(true);
        this.autosave(false);
      });
      return true;
    }
    // Examinar não é cutscene: passa o objeto como "self" (sem autosave/retomada).
    void director.run(dlg!, { self: z.obj.name || 'objeto' });
    return true;
  }

  private triggerFlag(z: Zone): string {
    return str(z.p.flag) ?? `gatilho.${this.mapId}.${z.obj.name || z.obj.id}`;
  }

  private fireTrigger(z: Zone): boolean {
    const once = z.p.once ?? z.p.unica ?? true;
    if (once !== false && flags.isSet(this.triggerFlag(z))) return false;
    if (!this.conditionsMet(z.p)) return false;
    const dlg = this.dialogueFor(z.p);
    if (!dlg || !resolveScript(dlg)) {
      console.warn(`[mundo] gatilho "${z.obj.name}" sem diálogo válido`);
      return false;
    }
    if (once !== false) flags.set(this.triggerFlag(z), true);
    this.player.walk(0, 0);
    void director.run(dlg);
    return true;
  }

  /** Verifica gatilhos de toque, checkpoints e saídas. Retorna true se algo começou. */
  private checkZones(): boolean {
    const x = this.player.x;
    const y = this.player.y - 3;
    for (const z of this.checkpoints) {
      const inside = contains(z.rect, x, y);
      if (inside && !z.inside) {
        this.setCheckpointAt(this.player.x, this.player.y);
        if (z.p.autosave !== false) this.autosave(false);
      }
      z.inside = inside;
    }
    for (const z of this.triggers) {
      if (this.activation(z) !== 'touch') continue;
      const inside = contains(z.rect, x, y);
      const entered = inside && !z.inside;
      z.inside = inside;
      if (entered && this.fireTrigger(z)) return true;
    }
    for (const z of this.exits) {
      const inside = contains(z.rect, x, y);
      const entered = inside && !z.inside;
      z.inside = inside;
      if (entered && this.conditionsMet(z.p)) {
        if (this.takeExit(z)) return true;
      }
    }
    return false;
  }

  /**
   * Porta/saída. `locked_if` (condição) bloqueia e roda `locked_dialogue`; `return: true` volta ao ponto
   * guardado ao entrar (interiores com várias portas de fora); senão vai para `map` + `entry`.
   */
  private takeExit(z: Zone): boolean {
    const p = z.p;
    const lockedIf = str(p.locked_if ?? p.trancada_se);
    if (lockedIf && evaluateCondition(lockedIf, flags)) {
      this.player.walk(0, 0);
      this.player.sprite.setPosition(this.lastSafe.x, this.lastSafe.y);
      z.inside = false;
      const msg = str(p.locked_dialogue ?? p.dialogo_trancada);
      if (msg && resolveScript(msg)) void director.run(msg, { self: z.obj.name || 'porta' });
      return true;
    }
    const facing = (str(p.facing ?? p.direcao) as Direction | undefined) ?? this.player.facing;
    if (isTrue(p.return ?? p.voltar) && session.returnPoint && maps.has(session.returnPoint.map)) {
      const rp = session.returnPoint;
      session.returnPoint = null;
      this.changeMap(rp.map, { x: rp.x, y: rp.y }, rp.facing);
      return true;
    }
    const map = str(p.map ?? p.mapa);
    if (!map) return false;
    // Guarda onde voltar (um passo antes da porta, virado para o lado oposto).
    session.returnPoint = { map: this.mapId, x: Math.round(this.lastSafe.x), y: Math.round(this.lastSafe.y), facing: OPPOSITE[this.player.facing] };
    this.changeMap(map, str(p.entry ?? p.entrada), facing);
    return true;
  }

  private onSpotted(p: Patrol): void {
    this.caught = true;
    p.alerted = true;
    this.player.walk(0, 0);
    p.actor.faceToward(this.player.x, this.player.y);
    audio.sfx('alerta');
    bus.emit('stealth:spotted', { enemy: p.actor.id });
    this.cameras.main.shake(200, 0.006);
    void p.actor.emote('!', 700).then(() => {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.respawn());
    });
  }

  private respawn(): void {
    const cp = session.checkpoint ?? this.currentPosition();
    this.scene.restart({ map: cp.map, at: { x: cp.x, y: cp.y }, facing: cp.facing, respawn: true } satisfies WorldData);
  }

  // ---------------------------------------------------------------- estado

  currentPosition() {
    return { map: this.mapId, x: Math.round(this.player.x), y: Math.round(this.player.y), facing: this.player.facing };
  }

  private setCheckpointAt(x: number, y: number): void {
    session.checkpoint = { map: this.mapId, x: Math.round(x), y: Math.round(y), facing: this.player.facing };
    bus.emit('checkpoint:set', { map: this.mapId, x, y });
  }

  setCheckpoint(at?: Target): void {
    const pos = at !== undefined ? this.resolveTarget(at) : null;
    this.setCheckpointAt(pos?.x ?? this.player.x, pos?.y ?? this.player.y);
  }

  autosave(force: boolean): void {
    if (!force && director.active) return;
    session.position = this.currentPosition();
    session.save('auto');
  }

  changeMap(map: string, at?: Target | { x: number; y: number }, facing?: Direction): void {
    if (this.transitioning) return;
    if (!maps.has(map)) {
      console.error(`[mundo] mapa "${map}" não existe`);
      return;
    }
    this.transitioning = true;
    this.player.walk(0, 0);
    const go = () => this.scene.restart({ map, at, facing } satisfies WorldData);
    if (director.active) {
      go();
    } else {
      this.cameras.main.fadeOut(250, 0, 0, 0);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, go);
    }
  }

  leaveToScene(key: string): void {
    this.scene.stop(SCENES.dialogo);
    this.scene.start(key);
  }

  private openMenu(): void {
    input.clearPresses();
    this.scene.pause();
    this.scene.launch(SCENES.menu);
  }

  /** Chamado pelo diretor quando um roteiro termina neste mapa. */
  onCutsceneEnd(): void {
    if (!this.sys.isActive() || !this.player) return;
    // Não dispara de novo gatilhos em que o jogador já está.
    const x = this.player.x;
    const y = this.player.y - 3;
    for (const z of [...this.triggers, ...this.exits, ...this.checkpoints]) z.inside = contains(z.rect, x, y);
    session.position = this.currentPosition();
    this.exploreMs = 0;
    this.cameras.main.startFollow(this.player.sprite, true, 0.15, 0.15);
  }

  // ---------------------------------------------------------------- cutscene API

  private actorOrWarn(id: string): Actor | undefined {
    const a = this.actors.get(id) ?? (id === 'player' || id === 'jogador' ? this.player : undefined);
    if (!a) console.warn(`[cutscene] ator "${id}" não existe em ${this.mapId}`);
    return a;
  }

  async cutMove(id: string, to: Target, speed?: number, facing?: Direction): Promise<void> {
    const a = this.actorOrWarn(id);
    const p = this.resolveTarget(to);
    if (!a || !p) return;
    await a.moveTo(p.x, p.y, speed ?? NPC_SPEED);
    if (facing) a.face(facing);
  }

  cutFace(id: string, dir?: Direction, toward?: string): void {
    const a = this.actorOrWarn(id);
    if (!a) return;
    if (dir) a.face(dir);
    else if (toward) {
      const p = this.resolveTarget(toward);
      if (p) a.faceToward(p.x, p.y);
    }
  }

  cutEmote(id: string, emote: string, ms: number): Promise<void> {
    const a = this.actorOrWarn(id);
    return a ? a.emote(emote, ms) : Promise.resolve();
  }

  cutFade(to: string, ms: number): Promise<void> {
    const color = to === 'white' ? 0xffffff : to.startsWith('#') ? parseInt(to.slice(1), 16) : 0x000000;
    const alpha = to === 'clear' ? 0 : 1;
    if (to !== 'clear') this.fadeRect.setFillStyle(color, this.fadeRect.fillAlpha);
    director.fadeState = { color: to === 'clear' ? director.fadeState.color : color, alpha };
    return new Promise((resolve) => {
      this.tweens.add({ targets: this.fadeRect, fillAlpha: alpha, duration: Math.max(1, ms), onComplete: () => resolve() });
    });
  }

  cutCamera(to: Target | undefined, follow: string | undefined, zoom: number | undefined, ms: number): Promise<void> {
    const cam = this.cameras.main;
    const waits: Promise<void>[] = [];
    if (zoom !== undefined) {
      cam.zoomTo(zoom, ms);
      waits.push(new Promise((r) => this.time.delayedCall(ms, r)));
    }
    if (follow) {
      const a = this.actorOrWarn(follow);
      if (a) {
        cam.pan(a.x, a.y - 8, ms, 'Sine.easeInOut');
        waits.push(
          new Promise((r) =>
            this.time.delayedCall(ms, () => {
              cam.startFollow(a.sprite, true, 0.15, 0.15);
              r();
            }),
          ),
        );
      }
    } else if (to !== undefined) {
      const p = this.resolveTarget(to);
      if (p) {
        cam.stopFollow();
        cam.pan(p.x, p.y - 8, ms, 'Sine.easeInOut');
        waits.push(new Promise((r) => this.time.delayedCall(ms, r)));
      }
    }
    return Promise.all(waits).then(() => undefined);
  }

  cutAnim(id: string, anim: string): void {
    const a = this.actors.get(id) ?? (id === 'player' || id === 'jogador' ? this.player : undefined);
    if (!a) return;
    // Pose da arte: <sprite>:<anim>, <id do ator>:<anim> ou um sprite equivalente (caligosuin ↔ cali_soldado).
    const candidates = [a.textureKey, a.id, ...(SPRITE_ALIASES[a.textureKey] ?? [])];
    const key = candidates.map((c) => `${c}:${anim}`).find((k) => this.anims.exists(k));
    if (key) a.playPose(key);
    else if (anim === 'normal' || anim === 'parado') a.face(a.facing);
    // Sem animação desenhada: ignora (nenhuma cena depende disso).
  }

  cutSpawn(id: string, at: Target, sprite?: string, facing?: Direction): void {
    const p = this.resolveTarget(at);
    if (!p) return;
    this.actors.get(id)?.destroy();
    const a = new Actor(this, id, sprite ?? characterSprite(id) ?? id, p.x, p.y, facing ?? 'down');
    a.body.setImmovable(true);
    this.actors.set(id, a);
  }

  cutDespawn(id: string): void {
    const a = this.actors.get(id);
    if (!a || a === this.player) return;
    a.destroy();
    this.actors.delete(id);
    this.npcs = this.npcs.filter((n) => n.actor !== a);
    this.patrols = this.patrols.filter((p) => {
      if (p.actor !== a) return true;
      p.destroy();
      return false;
    });
  }

  /** Para testes/depuração: estado resumido. */
  debugState() {
    return {
      dark: this.dark ? Math.round(this.dark.radius) : null,
      animatedTiles: this.animTiles.map((a) => ({ frame: a.current, count: a.tiles.length })),
      map: this.mapId,
      player: this.player ? this.currentPosition() : null,
      hidden: this.hidden,
      caught: this.caught,
      cutscene: director.active,
      actors: [...this.actors.keys()],
      enemies: this.patrols.map((p) => ({ id: p.actor.id, x: Math.round(p.actor.x), y: Math.round(p.actor.y), facing: p.actor.facing })),
    };
  }
}

