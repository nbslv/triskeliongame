import { sha256Hex } from './sha256';

/**
 * Proteção LEVE por senha, no cliente. O hash vem do build (vite.config.ts).
 * Qualquer pessoa com o bundle pode contornar isto; serve só para afastar curiosos.
 * A proteção forte (ex.: autenticação básica/Cloudflare Access no servidor) é do deploy.
 */
const UNLOCK_KEY = 'triskelion.unlock';

export function passwordHash(): string {
  return typeof __GAME_PASSWORD_HASH__ === 'string' ? __GAME_PASSWORD_HASH__ : '';
}

export function passwordRequired(): boolean {
  if (!passwordHash()) return false;
  try {
    return globalThis.localStorage?.getItem(UNLOCK_KEY) !== passwordHash();
  } catch {
    return true;
  }
}

export function checkPassword(input: string, expectedHash = passwordHash()): boolean {
  return sha256Hex(input.trim()) === expectedHash;
}

export function rememberUnlock(): void {
  try {
    globalThis.localStorage?.setItem(UNLOCK_KEY, passwordHash());
  } catch {
    /* ignora */
  }
}
