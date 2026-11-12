import { z } from 'zod';
import type { DialogueScript, Step } from './types';

/**
 * Esquema dos roteiros de content/dialogues/*.json.
 * Objetos são estritos: campo desconhecido (ex.: erro de digitação) é erro.
 */
const direction = z.enum(['down', 'left', 'right', 'up']);
const flagValue = z.union([z.boolean(), z.number(), z.string()]);
const target = z.union([z.tuple([z.number().int(), z.number().int()]), z.string().min(1)]);
const ms = z.number().int().min(0);

const steps: z.ZodType<Step[]> = z.lazy(() => z.array(step));

const step: z.ZodType<Step> = z.lazy(() =>
  z.discriminatedUnion('type', [
    z
      .object({
        type: z.literal('say'),
        speaker: z.string().optional(),
        name: z.string().optional(),
        portrait: z.string().optional(),
        text: z.string().min(1),
        speed: z.number().positive().optional(),
        auto: ms.optional(),
      })
      .strict(),
    z
      .object({
        type: z.literal('choice'),
        prompt: z.string().optional(),
        speaker: z.string().optional(),
        options: z
          .array(
            z
              .object({
                text: z.string().min(1),
                goto: z.string().optional(),
                steps: steps.optional(),
                if: z.string().optional(),
              })
              .strict(),
          )
          .min(1),
      })
      .strict(),
    z.object({ type: z.literal('label'), name: z.string().min(1) }).strict(),
    z.object({ type: z.literal('goto'), label: z.string().min(1) }).strict(),
    z
      .object({
        type: z.literal('if'),
        flag: z.string().optional(),
        equals: flagValue.optional(),
        cond: z.string().optional(),
        goto: z.string().optional(),
        then: steps.optional(),
        else: z.union([z.string(), steps]).optional(),
      })
      .strict(),
    z
      .object({
        type: z.literal('flag'),
        set: z.string().optional(),
        value: flagValue.optional(),
        clear: z.string().optional(),
        add: z.string().optional(),
        by: z.number().optional(),
      })
      .strict(),
    z
      .object({
        type: z.literal('move'),
        actor: z.string().min(1),
        to: target,
        speed: z.number().positive().optional(),
        wait: z.boolean().optional(),
        facing: direction.optional(),
      })
      .strict(),
    z
      .object({ type: z.literal('face'), actor: z.string().min(1), dir: direction.optional(), to: z.string().optional() })
      .strict(),
    z
      .object({
        type: z.literal('emote'),
        actor: z.string().min(1),
        emote: z.string().min(1),
        ms: ms.optional(),
        wait: z.boolean().optional(),
      })
      .strict(),
    z.object({ type: z.literal('wait'), ms }).strict(),
    z.object({ type: z.literal('sfx'), id: z.string().min(1), volume: z.number().min(0).max(1).optional() }).strict(),
    z
      .object({
        type: z.literal('music'),
        id: z.string().min(1).nullable(),
        fadeMs: ms.optional(),
        volume: z.number().min(0).max(1).optional(),
      })
      .strict(),
    z
      .object({ type: z.literal('shake'), ms, intensity: z.number().min(0).max(0.2).optional(), wait: z.boolean().optional() })
      .strict(),
    z
      .object({
        type: z.literal('fade'),
        to: z.union([z.enum(['black', 'white', 'clear']), z.string().regex(/^#[0-9a-fA-F]{6}$/)]),
        ms: ms.optional(),
      })
      .strict(),
    z
      .object({
        type: z.literal('camera'),
        to: target.optional(),
        follow: z.string().optional(),
        zoom: z.number().positive().max(8).optional(),
        ms: ms.optional(),
        wait: z.boolean().optional(),
      })
      .strict(),
    z
      .object({
        type: z.literal('spawn'),
        actor: z.string().min(1),
        sprite: z.string().optional(),
        at: target,
        facing: direction.optional(),
      })
      .strict(),
    z.object({ type: z.literal('despawn'), actor: z.string().min(1) }).strict(),
    z
      .object({
        type: z.literal('scene'),
        map: z.string().optional(),
        at: target.optional(),
        facing: direction.optional(),
        scene: z.string().optional(),
      })
      .strict(),
    z.object({ type: z.literal('end') }).strict(),
    z.object({ type: z.literal('checkpoint'), at: target.optional() }).strict(),
    z.object({ type: z.literal('autosave') }).strict(),
    z.object({ type: z.literal('call'), id: z.string().min(1) }).strict(),
  ]).superRefine((s, ctx) => {
    const fail = (message: string) => ctx.addIssue({ code: z.ZodIssueCode.custom, message });
    switch (s.type) {
      case 'if':
        if (!!s.flag === !!s.cond) fail('`if` precisa de `flag` OU `cond` (um dos dois)');
        if (s.goto && s.then) fail('`if` usa `goto` OU `then`, não os dois');
        if (!s.goto && !s.then) fail('`if` precisa de `goto` ou `then`');
        break;
      case 'flag':
        if (!s.set && !s.clear && !s.add) fail('`flag` precisa de `set`, `clear` ou `add`');
        break;
      case 'face':
        if (!!s.dir === !!s.to) fail('`face` precisa de `dir` OU `to`');
        break;
      case 'camera':
        if (s.to === undefined && !s.follow && s.zoom === undefined) fail('`camera` precisa de `to`, `follow` ou `zoom`');
        break;
      case 'scene':
        if (!!s.map === !!s.scene) fail('`scene` precisa de `map` OU `scene`');
        break;
      default:
        break;
    }
  }),
) as unknown as z.ZodType<Step>;

export const dialogueSchema = z
  .object({
    id: z.string().min(1),
    description: z.string().optional(),
    steps: z.array(step).min(1),
  })
  .strict() as unknown as z.ZodType<DialogueScript>;

export interface ValidationResult {
  ok: boolean;
  errors: string[];
  script?: DialogueScript;
}

/**
 * Valida estrutura (zod) + semântica: labels únicos e só no nível principal,
 * todo `goto` aponta para label existente, `call` aponta para roteiro conhecido (se informado).
 */
export function validateDialogue(json: unknown, knownIds?: ReadonlySet<string>): ValidationResult {
  const parsed = dialogueSchema.safeParse(json);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map((i) => `${i.path.join('.') || '(raiz)'}: ${i.message}`),
    };
  }
  const script = parsed.data;
  const errors: string[] = [];
  const labels = new Set<string>();
  script.steps.forEach((s, i) => {
    if (s.type === 'label') {
      if (labels.has(s.name)) errors.push(`steps.${i}: label duplicado "${s.name}"`);
      labels.add(s.name);
    }
  });

  const checkTarget = (label: string | undefined, path: string) => {
    if (label !== undefined && !labels.has(label)) errors.push(`${path}: label "${label}" não existe`);
  };

  const walk = (list: Step[], path: string, nested: boolean) => {
    list.forEach((s, i) => {
      const p = `${path}.${i}`;
      switch (s.type) {
        case 'label':
          if (nested) errors.push(`${p}: labels só podem ficar na lista principal de steps`);
          break;
        case 'goto':
          checkTarget(s.label, p);
          break;
        case 'choice':
          s.options.forEach((o, j) => {
            checkTarget(o.goto, `${p}.options.${j}`);
            if (o.goto && o.steps) errors.push(`${p}.options.${j}: use goto OU steps`);
            if (o.steps) walk(o.steps, `${p}.options.${j}.steps`, true);
          });
          break;
        case 'if':
          checkTarget(s.goto, p);
          if (typeof s.else === 'string') checkTarget(s.else, `${p}.else`);
          if (s.then) walk(s.then, `${p}.then`, true);
          if (Array.isArray(s.else)) walk(s.else, `${p}.else`, true);
          break;
        case 'call':
          if (knownIds && !knownIds.has(s.id)) errors.push(`${p}: roteiro "${s.id}" não existe`);
          break;
        default:
          break;
      }
    });
  };
  walk(script.steps, 'steps', false);

  return errors.length ? { ok: false, errors } : { ok: true, errors, script };
}
