import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, SCENES } from '../config/constants';
import { audio } from '../core/audio';
import { input } from '../core/input';
import { formatPlaytime, session } from '../core/session';
import { MenuList } from '../ui/MenuList';
import { drawPanel, makeText } from '../ui/text';
import type { SlotsData } from './SlotsScene';
import { mapDisplayName } from './SlotsScene';

/** Menu de pausa (MENU durante a exploração). */
export class PauseMenuScene extends Phaser.Scene {
  private menu!: MenuList;

  constructor() {
    super(SCENES.menu);
  }

  create(): void {
    input.setJoystickEnabled(false);
    input.clearPresses();
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.45).setOrigin(0);
    const w = 220;
    const h = 200;
    const x = 24;
    const y = 24;
    drawPanel(this.add.graphics(), x, y, w, h);
    makeText(this, x + w / 2, y + 20, 'Pausa', 24, COLORS.accent).setOrigin(0.5);
    const info = this.add.graphics();
    drawPanel(info, GAME_WIDTH - 244, 24, 220, 64);
    const pos = session.position;
    makeText(this, GAME_WIDTH - 230, 34, pos ? mapDisplayName(pos.map) : '', 18);
    const timeText = makeText(this, GAME_WIDTH - 230, 56, '', 18, COLORS.textDim);
    const tick = () => timeText.setText(`Tempo: ${formatPlaytime(session.playtimeMs)}`);
    tick();

    const open = (key: string, data: object) => {
      this.menu.active = false;
      this.scene.pause();
      this.scene.launch(key, data);
    };
    this.menu = new MenuList(
      this,
      x + 40,
      y + 48,
      [
        { label: 'Continuar', action: () => this.close() },
        { label: 'Salvar', action: () => open(SCENES.espacos, { mode: 'save', parent: SCENES.menu } satisfies SlotsData) },
        { label: 'Carregar', action: () => open(SCENES.espacos, { mode: 'load', parent: SCENES.menu } satisfies SlotsData) },
        { label: 'Opções', action: () => open(SCENES.opcoes, { parent: SCENES.menu }) },
        { label: 'Título', action: () => this.toTitle() },
      ],
      { size: 22, spacing: 28, onCancel: () => this.close() },
    );
    this.events.on(Phaser.Scenes.Events.RESUME, () => {
      input.clearPresses();
      this.menu.active = true;
    });
  }

  private close(): void {
    input.clearPresses();
    input.setJoystickEnabled(true);
    this.scene.stop();
    this.scene.resume(SCENES.mundo);
  }

  private toTitle(): void {
    audio.playMusic(null, 400);
    this.scene.stop(SCENES.mundo);
    this.scene.stop(SCENES.dialogo);
    this.scene.start(SCENES.titulo);
  }

  override update(time: number): void {
    // MENU também fecha
    if (input.consume('MENU')) {
      this.close();
      return;
    }
    this.menu.update(time);
  }
}
