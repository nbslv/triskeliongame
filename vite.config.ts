/// <reference types="vitest" />
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig, loadEnv, type Plugin } from 'vite';

/**
 * Ícones e manifest de PWA ("adicionar à tela inicial" no celular, em paisagem).
 * Os ícones vêm de assets/icons/ (arte) e são servidos/copiados em `icons/` com nomes fixos,
 * porque o manifest precisa de caminhos estáveis.
 */
function pwa(): Plugin {
  const iconsDir = join(process.cwd(), 'assets', 'icons');
  const icons = () => (existsSync(iconsDir) ? readdirSync(iconsDir).filter((f) => f.endsWith('.png')) : []);
  const manifest = () =>
    JSON.stringify(
      {
        name: 'Triskelion',
        short_name: 'Triskelion',
        lang: 'pt-BR',
        start_url: './',
        scope: './',
        display: 'fullscreen',
        orientation: 'landscape',
        background_color: '#0b0a12',
        theme_color: '#0b0a12',
        icons: icons()
          .map((f) => ({ f, size: Number(/_(\d+)\.png$/.exec(f)?.[1] ?? 0) }))
          .filter(({ size }) => size >= 64)
          .map(({ f, size }) => ({ src: `icons/${f}`, sizes: `${size}x${size}`, type: 'image/png', purpose: 'any' })),
      },
      null,
      1,
    );
  return {
    name: 'triskelion-pwa',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url ?? '').split('?')[0]!;
        if (url.endsWith('/manifest.webmanifest')) {
          res.setHeader('Content-Type', 'application/manifest+json');
          res.end(manifest());
          return;
        }
        const m = /\/icons\/([\w.-]+\.png)$/.exec(url);
        if (m && existsSync(join(iconsDir, m[1]!))) {
          res.setHeader('Content-Type', 'image/png');
          res.end(readFileSync(join(iconsDir, m[1]!)));
          return;
        }
        next();
      });
    },
    generateBundle() {
      for (const f of icons()) this.emitFile({ type: 'asset', fileName: `icons/${f}`, source: readFileSync(join(iconsDir, f)) });
      this.emitFile({ type: 'asset', fileName: 'manifest.webmanifest', source: manifest() });
    },
  };
}

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
    plugins: [pwa()],
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
      rollupOptions: {
        output: {
          // Phaser em chunk próprio: muda raramente, então o navegador reaproveita o cache.
          manualChunks: { phaser: ['phaser'] },
        },
      },
    },
    test: {
      include: ['tests/**/*.test.ts'],
      environment: 'node',
    },
  };
});
