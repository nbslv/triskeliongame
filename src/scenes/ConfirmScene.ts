import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, SCENES } from '../config/constants';
import { input } from '../core/input';
import { MenuList } from '../ui/MenuList';
import { drawPanel, makeText } from '../ui/text';

export interface ConfirmData {
  /** Cena que abriu (fica pausada e é retomada ao responder "não"). */
  parent: string;
  text: string;
  yes: string;
  no: string;
  onYes: () => void;
}

/** Caixa de confirmação simples (Sim / Não). B ou tocar fora = Não. */
export class ConfirmScene extends Phaser.Scene {
  private menu!: MenuList;
  private cfg!: ConfirmData;

  constructor() {
    super(SCENES.confirmar);
  }

  create(data: ConfirmData): void {
    this.cfg = data;
    input.setJoystickEnabled(false);
    input.clearPresses();
    const w = 420;
    const h = 150;
    const x = (GAME_WIDTH - w) / 2;
    const y = (GAME_HEIGHT - h) / 2;
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6).setOrigin(0);
    drawPanel(this.add.graphics(), x, y, w, h);
    makeText(this, GAME_WIDTH / 2, y + 34, data.text, 20, COLORS.text, {
      align: 'center',
      wordWrap: { width: w - 40, useAdvancedWrap: true },
    }).setOrigin(0.5);
    this.menu = new MenuList(
      this,
      x + 150,
      y + 78,
      [
        { label: data.yes, action: () => this.answer(true) },
        { label: data.no, action: () => this.answer(false) },
      ],
      { size: 22, spacing: 28, onCancel: () => this.answer(false) },
    );
    this.menu.index = 1; // padrão seguro: "não"
    this.menu.update(0);
  }

  private answer(yes: boolean): void {
    input.clearPresses();
    this.scene.stop();
    if (yes) this.cfg.onYes();
    else this.scene.resume(this.cfg.parent);
  }

  override update(time: number): void {
    this.menu.update(time);
  }
}
