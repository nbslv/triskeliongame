import type { FlagStore } from '../../core/flags';
import { evaluateCondition } from '../../core/flags';
import type {
  CameraStep,
  ChoiceOption,
  DialogueScript,
  EmoteStep,
  FaceStep,
  FadeStep,
  MoveStep,
  MusicStep,
  SayStep,
  SceneStep,
  ShakeStep,
  SpawnStep,
  Step,
  Target,
} from './types';

/**
 * Tudo que o executor precisa do mundo. A implementação real fica em
 * src/systems/world/CutsceneHost.ts; os testes usam uma versão falsa.
 * Métodos que retornam Promise são aguardados pelo executor.
 */
export interface DialogueHost {
  say(step: SayStep): Promise<void>;
  /** Mostra as opções (já filtradas) e resolve com o índice escolhido. */
  choice(prompt: string | undefined, options: string[], speaker?: string): Promise<number>;
  move(step: MoveStep): Promise<void>;
  face(step: FaceStep): void | Promise<void>;
  emote(step: EmoteStep): Promise<void>;
  wait(ms: number): Promise<void>;
  sfx(id: string, volume?: number): void;
  music(step: MusicStep): void;
  shake(step: ShakeStep): Promise<void>;
  fade(step: FadeStep): Promise<void>;
  camera(step: CameraStep): Promise<void>;
  spawn(step: SpawnStep): void | Promise<void>;
  despawn(actor: string): void;
  /** Troca de mapa: resolve quando o novo mapa estiver pronto. Troca de cena: o roteiro termina. */
  scene(step: SceneStep): Promise<'continue' | 'stop'>;
  checkpoint(at?: Target): void;
  autosave(): void;
  /** Carrega outro roteiro para `call`. */
  loadScript(id: string): DialogueScript | undefined;
}

export type RunOutcome = 'ended' | 'stopped' | 'scene';

interface Frame {
  steps: Step[];
  index: number;
  /** Frame raiz de um roteiro (onde os labels vivem). */
  root: boolean;
  labels: Map<string, number>;
}

const MAX_STEPS = 100_000;

export class DialogueRunner {
  private stack: Frame[] = [];
  private stopped = false;
  private executed = 0;

  constructor(
    readonly script: DialogueScript,
    private readonly host: DialogueHost,
    private readonly flags: FlagStore,
  ) {}

  /** Interrompe a execução no próximo passo. */
  stop(): void {
    this.stopped = true;
  }

  get isStopped(): boolean {
    return this.stopped;
  }

  async run(): Promise<RunOutcome> {
    this.pushScript(this.script);
    while (this.stack.length > 0) {
      if (this.stopped) return 'stopped';
      const frame = this.stack[this.stack.length - 1]!;
      if (frame.index >= frame.steps.length) {
        this.stack.pop();
        continue;
      }
      const step = frame.steps[frame.index++]!;
      if (++this.executed > MAX_STEPS) throw new Error(`Roteiro "${this.script.id}": laço infinito?`);
      const result = await this.exec(step);
      if (result === 'end') return 'ended';
      if (result === 'scene') return 'scene';
    }
    return this.stopped ? 'stopped' : 'ended';
  }

  private pushScript(script: DialogueScript): void {
    const labels = new Map<string, number>();
    script.steps.forEach((s, i) => {
      if (s.type === 'label') labels.set(s.name, i);
    });
    this.stack.push({ steps: script.steps, index: 0, root: true, labels });
  }

  private pushBlock(steps: Step[]): void {
    const parent = this.stack[this.stack.length - 1]!;
    this.stack.push({ steps, index: 0, root: false, labels: parent.labels });
  }

  /** Volta ao frame raiz do roteiro atual e salta para o label. */
  private jump(label: string): void {
    while (this.stack.length > 0 && !this.stack[this.stack.length - 1]!.root) this.stack.pop();
    const root = this.stack[this.stack.length - 1];
    const idx = root?.labels.get(label);
    if (!root || idx === undefined) throw new Error(`Label "${label}" não encontrado em "${this.script.id}"`);
    root.index = idx + 1;
  }

  private test(cond: { flag?: string; equals?: unknown; cond?: string }): boolean {
    if (cond.cond) return evaluateCondition(cond.cond, this.flags);
    if (cond.flag === undefined) return false;
    if (cond.equals !== undefined) return (this.flags.get(cond.flag) ?? false) === cond.equals;
    return this.flags.isSet(cond.flag);
  }

  private async exec(step: Step): Promise<'next' | 'end' | 'scene'> {
    const h = this.host;
    switch (step.type) {
      case 'say':
        await h.say(step);
        break;
      case 'choice': {
        const visible: ChoiceOption[] = step.options.filter((o) => !o.if || evaluateCondition(o.if, this.flags));
        if (visible.length === 0) break;
        const picked = await h.choice(step.prompt, visible.map((o) => o.text), step.speaker);
        const opt = visible[Math.max(0, Math.min(visible.length - 1, picked))]!;
        if (opt.goto) this.jump(opt.goto);
        else if (opt.steps) this.pushBlock(opt.steps);
        break;
      }
      case 'label':
        break;
      case 'goto':
        this.jump(step.label);
        break;
      case 'if': {
        if (this.test(step)) {
          if (step.goto) this.jump(step.goto);
          else if (step.then) this.pushBlock(step.then);
        } else if (typeof step.else === 'string') this.jump(step.else);
        else if (Array.isArray(step.else)) this.pushBlock(step.else);
        break;
      }
      case 'flag':
        if (step.set) this.flags.set(step.set, step.value ?? true);
        if (step.clear) this.flags.clear(step.clear);
        if (step.add) this.flags.add(step.add, step.by ?? 1);
        break;
      case 'move':
        if (step.wait === false) void h.move(step);
        else await h.move(step);
        break;
      case 'face':
        await h.face(step);
        break;
      case 'emote':
        if (step.wait === false) void h.emote(step);
        else await h.emote(step);
        break;
      case 'wait':
        await h.wait(step.ms);
        break;
      case 'sfx':
        h.sfx(step.id, step.volume);
        break;
      case 'music':
        h.music(step);
        break;
      case 'shake':
        if (step.wait) await h.shake(step);
        else void h.shake(step);
        break;
      case 'fade':
        await h.fade(step);
        break;
      case 'camera':
        if (step.wait === false) void h.camera(step);
        else await h.camera(step);
        break;
      case 'spawn':
        await h.spawn(step);
        break;
      case 'despawn':
        h.despawn(step.actor);
        break;
      case 'scene': {
        const r = await h.scene(step);
        if (r === 'stop') return 'scene';
        break;
      }
      case 'checkpoint':
        h.checkpoint(step.at);
        break;
      case 'autosave':
        h.autosave();
        break;
      case 'call': {
        const sub = h.loadScript(step.id);
        if (!sub) throw new Error(`call: roteiro "${step.id}" não encontrado`);
        this.pushScript(sub);
        break;
      }
      case 'end': {
        // Dentro de um `call`, `end` só encerra o roteiro chamado.
        const roots = this.stack.filter((f) => f.root).length;
        if (roots <= 1) return 'end';
        while (!this.stack[this.stack.length - 1]!.root) this.stack.pop();
        this.stack.pop();
        break;
      }
    }
    return 'next';
  }
}
