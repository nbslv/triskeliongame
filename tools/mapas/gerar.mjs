// Gera todos os mapas do Prólogo em content/maps/. Uso: node tools/mapas/gerar.mjs
import { casaIcaro, casaCustodia, padaria, biblioteca } from './interiores.mjs';
const fabricas = [casaIcaro, casaCustodia, padaria, biblioteca];
const extras = process.argv.slice(2);
for (const f of fabricas) {
  const m = f();
  m.salvar();
  console.log('gerado', m.id, `${m.w}x${m.h}`);
}
