import { registerActivity } from './registry';

/**
 * Registro das atividades do jogo (lojas, treinos, minijogos).
 * Adicione aqui: registerActivity('<id usado no Tiled/roteiro>', { sceneKey: '<chave da cena>' }).
 */
export function registerAllActivities(): void {
  registerActivity('teste', { sceneKey: 'AtividadeTeste' });
}

export * from './registry';
