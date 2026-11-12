# Triskelion

RPG de aventura e exploração com batalhas por turnos, em português (PT-BR), para navegador
(celular na horizontal + desktop).

> Projeto privado. Não divulgar o link de jogo publicado.

- Coordenação, decisões e divisão de trabalho: [`docs/COORDENACAO.md`](docs/COORDENACAO.md)
- Briefing original da história: [`docs/BRIEFING_ORIGINAL.md`](docs/BRIEFING_ORIGINAL.md)

## Como rodar

Requisitos: Node.js 20+ (testado com 22).

```bash
npm install
npm run dev          # servidor local; abre em http://localhost:5173 (e na rede local, para testar no celular)
npm test             # testes (executor de diálogo, save/flags, esquema) + validação de content/
npm run typecheck    # TypeScript estrito
npm run build        # gera dist/ (estático, caminhos relativos)
npm run preview      # serve o dist/
```

Senha de entrada (opcional): copie `.env.example` para `.env.local` e defina `VITE_GAME_PASSWORD`.
Sem ela, a tela de senha é pulada. É uma proteção leve; detalhes em
[`docs/tecnico/ARQUITETURA.md`](docs/tecnico/ARQUITETURA.md#senha-de-entrada-proteção-leve).

Controles: joystick na metade esquerda da tela + botões A/B/☰ (toque); no teclado, setas/WASD,
Z/Enter = A, X/Shift = B (correr), Esc/M = menu.

Teste automatizado no navegador (celular horizontal com toque, Playwright):

```bash
VITE_GAME_PASSWORD=teste123 npm run build && npx vite preview --port 4173 &
SENHA=teste123 node scripts/testar-navegador.mjs http://localhost:4173/ docs/tecnico/capturas
```

Documentação técnica: [arquitetura](docs/tecnico/ARQUITETURA.md) ·
[diálogos](docs/tecnico/DIALOGO.md) · [mapas](docs/tecnico/MAPAS.md).
