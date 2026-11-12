import type Phaser from 'phaser';
import type { FlagValue } from '../../core/events';
import { flags } from '../../core/flags';
import { session } from '../../core/session';

/**
 * ATIVIDADES (lojas, treinos, minijogos): ponto de entrada genérico.
 *
 * 1. Crie uma cena Phaser que recebe `ActivityLaunch` em `create(data)` e chama
 *    `data.finish(resultado)` ao terminar (ela mesma se fecha com `this.scene.stop()`).
 * 2. Registre: `registerActivity('treino_magia', { sceneKey: 'TreinoMagia' })` (em src/systems/activity/index.ts).
 * 3. No Tiled, um objeto com a propriedade `activity` = "treino_magia" (e `param_*` opcionais) abre a cena
 *    ao apertar A. Num roteiro: passo `{ "type": "activity", "id": "treino_magia", "params": {...} }`.
 * 4. O resultado é aplicado no estado do save (flags, moedas, itens, atributos) e há autosave.
 */
export interface ActivityResult {
  /** O jogador concluiu (false = desistiu/cancelou). */
  completed: boolean;
  /** Flags a definir. */
  flags?: Record<string, FlagValue>;
  /** Variação de moedas (+ganho, −gasto). */
  coins?: number;
  /** Variação de itens: id → quantidade (+/−). */
  items?: Record<string, number>;
  /** Variação de atributos: id → delta (ex.: { magia: 1 }). */
  attributes?: Record<string, number>;
  /** Pontuação livre (fica na flag `atividade.<id>.melhor` se for recorde). */
  score?: number;
}

export interface ActivityLaunch {
  id: string;
  params: Record<string, FlagValue>;
  /** Estado atual, só leitura (para lojas mostrarem moedas/inventário). */
  state: Readonly<typeof session.state>;
  finish: (result: ActivityResult) => void;
}

export interface ActivityDef {
  /** Chave da cena Phaser registrada em main.ts. */
  sceneKey: string;
  /** Pausa o Mundo enquanto roda (padrão true). */
  pauseWorld?: boolean;
}

const registry = new Map<string, ActivityDef>();

export function registerActivity(id: string, def: ActivityDef): void {
  registry.set(id, def);
}

export function hasActivity(id: string): boolean {
  return registry.has(id);
}

export function listActivities(): string[] {
  return [...registry.keys()];
}

/** Aplica o resultado no estado da partida. Puro em relação ao Phaser (testável). */
export function applyActivityResult(id: string, r: ActivityResult): void {
  if (r.completed) {
    flags.set(`atividade.${id}.concluida`, true);
    flags.add(`atividade.${id}.vezes`, 1);
  }
  for (const [k, v] of Object.entries(r.flags ?? {})) flags.set(k, v);
  if (r.coins) session.addCoins(r.coins);
  for (const [k, v] of Object.entries(r.items ?? {})) session.addItem(k, v);
  for (const [k, v] of Object.entries(r.attributes ?? {})) session.addAttribute(k, v);
  if (typeof r.score === 'number') {
    const best = flags.get(`atividade.${id}.melhor`);
    if (typeof best !== 'number' || r.score > best) flags.set(`atividade.${id}.melhor`, r.score);
  }
}

/**
 * Abre a atividade por cima de `from` (normalmente o Mundo) e resolve com o resultado já aplicado.
 * Atividade não registrada resolve com `{ completed: false }` e um aviso no console.
 */
export function runActivity(from: Phaser.Scene, id: string, params: Record<string, FlagValue> = {}): Promise<ActivityResult> {
  const def = registry.get(id);
  if (!def) {
    console.warn(`[atividade] "${id}" não registrada (src/systems/activity/index.ts)`);
    return Promise.resolve({ completed: false });
  }
  return new Promise((resolve) => {
    const pause = def.pauseWorld !== false;
    let done = false;
    const launch: ActivityLaunch = {
      id,
      params,
      state: session.state,
      finish: (result) => {
        if (done) return;
        done = true;
        applyActivityResult(id, result);
        if (from.scene.manager.isActive(def.sceneKey) || from.scene.manager.isPaused(def.sceneKey)) {
          from.scene.manager.stop(def.sceneKey);
        }
        if (pause) from.scene.resume();
        resolve(result);
      },
    };
    if (pause) from.scene.pause();
    from.scene.launch(def.sceneKey, launch);
  });
}
