import { RESUME_SLOT } from './save';
import { session } from './session';

/**
 * Save de RETOMADA: gravado quando a aba é ocultada ou fechada, para o jogador
 * nunca perder mais que alguns segundos (complementa o autosave de ~60 s).
 * No celular, `visibilitychange`→hidden e `pagehide` são os eventos confiáveis;
 * `beforeunload` fica só como reforço.
 */
let installed = false;
let lastWrite = 0;

export function writeResumeSave(): void {
  if (!session.active) return;
  const now = Date.now();
  if (now - lastWrite < 250) return; // vários eventos seguidos ao fechar
  lastWrite = now;
  session.save(RESUME_SLOT);
}

export function installResumeHandlers(): void {
  if (installed) return;
  installed = true;
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') writeResumeSave();
  });
  window.addEventListener('pagehide', writeResumeSave);
  window.addEventListener('beforeunload', writeResumeSave);
  window.addEventListener('freeze', writeResumeSave);
}
