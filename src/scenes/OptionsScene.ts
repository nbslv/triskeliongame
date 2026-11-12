import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, SCENES } from '../config/constants';
import { audio } from '../core/audio';
import { input } from '../core/input';
import { settings, updateSettings } from '../core/settings';
import { MenuList } from '../ui/MenuList';
import { drawPanel, makeText } from '../ui/text';

const SPEEDS: [string, number][] = [
  ['lenta', 25],
  ['normal', 45],
  ['rápida', 90],
  ['instantânea', 10000],
];

export class OptionsScene extends Phaser.Scene {
  private menu!: MenuList;
  private parentKey = '';

  constructor() {
    super(SCENES.opcoes);
  }

  create(data: { parent: string }): void {
    this.parentKey = data.parent;
    input.clearPresses();
    const w = 380;
    const h = 220;
    const x = (GAME_WIDTH - w) / 2;
    const y = (GAME_HEIGHT - h) / 2;
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.5).setOrigin(0);
    drawPanel(this.add.graphics(), x, y, w, h);
    makeText(this, GAME_WIDTH / 2, y + 22, 'Opções', 24, COLORS.accent).setOrigin(0.5);
    makeText(this, GAME_WIDTH / 2, y + h - 18, '◀ ▶ ajusta   A confirma   B volta', 16, COLORS.textDim).setOrigin(0.5);

    const pct = (v: number) => `${Math.round(v * 100)}%`;
    const speedName = () => (SPEEDS.find(([, v]) => v === settings.textSpeed) ?? SPEEDS[1]!)[0];
    const labels = {
      music: () => `Música: ◀ ${pct(settings.musicVolume)} ▶`,
      sfx: () => `Efeitos: ◀ ${pct(settings.sfxVolume)} ▶`,
      text: () => `Texto: ◀ ${speedName()} ▶`,
      fs: () => `Tela cheia ao tocar: ${settings.fullscreenOnTouch ? 'sim' : 'não'}`,
    };
    const clamp = (v: number) => Math.round(Math.min(1, Math.max(0, v)) * 10) / 10;
    const adjMusic = (d: number) => {
      updateSettings({ musicVolume: clamp(settings.musicVolume + d * 0.1) });
      this.menu.setLabel(0, labels.music());
    };
    const adjSfx = (d: number) => {
      updateSettings({ sfxVolume: clamp(settings.sfxVolume + d * 0.1) });
      this.menu.setLabel(1, labels.sfx());
      audio.sfx('confirmar');
    };
    const adjText = (d: number) => {
      const i = Math.max(0, SPEEDS.findIndex(([, v]) => v === settings.textSpeed));
      const j = (i + d + SPEEDS.length) % SPEEDS.length;
      updateSettings({ textSpeed: SPEEDS[j]![1] });
      this.menu.setLabel(2, labels.text());
    };
    this.menu = new MenuList(
      this,
      x + 44,
      y + 50,
      [
        { label: labels.music(), action: () => adjMusic(settings.musicVolume >= 1 ? -10 : 1), adjust: adjMusic },
        { label: labels.sfx(), action: () => adjSfx(settings.sfxVolume >= 1 ? -10 : 1), adjust: adjSfx },
        { label: labels.text(), action: () => adjText(1), adjust: adjText },
        {
          label: labels.fs(),
          action: () => {
            updateSettings({ fullscreenOnTouch: !settings.fullscreenOnTouch });
            this.menu.setLabel(3, labels.fs());
          },
        },
        { label: 'Voltar', action: () => this.close() },
      ],
      { size: 20, spacing: 26, onCancel: () => this.close() },
    );
  }

  private close(): void {
    input.clearPresses();
    this.scene.stop();
    this.scene.resume(this.parentKey);
  }

  override update(time: number): void {
    this.menu.update(time);
  }
}
