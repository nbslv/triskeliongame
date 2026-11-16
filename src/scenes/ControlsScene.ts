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
  /** Diagnóstico de toque (`?toque` na URL): mostra onde o último toque caiu e o que ele acertou. */
  private diag: Phaser.GameObjects.Text | null = null;
  private presses: Record<string, number> = { A: 0, B: 0, MENU: 0 };

  constructor() {
    super({ key: SCENES.controles, active: false });
  }

  create(): void {
    this.g = this.add.graphics();
    this.labels = BUTTON_LAYOUT.map((b) =>
      makeText(this, b.x, b.y, LABELS[b.id], b.id === 'MENU' ? 18 : 22).setOrigin(0.5).setAlpha(0.85),
    );
    if (/[?&]toque\b/.test(location.search)) {
      this.diag = makeText(this, 6, 4, '', 14, '#8fd6a8').setDepth(10);
      let last = -1;
      this.events.on(Phaser.Scenes.Events.UPDATE, () => {
        const d = input.lastDown;
        if (d && d.t !== last) {
          last = d.t;
          if (d.hit in this.presses) this.presses[d.hit]!++;
        }
      });
    }
  }

  override update(): void {
    // Mantém esta cena no topo da pilha (cenas lançadas depois ficariam por cima).
    const mgr = this.scene.manager;
    if (mgr.getIndex(this.scene.key) !== mgr.getScenes(false).length - 1) this.scene.bringToTop();

    const g = this.g;
    g.clear();
    const show = input.touchMode;
    this.labels.forEach((l) => l.setVisible(show));
    if (this.diag) {
      const d = input.lastDown;
      this.diag.setText(
        `toque: ${input.touchMode ? 'sim' : 'não'} · último: ${d ? `${Math.round(d.x)},${Math.round(d.y)} ${d.type} → ${d.hit}` : '-'}` +
          ` · A ${this.presses.A} B ${this.presses.B} ☰ ${this.presses.MENU}`,
      );
      if (d) {
        g.lineStyle(1, 0x8fd6a8, 1);
        g.strokeCircle(d.x, d.y, 6);
      }
    }
    if (!show) return;

    for (const b of BUTTON_LAYOUT) {
      const down = input.isDown(b.id);
      g.fillStyle(0x0b0a12, down ? 0.65 : 0.35);
      g.fillCircle(b.x, b.y, b.r);
      g.lineStyle(2, down ? 0xe8b04a : 0xf4ecd8, down ? 0.95 : 0.55);
      g.strokeCircle(b.x, b.y, b.r);
    }
    const j = input.joystick;
    if (j.active) {
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
