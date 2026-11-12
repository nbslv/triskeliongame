import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, SCENES } from '../config/constants';
import { passwordRequired } from '../core/password';
import { assetManifest, dialogueErrors } from '../content';
import { createPoseAnimations, ensureCharacterTexture, ensurePlaceholderTileset } from '../ui/placeholders';
import { makeText } from '../ui/text';

/** Carrega os arquivos de assets/ (se houver) com barra de progresso e gera placeholders. */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super(SCENES.preload);
  }

  preload(): void {
    const w = 320;
    const x = (GAME_WIDTH - w) / 2;
    const y = GAME_HEIGHT / 2;
    makeText(this, GAME_WIDTH / 2, y - 28, 'Carregando...', 20).setOrigin(0.5);
    const box = this.add.graphics();
    box.lineStyle(2, COLORS.panelBorder).strokeRect(x - 2, y - 2, w + 4, 16);
    const bar = this.add.graphics();
    this.load.on(Phaser.Loader.Events.PROGRESS, (v: number) => {
      bar.clear().fillStyle(COLORS.accentNum).fillRect(x, y, w * v, 12);
    });
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (f: Phaser.Loader.File) => {
      console.warn('[preload] falhou:', f.key, f.url);
    });

    const m = assetManifest;
    m.images.forEach((a) => this.load.image(a.key, a.url));
    m.portraits.forEach((a) => this.load.image(a.key, a.url));
    m.tilesets.forEach((a) => this.load.image(a.key, a.url));
    m.sprites.forEach((a) => this.load.spritesheet(a.key, a.url, { frameWidth: a.frameWidth, frameHeight: a.frameHeight }));
    m.music.forEach((a) => this.load.audio(a.key, a.urls));
    m.sfx.forEach((a) => this.load.audio(a.key, a.urls));
  }

  create(): void {
    ensurePlaceholderTileset(this);
    createPoseAnimations(this);
    ['icaro', 'pai', 'caligosuin', 'aldeao'].forEach((k) => ensureCharacterTexture(this, k));
    if (dialogueErrors.length) {
      console.error(`[preload] ${dialogueErrors.length} roteiro(s) com erro — veja acima. Rode "npm test".`);
    }
    this.scene.launch(SCENES.controles);
    this.scene.start(passwordRequired() ? SCENES.senha : SCENES.titulo);
  }
}
