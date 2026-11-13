import '@fontsource/vt323/latin.css';
import '@fontsource/vt323/latin-ext.css';
import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from './config/constants';
import { audio } from './core/audio';
import { director } from './systems/dialogue/director';
import { BackupScene } from './scenes/BackupScene';
import { BootScene } from './scenes/BootScene';
import { ControlsScene } from './scenes/ControlsScene';
import { DialogueScene } from './scenes/DialogueScene';
import { OptionsScene } from './scenes/OptionsScene';
import { PasswordScene } from './scenes/PasswordScene';
import { PauseMenuScene } from './scenes/PauseMenuScene';
import { PreloadScene } from './scenes/PreloadScene';
import { SlotsScene } from './scenes/SlotsScene';
import { TitleScene } from './scenes/TitleScene';
import { WorldScene } from './scenes/WorldScene';
import { TestActivityScene } from './scenes/TestActivityScene';
import { TitleCardScene } from './scenes/TitleCardScene';
import { registerAllActivities } from './systems/activity';

registerAllActivities();

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#0b0a12',
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  input: {
    activePointers: 4,
  },
  physics: {
    default: 'arcade',
    arcade: { debug: false },
  },
  // Ordem = ordem de desenho inicial; Controles se mantém no topo sozinha.
  scene: [
    BootScene,
    PreloadScene,
    PasswordScene,
    TitleScene,
    WorldScene,
    DialogueScene,
    PauseMenuScene,
    SlotsScene,
    OptionsScene,
    BackupScene,
    TestActivityScene,
    TitleCardScene,
    ControlsScene,
  ],
});

// Acesso para depuração e testes automatizados (Playwright).
(window as unknown as { __TRISKELION__: Phaser.Game }).__TRISKELION__ = game;
(window as unknown as { __TRISKELION_AUDIO__: typeof audio }).__TRISKELION_AUDIO__ = audio;
(window as unknown as { __TRISKELION_DIRECTOR__: typeof director }).__TRISKELION_DIRECTOR__ = director;
