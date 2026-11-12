import { GAME_HEIGHT, GAME_WIDTH } from '../config/constants';
import { settings } from './settings';

/**
 * Input unificado: teclado (desktop) + joystick virtual e botões na tela (toque).
 * Independente de cena: escuta eventos do DOM diretamente no canvas/janela,
 * com suporte a multitoque (cada dedo é rastreado pelo pointerId).
 *
 * Uso nas cenas:
 *   input.axis()            -> { x, y } analógico em [-1, 1]
 *   input.isDown('B')       -> botão segurado (ex.: correr)
 *   input.consume('A')      -> true uma vez por pressionamento (confirmar/interagir)
 *   input.consumeTap()      -> toque livre na tela (fora de joystick/botões), ex.: avançar diálogo
 *
 * Teclado: setas/WASD movem; Z/Enter/Espaço = A; X/Esc/Shift = B; M/Tab/P/Esc = MENU.
 */
export type Button = 'A' | 'B' | 'MENU';
export const BUTTONS: readonly Button[] = ['A', 'B', 'MENU'];

export interface TouchButtonLayout {
  id: Button;
  x: number;
  y: number;
  r: number;
}

/** Posição dos botões na tela, em coordenadas lógicas (640×360). */
export const BUTTON_LAYOUT: TouchButtonLayout[] = [
  { id: 'A', x: GAME_WIDTH - 52, y: GAME_HEIGHT - 82, r: 26 },
  { id: 'B', x: GAME_WIDTH - 108, y: GAME_HEIGHT - 44, r: 22 },
  { id: 'MENU', x: GAME_WIDTH - 30, y: 26, r: 16 },
];

export const JOYSTICK_RADIUS = 34;
/** Fração esquerda da tela onde um toque cria o joystick. */
export const JOYSTICK_ZONE = 0.5;

const KEYMAP: Record<string, Button[]> = {
  KeyZ: ['A'],
  Enter: ['A'],
  NumpadEnter: ['A'],
  Space: ['A'],
  KeyX: ['B'],
  ShiftLeft: ['B'],
  ShiftRight: ['B'],
  Escape: ['B', 'MENU'],
  KeyM: ['MENU'],
  Tab: ['MENU'],
  KeyP: ['MENU'],
};
const AXIS_KEYS: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0],
  KeyA: [-1, 0],
  ArrowRight: [1, 0],
  KeyD: [1, 0],
  ArrowUp: [0, -1],
  KeyW: [0, -1],
  ArrowDown: [0, 1],
  KeyS: [0, 1],
};

export interface JoystickState {
  active: boolean;
  baseX: number;
  baseY: number;
  knobX: number;
  knobY: number;
}

export class InputService {
  private keysDown = new Set<string>();
  private buttonDownSources = new Map<Button, Set<string>>();
  private pending = new Set<Button>();
  private taps: { x: number; y: number }[] = [];
  private joyPointer: number | null = null;
  private buttonPointers = new Map<number, Button>();
  readonly joystick: JoystickState = { active: false, baseX: 0, baseY: 0, knobX: 0, knobY: 0 };
  private joyVec = { x: 0, y: 0 };

  /** Joystick habilitado (desligue em menus para que toques virem seleção). */
  joystickEnabled = true;
  /** Controles de toque visíveis (verdadeiro em aparelhos com toque). */
  touchMode = false;
  /** Bloqueia todo input de jogo (ex.: durante transições). */
  locked = false;

  private canvas: HTMLCanvasElement | null = null;
  private attached = false;

  constructor() {
    for (const b of BUTTONS) this.buttonDownSources.set(b, new Set());
  }

  attach(canvas: HTMLCanvasElement): void {
    if (this.attached) return;
    this.attached = true;
    this.canvas = canvas;
    this.touchMode = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', () => this.releaseAll());
    canvas.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('pointercancel', this.onPointerUp);
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    // Tela cheia ao tocar (precisa de gesto do usuário; 'touchend' conta como ativação).
    window.addEventListener('touchend', this.tryFullscreen, { passive: true });
  }

  // ---------- leitura ----------

  axis(): { x: number; y: number } {
    if (this.locked) return { x: 0, y: 0 };
    let kx = 0;
    let ky = 0;
    for (const code of this.keysDown) {
      const a = AXIS_KEYS[code];
      if (a) {
        kx += a[0];
        ky += a[1];
      }
    }
    kx = Math.sign(kx);
    ky = Math.sign(ky);
    if (kx || ky) {
      const len = Math.hypot(kx, ky);
      return { x: kx / len, y: ky / len };
    }
    return { ...this.joyVec };
  }

  isDown(b: Button): boolean {
    return !this.locked && (this.buttonDownSources.get(b)?.size ?? 0) > 0;
  }

  /** Retorna true uma única vez por pressionamento pendente. */
  consume(b: Button): boolean {
    if (this.locked) return false;
    if (this.pending.has(b)) {
      this.pending.delete(b);
      return true;
    }
    return false;
  }

  /** Toque livre (fora do joystick/botões). Retorna a posição ou null. */
  consumeTap(): { x: number; y: number } | null {
    if (this.locked) return null;
    return this.taps.shift() ?? null;
  }

