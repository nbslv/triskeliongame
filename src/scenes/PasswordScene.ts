import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, SCENES } from '../config/constants';
import { checkPassword, rememberUnlock } from '../core/password';
import { input } from '../core/input';
import { makeText } from '../ui/text';

/**
 * Tela de senha. O campo é HTML (para abrir o teclado nativo do celular).
 * Proteção LEVE: ver src/core/password.ts e docs/tecnico/ARQUITETURA.md.
 */
export class PasswordScene extends Phaser.Scene {
  private form: HTMLFormElement | null = null;

  constructor() {
    super(SCENES.senha);
  }

  create(): void {
    input.setJoystickEnabled(false);
    makeText(this, GAME_WIDTH / 2, 90, 'TRISKELION', 48, COLORS.accent).setOrigin(0.5);
    makeText(this, GAME_WIDTH / 2, 140, 'Digite a senha para entrar', 20).setOrigin(0.5);
    const msg = makeText(this, GAME_WIDTH / 2, GAME_HEIGHT - 70, '', 20, '#ff7a6a').setOrigin(0.5);

    const form = document.createElement('form');
    form.className = 'senha-form';
    form.autocomplete = 'off';
    const field = document.createElement('input');
    field.type = 'password';
    field.name = 'senha';
    field.placeholder = 'senha';
    field.setAttribute('aria-label', 'Senha');
    field.autocapitalize = 'off';
    field.spellcheck = false;
    const btn = document.createElement('button');
    btn.type = 'submit';
    btn.textContent = 'Entrar';
    form.append(field, btn);
    document.body.appendChild(form);
    this.form = form;
    setTimeout(() => field.focus(), 50);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (checkPassword(field.value)) {
        rememberUnlock();
        this.scene.start(SCENES.titulo);
      } else {
        msg.setText('Senha incorreta');
        field.value = '';
        this.cameras.main.shake(150, 0.004);
      }
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.form?.remove();
      this.form = null;
    });
  }
}
