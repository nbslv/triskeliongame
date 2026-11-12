import Phaser from 'phaser';
import { COLORS } from '../config/constants';
import { audio } from '../core/audio';
import { input } from '../core/input';
import { makeText } from './text';

export interface MenuItem {
  label: string;
  enabled?: boolean;
  action: () => void;
  /** Opcional: chamado com -1/+1 quando o jogador aperta esquerda/direita (ex.: volume). */
  adjust?: (delta: number) => void;
}

/**
 * Lista vertical navegável por teclado/joystick (cima/baixo), A confirma, B cancela,
 * e também por toque direto no item.
 */
export class MenuList {
  readonly texts: Phaser.GameObjects.Text[] = [];
  index = 0;
  private cursor: Phaser.GameObjects.Text;
  private lastAxis = { x: 0, y: 0 };
  private repeatAt = 0;
  active = true;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    private items: MenuItem[],
    private readonly opts: { size?: number; spacing?: number; onCancel?: () => void; depth?: number } = {},
  ) {
    const size = opts.size ?? 20;
    const spacing = opts.spacing ?? size + 6;
    this.cursor = makeText(scene, x - 14, y, '▶', size, COLORS.accent).setDepth(opts.depth ?? 0);
    items.forEach((item, i) => {
      const t = makeText(scene, x, y + i * spacing, item.label, size, item.enabled === false ? COLORS.textDim : COLORS.text)
        .setDepth(opts.depth ?? 0)
        .setPadding(4, 2, 24, 2)
        .setInteractive({ useHandCursor: true });
      t.on('pointerdown', () => {
        if (!this.active || item.enabled === false) return;
        this.index = i;
        this.refresh();
      });
      t.on('pointerup', () => {
        if (!this.active || item.enabled === false || this.index !== i) return;
        this.choose();
      });
      this.texts.push(t);
    });
    this.index = Math.max(0, items.findIndex((it) => it.enabled !== false));
    this.refresh();
  }

  setLabel(i: number, label: string): void {
    this.items[i]!.label = label;
    this.texts[i]?.setText(label);
  }

  private refresh(): void {
    this.texts.forEach((t, i) => {
      const it = this.items[i]!;
      t.setColor(it.enabled === false ? COLORS.textDim : i === this.index ? COLORS.accent : COLORS.text);
    });
    const sel = this.texts[this.index];
    if (sel) this.cursor.setPosition(sel.x - 14, sel.y + 2);
  }

  private move(delta: number): void {
    const n = this.items.length;
    for (let k = 1; k <= n; k++) {
      const j = (this.index + delta * k + n * 4) % n;
      if (this.items[j]!.enabled !== false) {
        this.index = j;
        break;
      }
    }
    audio.sfx('cursor', 0.5);
    this.refresh();
  }

  private choose(): void {
    const it = this.items[this.index];
    if (!it || it.enabled === false) return;
    audio.sfx('confirmar');
    it.action();
  }

  update(time: number): void {
    if (!this.active) return;
    const a = input.axis();
    const ay = Math.abs(a.y) > 0.5 ? Math.sign(a.y) : 0;
    const ax = Math.abs(a.x) > 0.5 ? Math.sign(a.x) : 0;
    if (ay !== this.lastAxis.y || ax !== this.lastAxis.x) {
      this.repeatAt = time + 350;
      if (ay) this.move(ay);
      else if (ax) this.items[this.index]?.adjust?.(ax);
    } else if ((ay || ax) && time >= this.repeatAt) {
      this.repeatAt = time + 110;
      if (ay) this.move(ay);
      else if (ax) this.items[this.index]?.adjust?.(ax);
    }
    this.lastAxis = { x: ax, y: ay };
    if (input.consume('A')) this.choose();
    else if (input.consume('B') && this.opts.onCancel) {
      audio.sfx('cancelar');
      this.opts.onCancel();
    }
  }

  destroy(): void {
    this.texts.forEach((t) => t.destroy());
    this.cursor.destroy();
  }
}
