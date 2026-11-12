import { bus, type FlagValue } from './events';

/**
 * Flags de história. Chaves com ponto, por convenção `<capitulo>.<fato>`
 * (ex.: "prologo.encontrou_pai"). Valores: boolean, número ou texto.
 */
export class FlagStore {
  private values = new Map<string, FlagValue>();

  constructor(private readonly notify = true) {}

  get(key: string): FlagValue | undefined {
    return this.values.get(key);
  }

  has(key: string): boolean {
    return this.values.has(key);
  }

  /** Verdadeiro se a flag existe e não é false/0/"". */
  isSet(key: string): boolean {
    const v = this.values.get(key);
    return v !== undefined && v !== false && v !== 0 && v !== '';
  }

  set(key: string, value: FlagValue = true): void {
    this.values.set(key, value);
    if (this.notify) bus.emit('flag:changed', { key, value });
  }

  add(key: string, by = 1): number {
    const cur = this.values.get(key);
    const next = (typeof cur === 'number' ? cur : 0) + by;
    this.set(key, next);
    return next;
  }

  clear(key: string): void {
    this.values.delete(key);
    if (this.notify) bus.emit('flag:changed', { key, value: undefined });
  }

  reset(): void {
    this.values.clear();
  }

  toJSON(): Record<string, FlagValue> {
    return Object.fromEntries(this.values);
  }

  load(data: Record<string, FlagValue> | undefined): void {
    this.values.clear();
    if (!data) return;
    for (const [k, v] of Object.entries(data)) {
      if (typeof v === 'boolean' || typeof v === 'number' || typeof v === 'string') this.values.set(k, v);
    }
  }
}

/**
 * Avalia uma condição textual sobre as flags. Gramática (sem parênteses):
 *   expr  := and ( '||' and )*
 *   and   := term ( '&&' term )*
 *   term  := '!'? chave | chave OP valor
 *   OP    := == != >= <= > <
 *   valor := número | true | false | texto (com ou sem aspas)
 * Ex.: "prologo.encontrou_pai && !prologo.fugiu", "prologo.tentativas >= 3".
 */
export function evaluateCondition(expr: string, flags: Pick<FlagStore, 'get' | 'isSet'>): boolean {
  return expr.split('||').some((orPart) =>
    orPart.split('&&').every((term) => evaluateTerm(term.trim(), flags)),
  );
}

const COMPARISON = /^([^\s!=<>]+)\s*(==|!=|>=|<=|>|<)\s*(.+)$/;

function parseLiteral(raw: string): FlagValue {
  const s = raw.trim();
  if (s === 'true') return true;
  if (s === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
  return s.replace(/^["']|["']$/g, '');
}

function evaluateTerm(term: string, flags: Pick<FlagStore, 'get' | 'isSet'>): boolean {
  if (!term) throw new Error('Condição vazia');
  const m = COMPARISON.exec(term);
  if (m) {
    const [, key, op, rawVal] = m;
    const left = flags.get(key!);
    const right = parseLiteral(rawVal!);
    switch (op) {
      case '==':
        return (left ?? false) === right;
      case '!=':
        return (left ?? false) !== right;
      default: {
        const l = typeof left === 'number' ? left : 0;
        const r = typeof right === 'number' ? right : Number.NaN;
        if (op === '>=') return l >= r;
        if (op === '<=') return l <= r;
        if (op === '>') return l > r;
        return l < r;
      }
    }
  }
  if (term.startsWith('!')) return !flags.isSet(term.slice(1).trim());
  return flags.isSet(term);
}

/** Flags globais da partida atual. */
export const flags = new FlagStore();
