/// <reference types="vitest" />
import { createHash } from 'node:crypto';
import { defineConfig, loadEnv } from 'vite';

/**
 * Senha de entrada (proteção LEVE):
 * - Defina VITE_GAME_PASSWORD (texto) ou VITE_GAME_PASSWORD_HASH (SHA-256 em hex) num `.env.local`.
 * - O texto da senha NUNCA vai para o bundle: aqui calculamos o hash no build e só o hash é embutido.
 * - Sem nenhuma das duas variáveis, a tela de senha é pulada (útil em desenvolvimento).
 * A proteção forte (autenticação no servidor/CDN) é responsabilidade da frente de deploy.
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const plain = env.VITE_GAME_PASSWORD ?? '';
  const hash = (env.VITE_GAME_PASSWORD_HASH ?? '').trim().toLowerCase()
    || (plain ? createHash('sha256').update(plain, 'utf8').digest('hex') : '');

  return {
    base: './',
    define: {
      __GAME_PASSWORD_HASH__: JSON.stringify(hash),
      __GAME_VERSION__: JSON.stringify(process.env.npm_package_version ?? 'dev'),
    },
    server: { host: true },
    preview: { host: true },
    build: {
      target: 'es2020',
      assetsInlineLimit: 0,
      chunkSizeWarningLimit: 2000,
    },
    test: {
      include: ['tests/**/*.test.ts'],
      environment: 'node',
    },
  };
});
