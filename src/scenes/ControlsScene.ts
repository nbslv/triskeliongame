import Phaser from 'phaser';
import { SCENES } from '../config/constants';
import { BUTTON_LAYOUT, JOYSTICK_RADIUS, input, type Button } from '../core/input';
import { makeText } from '../ui/text';

const LABELS: Record<Button, string> = { A: 'A', B: 'B', MENU: '☰' };

/**
 * Desenha os controles de toque (sempre por cima das outras cenas).
 * A lógica de toque está em src/core/input.ts; aqui é só visual.
 * Some no desktop sem tela de toque.
 */
export class ControlsScene extends Phaser.Scene {
  private g!: Phaser.GameObjects.Graphics;
  private labels: Phaser.GameObjects.Text[] = [];

  constructor() {
    super({ key: SCENES.controles, active: false });
  }

  create(): void {
    this.g = this.add.graphics();
    this.labels = BUTTON_LAYOUT.map((b) =>
      makeText(this, b.x, b.y, LABELS[b.id], b.id === 'MENU' ? 18 : 22).setOrigin(0.5).setAlpha(0.85),
    );
  }

  override update(): void {
    // Mantém esta cena no topo da pilha (cenas lançadas depois ficariam por cima).
    const mgr = this.scene.manager;
    if (mgr.getIndex(this.scene.key) !== mgr.getScenes(false).length - 1) this.scene.bringToTop();

    const g = this.g;
    g.clear();
    const show = input.touchMode;
    this.labels.forEach((l) => l.setVisible(show));
    if (!show) return;

    for (const b of BUTTON_LAYOUT) {
      const down = input.isDown(b.id);
      g.fillStyle(0x0b0a12, down ? 0.65 : 0.35);
      g.fillCircle(b.x, b.y, b.r);
      g.lineStyle(2, down ? 0xe8b04a : 0xf4ecd8, down ? 0.95 : 0.55);
      g.strokeCircle(b.x, b.y, b.r);
    }
    const j = input.joystick;
    if (input.joystickEnabled && j.active) {
      g.fillStyle(0x0b0a12, 0.3);
      g.fillCircle(j.baseX, j.baseY, JOYSTICK_RADIUS);
      g.lineStyle(2, 0xf4ecd8, 0.5);
      g.strokeCircle(j.baseX, j.baseY, JOYSTICK_RADIUS);
      g.fillStyle(0xf4ecd8, 0.6);
      g.fillCircle(j.knobX, j.knobY, 13);
    } else if (input.joystickEnabled) {
      // Dica discreta de onde tocar
      g.lineStyle(1, 0xf4ecd8, 0.18);
      g.strokeCircle(78, 280, JOYSTICK_RADIUS);
      g.fillStyle(0xf4ecd8, 0.12);
      g.fillCircle(78, 280, 12);
    }
  }
}
