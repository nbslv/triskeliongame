import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, SCENES } from '../config/constants';
import { audio } from '../core/audio';
import { input } from '../core/input';
import { RESUME_SLOT, saves } from '../core/save';
import { formatDate, session } from '../core/session';
import { gameConfig } from '../content';
import { director } from '../systems/dialogue/director';
import { MenuList } from '../ui/MenuList';
import { makeText } from '../ui/text';
import type { WorldData } from './WorldScene';
import { mapDisplayName, startFromSave, type SlotsData } from './SlotsScene';

export class TitleScene extends Phaser.Scene {
  private menu!: MenuList;

  constructor() {
    super(SCENES.titulo);
  }

  create(): void {
    director.abort();
    this.scene.stop(SCENES.dialogo);
    input.setJoystickEnabled(false);
    input.clearPresses();
    this.cameras.main.fadeIn(300);

    // Fundo provisório: céu estrelado e um triskelion desenhado.
    const g = this.add.graphics();
    g.fillGradientStyle(0x0b0a12, 0x0b0a12, 0x2a1f3d, 0x2a1f3d, 1).fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    for (let i = 0; i < 80; i++) {
      g.fillStyle(0xf4ecd8, Math.random() * 0.8 + 0.2).fillRect(Math.random() * GAME_WIDTH, Math.random() * GAME_HEIGHT * 0.7, 1, 1);
    }
    const tri = this.add.graphics({ x: GAME_WIDTH / 2, y: 92 });
    tri.lineStyle(3, COLORS.accentNum, 1);
    for (let k = 0; k < 3; k++) {
      const a0 = (k * Math.PI * 2) / 3;
      tri.beginPath();
      for (let t = 0; t <= 1.0001; t += 0.05) {
        const r = 4 + 20 * t;
        const a = a0 + t * Math.PI * 1.6;
        const px = Math.cos(a) * r;
        const py = Math.sin(a) * r;
        if (t === 0) tri.moveTo(px, py);
        else tri.lineTo(px, py);
      }
      tri.strokePath();
    }
    this.tweens.add({ targets: tri, angle: 360, duration: 24000, repeat: -1 });

    makeText(this, GAME_WIDTH / 2, 148, 'TRISKELION', 56, COLORS.accent).setOrigin(0.5);
    makeText(this, GAME_WIDTH - 8, GAME_HEIGHT - 6, `v${__GAME_VERSION__}`, 14, COLORS.textDim).setOrigin(1, 1);

    session.active = false;
    const latest = saves.latest();
    const hasSave = latest !== null;
    const resume = latest?.slot === RESUME_SLOT ? latest.data : null;
    const items = [
      { label: 'Novo jogo', action: () => this.newGame() },
      { label: 'Continuar', enabled: hasSave, action: () => this.openSlots() },
      { label: 'Opções', action: () => this.openOptions() },
      { label: 'Backup do save', action: () => this.openOverlay(SCENES.backup) },
    ];
    if (resume) {
      items.unshift({ label: 'Retomar de onde parou', action: () => startFromSave(this, resume) });
      makeText(this, GAME_WIDTH / 2, 188, `${mapDisplayName(resume.position.map)} · ${formatDate(resume.savedAt)}`, 16, COLORS.textDim).setOrigin(0.5);
    }
    this.menu = new MenuList(this, GAME_WIDTH / 2 - 80, resume ? 206 : 200, items, { size: 22, spacing: 27 });
    if (resume) this.menu.index = 0;
    else if (hasSave) this.menu.index = 1;
    this.menu.update(0);
    audio.playMusic('titulo', 1200);
    this.events.on(Phaser.Scenes.Events.RESUME, () => {
      input.setJoystickEnabled(false);
      input.clearPresses();
      this.menu.active = true;
    });
  }

  private newGame(): void {
    session.reset();
    this.menu.active = false;
    this.cameras.main.fadeOut(400);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(SCENES.mundo, {
        map: gameConfig.startMap,
        at: gameConfig.startMarker,
        dialogue: gameConfig.startDialogue,
      } satisfies WorldData);
    });
  }

  private openSlots(): void {
    this.menu.active = false;
    this.scene.pause();
    this.scene.launch(SCENES.espacos, { mode: 'load', parent: SCENES.titulo } satisfies SlotsData);
  }

  private openOverlay(key: string): void {
    this.menu.active = false;
    this.scene.pause();
    this.scene.launch(key, { parent: SCENES.titulo });
  }

  private openOptions(): void {
    this.menu.active = false;
    this.scene.pause();
    this.scene.launch(SCENES.opcoes, { parent: SCENES.titulo });
  }

  override update(time: number): void {
    this.menu.update(time);
  }
}
