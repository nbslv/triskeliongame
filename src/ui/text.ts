import Phaser from 'phaser';
import { COLORS, FONT_FAMILY } from '../config/constants';

export function makeText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  size = 16,
  color: string = COLORS.text,
  extra: Phaser.Types.GameObjects.Text.TextStyle = {},
): Phaser.GameObjects.Text {
  return scene.add.text(x, y, text, {
    fontFamily: FONT_FAMILY,
    fontSize: `${size}px`,
    color,
    ...extra,
  });
}

/** Painel com borda dupla (estilo caixa de RPG). */
export function drawPanel(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  alpha = 0.94,
  colors: { fill?: number; border?: number; inner?: number } = {},
): void {
  g.fillStyle(colors.fill ?? 0x0b0a12, alpha);
  g.fillRoundedRect(x, y, w, h, 4);
  g.lineStyle(2, colors.border ?? COLORS.panelBorder, 1);
  g.strokeRoundedRect(x + 1, y + 1, w - 2, h - 2, 4);
  g.lineStyle(1, colors.inner ?? COLORS.accentNum, 0.6);
  g.strokeRoundedRect(x + 4, y + 4, w - 8, h - 8, 2);
}
