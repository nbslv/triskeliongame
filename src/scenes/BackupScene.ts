import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, SCENES } from '../config/constants';
import { input } from '../core/input';
import { saves } from '../core/save';
import { makeText, drawPanel } from '../ui/text';
import { slotLabel } from './SlotsScene';

/**
 * Exportar/importar saves (para não perder o progresso ao limpar o navegador ou trocar de aparelho).
 * Usa elementos HTML sobre o canvas: botões, área de texto e seletor de arquivo.
 */
export class BackupScene extends Phaser.Scene {
  private root: HTMLDivElement | null = null;
  private parentKey = '';

  constructor() {
    super(SCENES.backup);
  }

  create(data: { parent: string }): void {
    this.parentKey = data.parent;
    input.setJoystickEnabled(false);
    input.clearPresses();
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6).setOrigin(0);
    drawPanel(this.add.graphics(), 16, 8, GAME_WIDTH - 32, GAME_HEIGHT - 16);
    makeText(this, GAME_WIDTH / 2, 24, 'Backup do jogo salvo', 22, COLORS.accent).setOrigin(0.5);

    const root = document.createElement('div');
    root.className = 'backup';
    root.innerHTML = `
      <p class="backup-info">Guarde uma cópia dos seus saves. Para recuperar, importe o arquivo ou cole o texto.</p>
      <div class="backup-botoes">
        <button data-a="baixar">Baixar arquivo</button>
        <button data-a="copiar">Copiar texto</button>
        <label class="backup-arquivo">Importar arquivo<input type="file" accept=".json,.txt,application/json,text/plain" hidden></label>
        <button data-a="colar">Importar texto colado</button>
        <button data-a="fechar">Fechar</button>
      </div>
      <textarea spellcheck="false" aria-label="Texto do save"></textarea>
      <p class="backup-msg" aria-live="polite"></p>`;
    document.body.appendChild(root);
    this.root = root;
    const area = root.querySelector('textarea')!;
    const msg = root.querySelector<HTMLParagraphElement>('.backup-msg')!;
    const say = (t: string, ok = true) => {
      msg.textContent = t;
      msg.style.color = ok ? '#e8b04a' : '#ff7a6a';
    };
    const exported = saves.exportAll();
    area.value = exported;
    if (!saves.hasAny()) say('Ainda não há saves para exportar.', false);

    const doImport = (text: string) => {
      try {
        const slots = saves.importAll(text);
        say(`Importado: ${slots.map((s) => slotLabel(s)).join(', ')}.`);
        area.value = saves.exportAll();
      } catch (e) {
        say(`Não foi possível importar: ${(e as Error).message}`, false);
      }
    };

    root.addEventListener('click', (e) => {
      const a = (e.target as HTMLElement).closest('button')?.dataset.a;
      if (a === 'baixar') {
        const blob = new Blob([saves.exportAll()], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const d = new Date();
        link.href = url;
        link.download = `triskelion-save-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}.json`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        say('Arquivo gerado.');
      } else if (a === 'copiar') {
        area.value = saves.exportAll();
        area.select();
        const done = () => say('Texto copiado.');
        if (navigator.clipboard?.writeText) navigator.clipboard.writeText(area.value).then(done, () => {
          document.execCommand?.('copy');
          done();
        });
        else {
          document.execCommand?.('copy');
          done();
        }
      } else if (a === 'colar') {
        if (area.value.trim() === exported.trim()) say('Cole na caixa o texto de um backup e toque de novo.', false);
        else doImport(area.value);
      } else if (a === 'fechar') {
        this.close();
      }
    });
    root.querySelector<HTMLInputElement>('input[type=file]')!.addEventListener('change', (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      void file.text().then(doImport);
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.root?.remove();
      this.root = null;
    });
  }

  private close(): void {
    input.clearPresses();
    this.scene.stop();
    this.scene.resume(this.parentKey);
  }

  override update(): void {
    if (input.consume('B') || input.consume('MENU')) this.close();
  }
}
