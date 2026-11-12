import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, SCENES } from '../config/constants';
import { audio } from '../core/audio';
import { BUTTON_LAYOUT, input } from '../core/input';
import { settings } from '../core/settings';
import { characterName } from '../content';
import type { SayStep } from '../systems/dialogue/types';
import { MenuList } from '../ui/MenuList';
import { ensurePortrait } from '../ui/placeholders';
import { drawPanel, makeText } from '../ui/text';

const TEXT_SIZE = 20;
const BOX = { x: 8, y: GAME_HEIGHT - 108, w: GAME_WIDTH - 16, h: 100 };
/** Com controles de toque, a caixa termina antes dos botões A/B (não fica embaixo deles). */
function layoutBox(): void {
  BOX.w = input.touchMode ? Math.min(GAME_WIDTH - 16, BUTTON_LAYOUT[1]!.x - BUTTON_LAYOUT[1]!.r - 14 - BOX.x) : GAME_WIDTH - 16;
}

type BoxStyle = 'normal' | 'narrador' | 'tutorial';
const STYLE_COLORS: Record<BoxStyle, { fill?: number; border?: number; inner?: number; text: string }> = {
  normal: { text: COLORS.text },
  narrador: { fill: 0x14121e, border: 0x9a93a8, inner: 0x9a93a8, text: '#e6dcf5' },
  tutorial: { fill: 0x10241c, border: 0x8fd6a8, inner: 0x8fd6a8, text: '#e8fff0' },
};

/**
 * Cena sobreposta com a caixa de diálogo: nome do falante, retrato opcional,
 * efeito de digitação; A/toque avança (ou completa o texto), B também.
 */
export class DialogueScene extends Phaser.Scene {
  private root!: Phaser.GameObjects.Container;
  private panel!: Phaser.GameObjects.Graphics;
  private nameBox!: Phaser.GameObjects.Graphics;
  private nameText!: Phaser.GameObjects.Text;
  private body!: Phaser.GameObjects.Text;
  private portrait!: Phaser.GameObjects.Image;
  private arrow!: Phaser.GameObjects.Text;

