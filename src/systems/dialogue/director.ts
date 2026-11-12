import type Phaser from 'phaser';
import { SCENES } from '../../config/constants';
import { audio } from '../../core/audio';
import { bus } from '../../core/events';
import { flags } from '../../core/flags';
import { input } from '../../core/input';
import { session } from '../../core/session';
import { getDialogue } from '../../content';
import { DialogueRunner, type DialogueHost } from './runner';
import { runActivity } from '../activity/registry';
import type { TitleCardData } from '../../scenes/TitleCardScene';
import type { DialogueScript, SayStep, Target } from './types';
import type { WorldScene } from '../../scenes/WorldScene';
import type { DialogueScene } from '../../scenes/DialogueScene';

/**
 * Diretor de cutscenes: executa um roteiro usando o Mundo (atores, câmera, mapa)
 * e a cena de Diálogo (caixa de texto, escolhas). Sobrevive à troca de mapa:
 * o passo `scene` com `map` reinicia o Mundo e o roteiro continua no mapa novo.
 */
export class CutsceneDirector implements DialogueHost {
  private game!: Phaser.Game;
  private runner: DialogueRunner | null = null;
  /** Ator "self" (NPC com quem se falou). */
  private selfActor: string | undefined;
  /** Cor/opacidade da tela preta/branca, mantida entre mapas. */
  fadeState = { color: 0x000000, alpha: 0 };

  init(game: Phaser.Game): void {
    this.game = game;
  }

  get active(): boolean {
    return this.runner !== null;
  }

  private get world(): WorldScene {
    return this.game.scene.getScene(SCENES.mundo) as WorldScene;
  }

  private get dialog(): DialogueScene {
    return this.game.scene.getScene(SCENES.dialogo) as DialogueScene;
  }

  /**
   * Executa um roteiro por id (ou objeto). Resolve quando ele termina.
   * `id` pode ser uma lista separada por vírgula ("a,b,c"): os roteiros rodam em sequência, como um só.
   * Cutscenes (tudo que não é conversa com NPC) gravam autosave no início e no fim; se a página
   * fechar no meio, o save de retomada volta ao início dela.
   */
  async run(idOrScript: string | DialogueScript, opts: { self?: string } = {}): Promise<void> {
    if (this.runner) {
      console.warn('[cutscene] já existe roteiro em execução; ignorando', idOrScript);
      return;
    }
    const script = typeof idOrScript === 'string' ? resolveScript(idOrScript) : idOrScript;
    if (!script) {
      console.error(`[cutscene] roteiro "${String(idOrScript)}" não encontrado em content/dialogues/`);
      return;
    }
    const isCutscene = !opts.self;
    session.beginCutscene(isCutscene && typeof idOrScript === 'string' ? idOrScript : undefined);
    if (isCutscene) this.world?.autosave(true);
    this.selfActor = opts.self;
    const runner = new DialogueRunner(script, this, flags);
    this.runner = runner;
    input.clearPresses();
    input.setJoystickEnabled(false);
    bus.emit('dialogue:start', { id: script.id });
    if (!this.game.scene.isActive(SCENES.dialogo)) this.game.scene.run(SCENES.dialogo);
    let outcome = 'ended';
    try {
      outcome = await runner.run();
    } catch (e) {
      console.error(`[cutscene] erro em "${script.id}":`, e);
    } finally {
      this.runner = null;
      this.selfActor = undefined;
      session.endCutscene();
      if (outcome !== 'scene') {
        this.dialog?.hideNow();
        this.world?.onCutsceneEnd();
        if (isCutscene) this.world?.autosave(true);
      }
      input.clearPresses();
      input.setJoystickEnabled(true);
      bus.emit('dialogue:end', { id: script.id });
    }
  }

  /** Aborta o roteiro atual (ex.: voltar ao título). */
  abort(): void {
    this.runner?.stop();
    this.runner = null;
    session.endCutscene();
    this.fadeState = { color: 0, alpha: 0 };
  }

