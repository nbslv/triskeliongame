import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, SCENES } from '../config/constants';
import { input } from '../core/input';
import { AUTO_SLOT, saves, type SaveData, type SlotId } from '../core/save';
import { formatPlaytime, session } from '../core/session';
import { maps } from '../content';
import { director } from '../systems/dialogue/director';
import { props, type TiledMap } from '../systems/world/tiled';
import { MenuList } from '../ui/MenuList';
import { drawPanel, makeText } from '../ui/text';
import type { WorldData } from './WorldScene';

export interface SlotsData {
  mode: 'save' | 'load';
  /** Cena que abriu (é retomada ao fechar). */
  parent: string;
}

export function mapDisplayName(id: string): string {
  const m = maps.get(id) as TiledMap | undefined;
  const p = props(m);
  return String(p.nome ?? p.name ?? id);
}

function describe(slot: SlotId, d: SaveData | null): string {
  const label = slot === AUTO_SLOT ? 'Auto' : `Espaço ${slot}`;
  if (!d) return `${label} — vazio`;
  const date = new Date(d.savedAt);
  const when = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  return `${label} — ${mapDisplayName(d.position.map)} — ${formatPlaytime(d.playtimeMs)} — ${when}`;
}

/** Escolha de espaço para salvar ou carregar. */
export class SlotsScene extends Phaser.Scene {
  private menu!: MenuList;
  private cfg!: SlotsData;
  private msg!: Phaser.GameObjects.Text;

  constructor() {
    super(SCENES.espacos);
  }

  create(data: SlotsData): void {
    this.cfg = data;
    input.clearPresses();
    const w = 520;
    const h = 210;
    const x = (GAME_WIDTH - w) / 2;
    const y = (GAME_HEIGHT - h) / 2;
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.5).setOrigin(0);
    drawPanel(this.add.graphics(), x, y, w, h);
    makeText(this, GAME_WIDTH / 2, y + 22, data.mode === 'save' ? 'Salvar' : 'Carregar', 24, COLORS.accent).setOrigin(0.5);
    this.msg = makeText(this, GAME_WIDTH / 2, y + h - 18, 'B volta', 16, COLORS.textDim).setOrigin(0.5);

    const list = saves.list();
    const items = list.map(({ slot, data: d }) => ({
      label: describe(slot, d),
      enabled: data.mode === 'save' ? slot !== AUTO_SLOT : d !== null,
      action: () => (data.mode === 'save' ? this.save(slot) : d && this.loadSave(d)),
    }));
    items.push({ label: 'Voltar', enabled: true, action: () => this.close() });
    this.menu = new MenuList(this, x + 36, y + 50, items, { size: 20, spacing: 26, onCancel: () => this.close() });
    if (data.mode === 'load') {
      const latest = saves.latest();
      const idx = latest ? list.findIndex((l) => l.slot === latest.slot) : -1;
      if (idx >= 0) this.menu.index = idx;
      this.menu.update(0);
    }
  }

  private save(slot: SlotId): void {
    const d = session.save(slot);
    const i = saves.list().findIndex((l) => l.slot === slot);
    this.menu.setLabel(i, describe(slot, d));
    this.msg.setText(d ? 'Jogo salvo!' : 'Não foi possível salvar aqui');
  }

  private loadSave(d: SaveData): void {
    director.abort();
    session.loadFrom(d);
    this.scene.stop(SCENES.menu);
    this.scene.stop(SCENES.dialogo);
    if (this.cfg.parent !== SCENES.mundo && this.cfg.parent !== SCENES.menu) this.scene.stop(this.cfg.parent);
    this.scene.stop(SCENES.mundo);
    this.scene.start(SCENES.mundo, {
      map: d.position.map,
      at: { x: d.position.x, y: d.position.y },
      facing: d.position.facing,
      respawn: true,
    } satisfies WorldData);
  }

  private close(): void {
    input.clearPresses();
    this.scene.stop();
    this.scene.resume(this.cfg.parent);
  }

  override update(time: number): void {
    this.menu.update(time);
  }
}
