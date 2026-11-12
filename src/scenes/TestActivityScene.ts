import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from '../config/constants';
import { input } from '../core/input';
import type { ActivityLaunch } from '../systems/activity/registry';
import { MenuList } from '../ui/MenuList';
import { drawPanel, makeText } from '../ui/text';

/**
 * Atividade de TESTE do motor (exemplo de como fazer lojas/treinos).
 * Não é conteúdo do jogo.
 */
export class TestActivityScene extends Phaser.Scene {
  private menu!: MenuList;

  constructor() {
    super('AtividadeTeste');
  }

  create(data: ActivityLaunch): void {
    input.setJoystickEnabled(false);
    input.clearPresses();
    const w = 360;
    const h = 170;
    const x = (GAME_WIDTH - w) / 2;
    const y = (GAME_HEIGHT - h) / 2;
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.5).setOrigin(0);
    drawPanel(this.add.graphics(), x, y, w, h);
    makeText(this, GAME_WIDTH / 2, y + 20, `[teste] Atividade "${data.id}"`, 20, COLORS.accent).setOrigin(0.5);
    makeText(this, GAME_WIDTH / 2, y + 44, `Moedas: ${data.state.coins} · Magia: ${data.state.attributes.magia ?? 0}`, 18).setOrigin(0.5);
    const reward = Number(data.params.moedas ?? 5);
    this.menu = new MenuList(
      this,
      x + 40,
      y + 74,
      [
        {
          label: `Concluir (+1 magia, +${reward} moedas)`,
          action: () => data.finish({ completed: true, coins: reward, attributes: { magia: 1 }, items: { pena_teste: 1 }, score: 10 }),
        },
        { label: 'Desistir', action: () => data.finish({ completed: false }) },
      ],
      { size: 20, spacing: 26, onCancel: () => data.finish({ completed: false }) },
    );
  }

  override update(time: number): void {
    this.menu.update(time);
  }
}
