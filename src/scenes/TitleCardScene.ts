import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, SCENES } from '../config/constants';
import { input } from '../core/input';
import { makeText } from '../ui/text';

export interface TitleCardData {
  text: string;
  subtitle?: string;
  /** Tempo mínimo antes de aceitar A/toque. */
  ms: number;
  done: () => void;
}

/** Cartão de título (passo `title`): tela escura com texto grande; A/toque continua. */
export class TitleCardScene extends Phaser.Scene {
  private data0!: TitleCardData;
  private readyAt = 0;
  private closing = false;

  constructor() {
    super(SCENES.titulo_card);
  }

  create(data: TitleCardData): void {
    this.data0 = data;
    this.closing = false;
    input.clearPresses();
    const bg = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x0b0a12, 1).setOrigin(0).setAlpha(0);
    const t = makeText(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 14, data.text, 56, COLORS.accent).setOrigin(0.5).setAlpha(0);
    const objs: Phaser.GameObjects.GameObject[] = [bg, t];
    if (data.subtitle) {
      objs.push(makeText(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30, data.subtitle, 24, COLORS.text).setOrigin(0.5).setAlpha(0));
    }
    this.tweens.add({ targets: objs, alpha: 1, duration: 900 });
    this.readyAt = this.time.now + Math.max(900, data.ms);
  }

  override update(time: number): void {
    if (this.closing || time < this.readyAt) {
      input.clearPresses();
      return;
    }
    if (input.consume('A') || input.consumeTap() || input.consume('B')) {
      this.closing = true;
      this.tweens.add({
        targets: this.children.list,
        alpha: 0,
        duration: 500,
        onComplete: () => {
          this.scene.stop();
          this.data0.done();
        },
      });
    }
  }
}