  private full = '';
  private shown = 0;
  private typing = false;
  private cps = 45;
  private acc = 0;
  private resolveSay: (() => void) | null = null;
  private autoTimer: Phaser.Time.TimerEvent | null = null;
  private hideTimer: Phaser.Time.TimerEvent | null = null;
  private menu: MenuList | null = null;
  private menuObjs: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super(SCENES.dialogo);
  }

  create(): void {
    layoutBox();
    this.panel = this.add.graphics();
    drawPanel(this.panel, BOX.x, BOX.y, BOX.w, BOX.h);
    this.nameBox = this.add.graphics();
    this.nameText = makeText(this, BOX.x + 20, BOX.y - 20, '', 18, COLORS.accent);
    this.portrait = this.add.image(BOX.x + 14, BOX.y + 18, '__DEFAULT').setOrigin(0, 0).setDisplaySize(64, 64);
    this.body = makeText(this, BOX.x + 16, BOX.y + 12, '', TEXT_SIZE, COLORS.text, {
      wordWrap: { width: BOX.w - 40, useAdvancedWrap: true },
      lineSpacing: -2,
    });
    this.arrow = makeText(this, BOX.x + BOX.w - 22, BOX.y + BOX.h - 22, '▼', 16, COLORS.accent);
    this.tweens.add({ targets: this.arrow, y: '+=3', yoyo: true, repeat: -1, duration: 350 });
    this.root = this.add.container(0, 0, [this.panel, this.nameBox, this.nameText, this.portrait, this.body, this.arrow]);
    this.root.setVisible(false);
    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanup());
  }

  private cleanup(): void {
    this.resolveSay?.();
    this.resolveSay = null;
    this.clearMenu();
  }

  /** Esconde a caixa daqui a pouco, a menos que outra fala chegue antes (evita piscar). */
  hideSoon(): void {
    if (!this.sys.isActive() || !this.root?.visible) return;
    this.hideTimer?.remove();
    this.hideTimer = this.time.delayedCall(60, () => this.root.setVisible(false));
  }

  hideNow(): void {
    if (!this.root) return;
    this.hideTimer?.remove();
    this.root.setVisible(false);
    this.clearMenu();
  }

  private setSpeaker(speakerId: string | undefined, nameOverride: string | undefined, portraitKey: string | undefined): BoxStyle {
    const style: BoxStyle =
      speakerId === 'narrador' || speakerId === 'narrator' ? 'narrador' : speakerId === 'tutorial' ? 'tutorial' : 'normal';
    const colors = STYLE_COLORS[style];
    layoutBox();
    this.panel.clear();
    drawPanel(this.panel, BOX.x, BOX.y, BOX.w, BOX.h, 0.94, colors);
    this.arrow.setPosition(BOX.x + BOX.w - 22, BOX.y + BOX.h - 22);
    const name = nameOverride ?? characterName(speakerId);
    this.nameBox.clear();
    this.nameText.setText(name);
    this.nameText.setVisible(!!name);
    this.nameText.setColor(style === 'tutorial' ? '#8fd6a8' : COLORS.accent);
    if (name) {
      const w = this.nameText.width + 20;
      drawPanel(this.nameBox, BOX.x + 10, BOX.y - 24, w, 24, 0.94, colors);
      this.nameText.setPosition(BOX.x + 20, BOX.y - 22);
    }
    const usePortrait = portraitKey && style === 'normal';
    if (usePortrait) {
      const key = this.textures.exists(`portrait:${portraitKey}`)
        ? `portrait:${portraitKey}`
        : ensurePortrait(this, portraitKey, name);
      this.portrait.setTexture(key).setDisplaySize(64, 64).setVisible(true);
      this.body.setPosition(BOX.x + 90, BOX.y + 12);
      this.body.setWordWrapWidth(BOX.w - 114, true);
    } else {
      this.portrait.setVisible(false);
      this.body.setPosition(BOX.x + 16, BOX.y + 12);
      this.body.setWordWrapWidth(BOX.w - 40, true);
    }
    this.body.setColor(colors.text);
    return style;
  }

  showSay(step: SayStep): Promise<void> {
    this.hideTimer?.remove();
    this.clearMenu();
    this.setSpeaker(step.speaker, step.name, step.portrait);
    this.root.setVisible(true);
    // Pensamentos (texto entre parênteses) em tom mais suave.
    if (/^\(.*\)$/s.test(step.text.trim()) && step.speaker !== 'narrador' && step.speaker !== 'tutorial') this.body.setColor('#c9c1dc');
    this.full = step.text;
    this.shown = 0;
    this.acc = 0;
    this.cps = step.speed ?? settings.textSpeed;
    this.typing = true;
    this.body.setText('');
    this.arrow.setVisible(false);
    input.clearPresses();
    return new Promise((resolve) => {
      this.resolveSay = () => {
        this.autoTimer?.remove();
        this.autoTimer = null;
        resolve();
      };
      if (step.auto !== undefined) {
        const wait = () => {
          if (this.typing) {
            this.autoTimer = this.time.delayedCall(100, wait);
            return;
          }
          this.autoTimer = this.time.delayedCall(step.auto!, () => this.advance());
        };
        wait();
      }
    });
  }

  showChoice(prompt: string | undefined, options: string[], speaker?: string): Promise<number> {
    this.hideTimer?.remove();
    if (prompt) {
      this.setSpeaker(speaker, undefined, undefined);
      this.full = prompt;
      this.shown = prompt.length;
      this.typing = false;
      this.body.setText(prompt);
    }
    this.root.setVisible(this.root.visible || !!prompt);
    this.arrow.setVisible(false);
    input.clearPresses();
    return new Promise((resolve) => {
      const size = 20;
      const spacing = 24;
      const widths = options.map((o) => makeText(this, 0, 0, o, size)).map((t) => {
        const w = t.width;
        t.destroy();
        return w;
      });
      const w = Math.min(GAME_WIDTH - 40, Math.max(...widths) + 52);
      const h = options.length * spacing + 16;
      const x = GAME_WIDTH - w - 12;
      const y = (this.root.visible ? BOX.y - 30 : GAME_HEIGHT - 16) - h;
      const g = this.add.graphics();
      drawPanel(g, x, y, w, h);
      this.menuObjs.push(g);
      this.menu = new MenuList(
        this,
        x + 30,
        y + 8,
        options.map((label, i) => ({
          label,
          action: () => {
            this.clearMenu();
            resolve(i);
          },
        })),
        { size, spacing },
      );
    });
  }

  private clearMenu(): void {
    this.menu?.destroy();
    this.menu = null;
    this.menuObjs.forEach((o) => o.destroy());
    this.menuObjs = [];
  }

  private advance(): void {
    if (this.typing) {
      this.shown = this.full.length;
      this.body.setText(this.full);
      this.typing = false;
      this.arrow.setVisible(true);
      return;
    }
    const r = this.resolveSay;
    this.resolveSay = null;
    if (r) {
      audio.sfx('cursor', 0.4);
      r();
    }
  }

  override update(time: number, delta: number): void {
    if (this.menu) {
      this.menu.update(time);
      input.consumeTap();
      return;
    }
    if (!this.resolveSay) {
      input.consumeTap();
      return;
    }
    if (this.typing) {
      const speedUp = input.isDown('B') ? 4 : 1;
      this.acc += (delta / 1000) * this.cps * speedUp;
      const n = Math.floor(this.acc);
      if (n > 0) {
        this.acc -= n;
        const before = this.shown;
        this.shown = Math.min(this.full.length, this.shown + n);
        this.body.setText(this.full.slice(0, this.shown));
        if (Math.floor(before / 3) !== Math.floor(this.shown / 3) && this.full[this.shown - 1] !== ' ') {
          audio.sfx('texto', 0.25);
        }
        if (this.shown >= this.full.length) {
          this.typing = false;
          this.arrow.setVisible(true);
        }
      }
    }
    const pressed = input.consume('A') || input.consumeTap() !== null || input.consume('B');
    if (pressed) this.advance();
  }
}
