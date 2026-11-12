import Phaser from 'phaser';
import { DEPTH, type Direction } from '../../config/constants';
import { ensureCharacterAnims, ensureCharacterTexture } from '../../ui/placeholders';
import { makeText } from '../../ui/text';

/**
 * Personagem no mapa (jogador, NPC, inimigo ou ator de cutscene).
 * Origem nos pés (0.5, 1): `x,y` é o ponto no chão. Corpo de física pequeno nos pés.
 */
export class Actor {
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  facing: Direction = 'down';
  private moving = false;
  private moveTween: Phaser.Tweens.Tween | null = null;

  constructor(
    readonly scene: Phaser.Scene,
    readonly id: string,
    readonly textureKey: string,
    x: number,
    y: number,
    facing: Direction = 'down',
  ) {
    ensureCharacterTexture(scene, textureKey);
    ensureCharacterAnims(scene, textureKey);
    this.sprite = scene.physics.add.sprite(x, y, textureKey, 0);
    this.sprite.setOrigin(0.5, 1);
    const fw = this.sprite.width;
    const fh = this.sprite.height;
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setSize(Math.min(10, fw), 6);
    body.setOffset((fw - Math.min(10, fw)) / 2, fh - 7);
    this.sprite.setData('actor', this);
    this.face(facing);
    this.syncDepth();
  }

  get x(): number {
    return this.sprite.x;
  }
  get y(): number {
    return this.sprite.y;
  }
  get body(): Phaser.Physics.Arcade.Body {
    return this.sprite.body as Phaser.Physics.Arcade.Body;
  }

  face(dir: Direction): void {
    this.facing = dir;
    if (!this.moving) this.sprite.anims.play(`${this.textureKey}:idle-${dir}`, true);
  }

  faceToward(x: number, y: number): void {
    const dx = x - this.x;
    const dy = y - this.y;
    if (dx === 0 && dy === 0) return;
    this.face(Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : dy < 0 ? 'up' : 'down');
  }

  /** Movimento controlado por velocidade (jogador / patrulha). */
  walk(vx: number, vy: number): void {
    this.body.setVelocity(vx, vy);
    if (vx === 0 && vy === 0) {
      if (this.moving) {
        this.moving = false;
        this.sprite.anims.play(`${this.textureKey}:idle-${this.facing}`, true);
      }
      return;
    }
    const dir: Direction = Math.abs(vx) > Math.abs(vy) ? (vx < 0 ? 'left' : 'right') : vy < 0 ? 'up' : 'down';
    this.facing = dir;
    this.moving = true;
    this.sprite.anims.play(`${this.textureKey}:walk-${dir}`, true);
    const speed = Math.hypot(vx, vy);
    this.sprite.anims.timeScale = Phaser.Math.Clamp(speed / 70, 0.6, 2);
  }

  /** Movimento roteirizado até (x,y) em linha reta, ignorando colisões. */
  moveTo(x: number, y: number, speed = 60): Promise<void> {
    this.stopMove();
    this.body.setVelocity(0, 0);
    const dist = Phaser.Math.Distance.Between(this.x, this.y, x, y);
    if (dist < 0.5) return Promise.resolve();
    const dx = x - this.x;
    const dy = y - this.y;
    this.facing = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : dy < 0 ? 'up' : 'down';
    this.moving = true;
    this.sprite.anims.play(`${this.textureKey}:walk-${this.facing}`, true);
    this.sprite.anims.timeScale = Phaser.Math.Clamp(speed / 70, 0.6, 2);
    return new Promise((resolve) => {
      this.moveTween = this.scene.tweens.add({
        targets: this.sprite,
        x,
        y,
        duration: (dist / speed) * 1000,
        onUpdate: () => this.syncDepth(),
        onComplete: () => {
          this.moveTween = null;
          this.moving = false;
          this.sprite.anims.play(`${this.textureKey}:idle-${this.facing}`, true);
          resolve();
        },
        onStop: () => resolve(),
      });
    });
  }

  stopMove(): void {
    this.moveTween?.stop();
    this.moveTween = null;
  }

  syncDepth(): void {
    this.sprite.setDepth(DEPTH.actorsBase + this.sprite.y);
  }

  /** Balão de emoção acima da cabeça. */
  emote(symbol: string, ms = 900): Promise<void> {
    const s = this.scene;
    const t = makeText(s, 0, 0, symbol, 16, '#1a1420').setOrigin(0.5, 0.5);
    const w = Math.max(14, t.width + 8);
    const g = s.add.graphics();
    g.fillStyle(0xfffbe8, 1);
    g.lineStyle(1, 0x1a1420, 1);
    g.fillRoundedRect(-w / 2, -9, w, 16, 4);
    g.strokeRoundedRect(-w / 2, -9, w, 16, 4);
    g.fillTriangle(-3, 6, 3, 6, 0, 10);
    const c = s.add.container(this.x, this.y - this.sprite.displayHeight - 8, [g, t]).setDepth(DEPTH.emote);
    c.setScale(0.2);
    s.tweens.add({ targets: c, scale: 1, duration: 140, ease: 'Back.easeOut' });
    const follow = () => c.setPosition(this.x, this.y - this.sprite.displayHeight - 8);
    s.events.on(Phaser.Scenes.Events.UPDATE, follow);
    return new Promise((resolve) => {
      s.time.delayedCall(ms, () => {
        s.events.off(Phaser.Scenes.Events.UPDATE, follow);
        c.destroy();
        resolve();
      });
    });
  }

  destroy(): void {
    this.stopMove();
    this.sprite.destroy();
  }
}