  /** Descarta pressionamentos pendentes (use ao trocar de contexto: abrir menu, iniciar diálogo...). */
  clearPresses(): void {
    this.pending.clear();
    this.taps.length = 0;
  }

  // ---------- injeção (também usada por testes) ----------

  press(b: Button, source = 'virtual'): void {
    const set = this.buttonDownSources.get(b)!;
    if (set.size === 0) this.pending.add(b);
    set.add(source);
  }

  release(b: Button, source = 'virtual'): void {
    this.buttonDownSources.get(b)!.delete(source);
  }

  private releaseAll(): void {
    this.keysDown.clear();
    for (const s of this.buttonDownSources.values()) s.clear();
    this.joyPointer = null;
    this.buttonPointers.clear();
    this.joystick.active = false;
    this.joyVec = { x: 0, y: 0 };
  }

  // ---------- teclado ----------

  private onKeyDown = (e: KeyboardEvent): void => {
    const target = e.target as HTMLElement | null;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
    const mapped = KEYMAP[e.code];
    if (mapped || AXIS_KEYS[e.code]) e.preventDefault();
    if (e.repeat) return;
    this.keysDown.add(e.code);
    mapped?.forEach((b) => this.press(b, 'key:' + e.code));
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    this.keysDown.delete(e.code);
    KEYMAP[e.code]?.forEach((b) => this.release(b, 'key:' + e.code));
  };

  // ---------- toque / ponteiro ----------

  toGame(clientX: number, clientY: number): { x: number; y: number } {
    const rect = this.canvas?.getBoundingClientRect();
    if (!rect || rect.width === 0) return { x: clientX, y: clientY };
    return {
      x: ((clientX - rect.left) / rect.width) * GAME_WIDTH,
      y: ((clientY - rect.top) / rect.height) * GAME_HEIGHT,
    };
  }

  private onPointerDown = (e: PointerEvent): void => {
    if (e.pointerType === 'touch' && !this.touchMode) this.touchMode = true;
    const p = this.toGame(e.clientX, e.clientY);
    // Botões só existem com controles de toque visíveis.
    if (this.touchMode) {
      for (const btn of BUTTON_LAYOUT) {
        if (Math.hypot(p.x - btn.x, p.y - btn.y) <= btn.r + 8) {
          this.buttonPointers.set(e.pointerId, btn.id);
          this.press(btn.id, 'ptr:' + e.pointerId);
          return;
        }
      }
      if (this.joystickEnabled && this.joyPointer === null && p.x < GAME_WIDTH * JOYSTICK_ZONE) {
        this.joyPointer = e.pointerId;
        Object.assign(this.joystick, { active: true, baseX: p.x, baseY: p.y, knobX: p.x, knobY: p.y });
        this.joyVec = { x: 0, y: 0 };
        return;
      }
    }
    this.taps.push(p);
    if (this.taps.length > 4) this.taps.shift();
  };

  private onPointerMove = (e: PointerEvent): void => {
    if (e.pointerId !== this.joyPointer) return;
    const p = this.toGame(e.clientX, e.clientY);
    const dx = p.x - this.joystick.baseX;
    const dy = p.y - this.joystick.baseY;
    const dist = Math.hypot(dx, dy);
    const clamped = Math.min(dist, JOYSTICK_RADIUS);
    const nx = dist > 0 ? dx / dist : 0;
    const ny = dist > 0 ? dy / dist : 0;
    this.joystick.knobX = this.joystick.baseX + nx * clamped;
    this.joystick.knobY = this.joystick.baseY + ny * clamped;
    // Zona morta de 20% e resposta analógica.
    const mag = clamped / JOYSTICK_RADIUS;
    const eff = mag < 0.2 ? 0 : (mag - 0.2) / 0.8;
    this.joyVec = { x: nx * eff, y: ny * eff };
  };

  private onPointerUp = (e: PointerEvent): void => {
    if (e.pointerId === this.joyPointer) {
      this.joyPointer = null;
      this.joystick.active = false;
      this.joyVec = { x: 0, y: 0 };
    }
    const btn = this.buttonPointers.get(e.pointerId);
    if (btn) {
      this.buttonPointers.delete(e.pointerId);
      this.release(btn, 'ptr:' + e.pointerId);
    }
  };

  /** Desliga o joystick (e solta o dedo que o controlava). */
  setJoystickEnabled(on: boolean): void {
    this.joystickEnabled = on;
    if (!on && this.joyPointer !== null) {
      this.joyPointer = null;
      this.joystick.active = false;
      this.joyVec = { x: 0, y: 0 };
    }
  }

  private tryFullscreen = (): void => {
    if (!settings.fullscreenOnTouch) return;
    const doc = document as Document & { webkitFullscreenElement?: Element };
    if (doc.fullscreenElement || doc.webkitFullscreenElement) return;
    const el = document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => void };
    try {
      const p = el.requestFullscreen?.({ navigationUI: 'hide' }) ?? el.webkitRequestFullscreen?.();
      Promise.resolve(p)
        .then(() => {
          const o = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
          return o?.lock?.('landscape');
        })
        .catch(() => undefined);
    } catch {
      /* iPhone não suporta Fullscreen API em páginas; ok. */
    }
  };
}

export const input = new InputService();
