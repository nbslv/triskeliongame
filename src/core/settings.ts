import { bus } from './events';

export interface Settings {
  musicVolume: number; // 0..1
  sfxVolume: number; // 0..1
  textSpeed: number; // caracteres por segundo
  fullscreenOnTouch: boolean;
}

const KEY = 'triskelion.settings';
const DEFAULTS: Settings = { musicVolume: 0.6, sfxVolume: 0.8, textSpeed: 45, fullscreenOnTouch: true };

function load(): Settings {
  try {
    const raw = globalThis.localStorage?.getItem(KEY);
    if (raw) return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch {
    /* sem armazenamento */
  }
  return { ...DEFAULTS };
}

export const settings: Settings = load();

export function updateSettings(patch: Partial<Settings>): void {
  Object.assign(settings, patch);
  try {
    globalThis.localStorage?.setItem(KEY, JSON.stringify(settings));
  } catch {
    /* ignora */
  }
  bus.emit('settings:changed', {});
}