  private actorId(id: string): string {
    return (id === 'self' || id === 'este') && this.selfActor ? this.selfActor : id;
  }

  // ------------- DialogueHost -------------

  say(step: SayStep): Promise<void> {
    return this.dialog.showSay(step);
  }

  choice(prompt: string | undefined, options: string[], speaker?: string): Promise<number> {
    return this.dialog.showChoice(prompt, options, speaker);
  }

  async move(step: import('./types').MoveStep): Promise<void> {
    this.dialog.hideSoon();
    await this.world.cutMove(this.actorId(step.actor), step.to, step.speed, step.facing);
  }

  face(step: import('./types').FaceStep): void {
    this.world.cutFace(this.actorId(step.actor), step.dir, step.to ? this.actorId(step.to) : undefined);
  }

  emote(step: import('./types').EmoteStep): Promise<void> {
    return this.world.cutEmote(this.actorId(step.actor), step.emote, step.ms ?? 900);
  }

  wait(ms: number): Promise<void> {
    this.dialog.hideSoon();
    return new Promise((r) => this.world.time.delayedCall(ms, r));
  }

  sfx(id: string, volume?: number): void {
    audio.sfx(id, volume);
  }

  music(step: import('./types').MusicStep): void {
    audio.playMusic(step.id, step.fadeMs ?? 800, step.volume ?? 1);
  }

  shake(step: import('./types').ShakeStep): Promise<void> {
    const cam = this.world.cameras.main;
    cam.shake(step.ms, step.intensity ?? 0.01);
    return new Promise((r) => this.world.time.delayedCall(step.ms, r));
  }

  fade(step: import('./types').FadeStep): Promise<void> {
    return this.world.cutFade(step.to, step.ms ?? 600);
  }

  camera(step: import('./types').CameraStep): Promise<void> {
    this.dialog.hideSoon();
    return this.world.cutCamera(step.to, step.follow ? this.actorId(step.follow) : undefined, step.zoom, step.ms ?? 800);
  }

  spawn(step: import('./types').SpawnStep): void {
    this.world.cutSpawn(step.actor, step.at, step.sprite, step.facing);
  }

  despawn(actor: string): void {
    this.world.cutDespawn(this.actorId(actor));
  }

  async scene(step: import('./types').SceneStep): Promise<'continue' | 'stop'> {
    if (step.scene) {
      this.dialog.hideNow();
      this.world.leaveToScene(step.scene);
      return 'stop';
    }
    this.dialog.hideNow();
    const ready = new Promise<void>((r) => bus.once('map:ready', () => r()));
    this.world.changeMap(step.map!, step.at, step.facing);
    await ready;
    return 'continue';
  }

  checkpoint(at?: Target): void {
    this.world.setCheckpoint(at);
  }

  autosave(): void {
    this.world.autosave(true);
  }

  anim(actor: string, anim: string): void {
    this.world.cutAnim(this.actorId(actor), anim);
  }

  title(text: string, subtitle: string | undefined, ms: number): Promise<void> {
    this.dialog.hideNow();
    return new Promise((resolve) => {
      this.game.scene.run(SCENES.titulo_card, { text, subtitle, ms, done: resolve } satisfies TitleCardData);
    });
  }

  async activity(id: string, params: Record<string, string | number | boolean>): Promise<void> {
    this.dialog.hideNow();
    await runActivity(this.world, id, params);
    input.clearPresses();
  }

  light(radius: number, ms: number): Promise<void> {
    return this.world.setLight(radius, ms);
  }

  loadScript(id: string): DialogueScript | undefined {
    return getDialogue(id);
  }
}

/** "a,b,c" → roteiro sintético que chama a, b e c em sequência. */
export function resolveScript(id: string): DialogueScript | undefined {
  const ids = id.split(',').map((s) => s.trim()).filter(Boolean);
  if (ids.length <= 1) return getDialogue(ids[0] ?? id);
  if (ids.some((i) => !getDialogue(i))) return undefined;
  return { id, steps: ids.map((i) => ({ type: 'call' as const, id: i })) };
}

export const director = new CutsceneDirector();
