import Phaser from 'phaser';
import { COLORS, DEPTH, type Direction } from '../../config/constants';
import type { Actor } from '../world/Actor';
import { DIR_ANGLE, canSee, castRay, type Vec } from './vision';

export interface PatrolConfig {
  route: Vec[];
  /** "loop" volta ao primeiro ponto; "pingpong" vai e volta. */
  mode: 'loop' | 'pingpong';
  speed: number;
  /** Pausa em cada ponto (ms). */
  waitMs: number;
  /** Alcance da visão (px). */
  range: number;
  /** Abertura total do cone (graus). */
  angleDeg: number;
  /** Sem rota: gira a direção a cada N ms (0 = parado). */
  turnMs: number;
}

const RAYS = 18;

/**
 * Inimigo de furtividade: segue a rota e desenha o cone de visão no chão.
 * O cone é cortado por paredes (tiles com colisão).
 */
export class Patrol {
  private target = 0;
  private dirSign = 1;
  private waitUntil = 0;
  private nextTurn = 0;
  private readonly cone: Phaser.GameObjects.Graphics;
  alerted = false;
  paused = false;

  constructor(
    readonly actor: Actor,
    readonly cfg: PatrolConfig,
    private readonly blocked: (x: number, y: number) => boolean,
  ) {
    this.cone = actor.scene.add.graphics().setDepth(DEPTH.vision);
    if (cfg.route.length > 1) this.target = 1;
  }

  /** Olho do inimigo (um pouco acima dos pés). */
  get eye(): Vec {
    return { x: this.actor.x, y: this.actor.y - 6 };
  }

  get facingAngle(): number {
    return DIR_ANGLE[this.actor.facing] ?? 0;
  }

  update(time: number): void {
    if (this.paused || this.alerted) {
      this.actor.walk(0, 0);
    } else if (this.cfg.route.length > 1) {
      this.followRoute(time);
    } else if (this.cfg.turnMs > 0 && time >= this.nextTurn) {
      this.nextTurn = time + this.cfg.turnMs;
      const order: Direction[] = ['down', 'left', 'up', 'right'];
      this.actor.face(order[(order.indexOf(this.actor.facing) + 1) % 4]!);
    }
    this.actor.syncDepth();
    this.drawCone();
  }

  private followRoute(time: number): void {
    if (time < this.waitUntil) {
      this.actor.walk(0, 0);
      return;
    }
    const goal = this.cfg.route[this.target]!;
    const dx = goal.x - this.actor.x;
    const dy = goal.y - this.actor.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 2) {
      this.actor.sprite.setPosition(goal.x, goal.y);
      this.actor.walk(0, 0);
      this.waitUntil = time + this.cfg.waitMs;
      this.advance();
      // Já olha para o próximo trecho durante a pausa.
      const nxt = this.cfg.route[this.target]!;
      this.actor.faceToward(nxt.x, nxt.y);
      return;
    }
    // Move em eixos (primeiro o maior), para ficar com cara de RPG em grade.
    if (Math.abs(dx) >= Math.abs(dy)) this.actor.walk(Math.sign(dx) * this.cfg.speed, 0);
    else this.actor.walk(0, Math.sign(dy) * this.cfg.speed);
  }

  private advance(): void {
    const n = this.cfg.route.length;
    if (this.cfg.mode === 'loop') {
      this.target = (this.target + 1) % n;
      return;
    }
    if (this.target + this.dirSign >= n || this.target + this.dirSign < 0) this.dirSign *= -1;
    this.target += this.dirSign;
  }

  canSee(p: Vec): boolean {
    const half = Phaser.Math.DegToRad(this.cfg.angleDeg / 2);
    return canSee(this.eye, this.facingAngle, half, this.cfg.range, p, this.blocked);
  }

  private drawCone(): void {
    const g = this.cone;
    g.clear();
    if (this.paused && !this.alerted) return;
    const eye = { x: this.actor.x, y: this.actor.y - 3 };
    const half = Phaser.Math.DegToRad(this.cfg.angleDeg / 2);
    const base = this.facingAngle;
    const pts: Vec[] = [eye];
    for (let i = 0; i <= RAYS; i++) {
      const a = base - half + (2 * half * i) / RAYS;
      const d = castRay(eye, a, this.cfg.range, this.blocked);
      pts.push({ x: eye.x + Math.cos(a) * d, y: eye.y + Math.sin(a) * d });
    }
    const color = this.alerted ? COLORS.visionAlert : COLORS.vision;
    g.fillStyle(color, this.alerted ? 0.4 : 0.22);
    g.fillPoints(pts, true);
    g.lineStyle(1, color, 0.5);
    g.strokePoints(pts, true);
  }

  destroy(): void {
    this.cone.destroy();
  }
}
