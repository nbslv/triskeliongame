// Gera todos os mapas do Prólogo em content/maps/. Uso: node tools/mapas/gerar.mjs
import { casaIcaro, casaCustodia, padaria, biblioteca } from './interiores.mjs';
import { cafezal, estrada, tunel, bambuzal } from './abertos.mjs';
const fabricas = [casaIcaro, casaCustodia, padaria, biblioteca, cafezal, estrada, tunel, bambuzal];
const extras = process.argv.slice(2);
for (const f of fabricas) {
  const m = f();
  m.salvar();
  console.log('gerado', m.id, `${m.w}x${m.h}`);
}
