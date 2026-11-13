import { flags } from './flags';

/**
 * Período do dia (contrato da narrativa, docs/status/narrativa.md §5): exatamente uma das flags
 * `periodo.manha`, `periodo.tarde`, `periodo.noite` fica ligada. Os mapas definem pela propriedade `periodo`.
 */
export const PERIODS = ['manha', 'tarde', 'noite'] as const;

/** Liga `periodo.<p>` e apaga os outros dois. */
export function setPeriod(p: string): void {
  const v = p.toLowerCase().replace('manhã', 'manha');
  if (!(PERIODS as readonly string[]).includes(v)) {
    console.warn(`[mundo] periodo "${p}" inválido (use manha, tarde ou noite)`);
    return;
  }
  // Dois formatos em sincronia: flag com valor (`periodo == noite`) e flags booleanas (`periodo.noite`).
  flags.set('periodo', v);
  for (const q of PERIODS) {
    if (q === v) flags.set(`periodo.${q}`, true);
    else if (flags.has(`periodo.${q}`)) flags.clear(`periodo.${q}`);
  }
}

export function currentPeriod(): string | undefined {
  return PERIODS.find((q) => flags.isSet(`periodo.${q}`));
}

