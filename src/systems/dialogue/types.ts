import type { Direction } from '../../config/constants';
import type { FlagValue } from '../../core/events';

/** Posição: coordenada de TILE [x, y] ou nome de marcador da camada `markers` do mapa. */
export type Target = [number, number] | string;

export interface SayStep {
  type: 'say';
  /** id do personagem (procura o nome em content/characters.json). */
  speaker?: string;
  /** Sobrescreve o nome exibido. */
  name?: string;
  /** Chave da textura do retrato (assets/portraits/<chave>.png). */
  portrait?: string;
  text: string;
  /** Caracteres por segundo (padrão: opção do jogador). */
  speed?: number;
  /** Avança sozinho após N ms depois de terminar de digitar. */
  auto?: number;
}

export interface ChoiceOption {
  text: string;
  /** Salta para um label... */
  goto?: string;
  /** ...ou executa estes passos e continua após o `choice`. */
  steps?: Step[];
  /** Condição (ver flags) para a opção aparecer. */
  if?: string;
}

export interface ChoiceStep {
  type: 'choice';
  /** Texto opcional mostrado acima das opções. */
  prompt?: string;
  speaker?: string;
  options: ChoiceOption[];
}

export interface LabelStep {
  type: 'label';
  name: string;
}

export interface GotoStep {
  type: 'goto';
  label: string;
}

export interface IfStep {
  type: 'if';
  /** Nome da flag (verdadeira se definida e não false/0/""), ou compare com `equals`. */
  flag?: string;
  equals?: FlagValue;
  /** Expressão completa, ex.: "a && !b", "contador >= 2". Alternativa a `flag`. */
  cond?: string;
  /** Se verdadeiro: salta para label... */
  goto?: string;
  /** ...ou executa estes passos. */
  then?: Step[];
  /** Se falso: label (texto) ou passos (lista). */
  else?: string | Step[];
}

export interface FlagStep {
  type: 'flag';
  set?: string;
  value?: FlagValue;
  clear?: string;
  add?: string;
  by?: number;
}

export interface MoveStep {
  type: 'move';
  actor: string;
  to: Target;
  /** px/s (padrão 60). */
  speed?: number;
  /** Espera chegar antes do próximo passo (padrão true). */
  wait?: boolean;
  /** Direção final. */
  facing?: Direction;
}

export interface FaceStep {
  type: 'face';
  actor: string;
  dir?: Direction;
  /** Vira na direção de outro ator ou marcador. */
  to?: string;
}

export interface EmoteStep {
  type: 'emote';
  actor: string;
  /** Texto/símbolo do balão: "!", "?", "...", "♥", "💧" etc. */
  emote: string;
  ms?: number;
  wait?: boolean;
}

export interface WaitStep {
  type: 'wait';
  ms: number;
}

export interface SfxStep {
  type: 'sfx';
  id: string;
  volume?: number;
}

export interface MusicStep {
  type: 'music';
  /** id da faixa; null para parar. */
  id: string | null;
  fadeMs?: number;
  volume?: number;
}

export interface ShakeStep {
  type: 'shake';
  ms: number;
  /** 0..0.05 (padrão 0.01). */
  intensity?: number;
  wait?: boolean;
}

export interface FadeStep {
  type: 'fade';
  /** "black", "white", "clear" (volta ao normal) ou cor "#rrggbb". */
  to: string;
  ms?: number;
}

export interface CameraStep {
  type: 'camera';
  /** Move a câmera até tile/marcador/ator. */
  to?: Target;
  /** Volta a seguir um ator (ex.: "icaro"). */
  follow?: string;
  zoom?: number;
  ms?: number;
  wait?: boolean;
}

export interface SpawnStep {
  type: 'spawn';
  actor: string;
  /** Textura/spritesheet (padrão: placeholder gerado a partir do id). */
  sprite?: string;
  at: Target;
  facing?: Direction;
}

export interface DespawnStep {
  type: 'despawn';
  actor: string;
}

export interface SceneStep {
  type: 'scene';
  /** Troca de mapa (content/maps/<map>.json); o roteiro continua no novo mapa. */
  map?: string;
  at?: Target;
  facing?: Direction;
  /** Ou troca de cena do Phaser (ex.: "Titulo"); encerra o roteiro. */
  scene?: string;
}

export interface EndStep {
  type: 'end';
}

// ---- extensões do motor (documentadas em docs/tecnico/DIALOGO.md) ----

export interface CheckpointStep {
  type: 'checkpoint';
  /** Padrão: posição atual do jogador. */
  at?: Target;
}

export interface AutosaveStep {
  type: 'autosave';
}

export interface AnimStep {
  type: 'anim';
  actor: string;
  /** Pose/animação: toca `<sprite>:<anim>` se existir; "normal" volta ao parado. Sem animação = ignorado. */
  anim: string;
}

export interface TitleStep {
  type: 'title';
  text: string;
  subtitle?: string;
  /** Tempo mínimo na tela antes de aceitar toque (padrão 1500). */
  ms?: number;
}

export interface ActivityStep {
  type: 'activity';
  /** id registrado em src/systems/activity/index.ts */
  id: string;
  params?: Record<string, string | number | boolean>;
}

export interface LightStep {
  type: 'light';
  /** Raio do círculo de luz em mapas escuros (0 = breu; omitido = valor do mapa). */
  radius: number;
  ms?: number;
}

export interface CallStep {
  type: 'call';
  /** Executa outro roteiro (content/dialogues/<id>.json) e volta. */
  id: string;
}

export type Step =
  | SayStep
  | ChoiceStep
  | LabelStep
  | GotoStep
  | IfStep
  | FlagStep
  | MoveStep
  | FaceStep
  | EmoteStep
  | WaitStep
  | SfxStep
  | MusicStep
  | ShakeStep
  | FadeStep
  | CameraStep
  | SpawnStep
  | DespawnStep
  | SceneStep
  | EndStep
  | CheckpointStep
  | AutosaveStep
  | CallStep
  | AnimStep
  | TitleStep
  | ActivityStep
  | LightStep;

export type StepType = Step['type'];

export interface DialogueScript {
  id: string;
  /** Comentário livre para quem edita (ignorado pelo motor). */
  description?: string;
  steps: Step[];
}
