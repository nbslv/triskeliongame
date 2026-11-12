import Phaser from 'phaser';
import { SCENES } from '../config/constants';
import { audio } from '../core/audio';
import { input } from '../core/input';
import { installResumeHandlers } from '../core/resume';
import { director } from '../systems/dialogue/director';

/** Inicializa serviços e espera a fonte carregar. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENES.boot);
  }

  create(): void {
    input.attach(this.game.canvas);
    audio.init(this.game);
    director.init(this.game);
    installResumeHandlers();
    const fontReady = document.fonts?.load ? document.fonts.load('20px VT323').catch(() => undefined) : Promise.resolve();
    const timeout = new Promise((r) => setTimeout(r, 2500));
    void Promise.race([fontReady, timeout]).then(() => this.scene.start(SCENES.preload));
  }
}
