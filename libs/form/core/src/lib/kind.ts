import type { z } from 'zod/v4';
import type { Kinded } from './kind-types';
import { defOf, isEmptyStringLiteral, isWrapperDef } from './zod-def';

export const FORM_KIND = '~formKind';

export type KindMark = { kind: string; params?: unknown };

export type ResolvedKind = {
  kind: string;
  custom: boolean;
  params?: unknown;
  inner: z.ZodType;
};

const MAX_DEPTH = 32;

export function withKind<
  S extends z.ZodType,
  const K extends string,
  P = undefined,
>(schema: S, kind: K, params?: P): Kinded<S, K, P> {
  const def: S['_zod']['def'] = Object.create(
    Object.getPrototypeOf(schema._zod.def),
    Object.getOwnPropertyDescriptors(schema._zod.def)
  );
  const mark: KindMark = { kind, params };

  Object.defineProperty(def, FORM_KIND, { value: mark, enumerable: true });

  return schema.clone(def, { parent: true }) as Kinded<S, K, P>;
}

export function unwrapStep(schema: z.ZodType): z.ZodType | undefined {
  const def = defOf(schema);

  if (isWrapperDef(def)) {
    return def.innerType;
  }

  if (def.type === 'pipe') {
    return defOf(def.in).type === 'transform' ? def.out : def.in;
  }

  if (def.type === 'lazy') {
    return def.getter();
  }

  return undefined;
}

export function innermost(schema: z.ZodType): z.ZodType {
  let current = schema;

  for (let depth = 0; depth < MAX_DEPTH; depth++) {
    const next = unwrapStep(current);

    if (!next) {
      break;
    }

    current = next;
  }

  return current;
}

const emptyStringUnionBranch = (schema: z.ZodType): z.ZodType | undefined => {
  const def = defOf(schema);

  if (def.type !== 'union' || def.discriminator !== undefined) {
    return undefined;
  }

  const real = def.options.filter(
    option => !isEmptyStringLiteral(innermost(option))
  );

  return real.length === 1 ? real[0] : undefined;
};

const nextLayer = (schema: z.ZodType) =>
  unwrapStep(schema) ?? emptyStringUnionBranch(schema);

export function schemaLayers(schema: z.ZodType): z.ZodType[] {
  const layers = [schema];

  for (
    let current = nextLayer(schema);
    current && layers.length < MAX_DEPTH;
    current = nextLayer(current)
  ) {
    layers.push(current);
  }

  return layers;
}

export const valueSchema = (schema: z.ZodType): z.ZodType => {
  const layers = schemaLayers(schema);

  return layers[layers.length - 1];
};

export const kindMark = (schema: z.ZodType): KindMark | undefined => {
  const def: { type: string; readonly [FORM_KIND]?: KindMark } =
    schema._zod.def;

  return def[FORM_KIND];
};

export const isCustomKind = (schema: z.ZodType) =>
  schemaLayers(schema).some(layer => kindMark(layer) !== undefined);

export function resolveKind(schema: z.ZodType): ResolvedKind | undefined {
  return resolve(schema, 0);
}

function resolve(schema: z.ZodType, depth: number): ResolvedKind | undefined {
  if (depth > MAX_DEPTH) {
    return undefined;
  }

  const layers = schemaLayers(schema);
  const inner = layers[layers.length - 1];
  const mark = layers.map(kindMark).find(found => found !== undefined);

  if (mark) {
    return { kind: mark.kind, custom: true, params: mark.params, inner };
  }

  const kind = structuralKind(inner, depth);

  return kind === undefined ? undefined : { kind, custom: false, inner };
}

const isLiteralLike = (schema: z.ZodType) => {
  const type = defOf(schema).type;

  return type === 'literal' || type === 'enum';
};

function structuralKind(schema: z.ZodType, depth: number): string | undefined {
  const def = defOf(schema);

  switch (def.type) {
    case 'string':
    case 'number':
    case 'boolean':
    case 'date':
      return def.type;
    case 'enum':
    case 'literal':
      return 'enum';
    case 'object':
      return 'object';
    case 'union':
      if (def.discriminator !== undefined) {
        return 'discriminatedUnion';
      }

      return def.options.every(isLiteralLike) ? 'enum' : undefined;
    case 'array':
      return arrayKind(def.element, depth + 1);
    default:
      return undefined;
  }
}

function arrayKind(element: z.ZodType, depth: number): string | undefined {
  const resolved = resolve(element, depth);

  if (!resolved) {
    return undefined;
  }

  if (
    resolved.custom ||
    resolved.kind === 'object' ||
    resolved.kind === 'discriminatedUnion'
  ) {
    return 'array';
  }

  if (resolved.kind === 'enum') {
    return 'enumArray';
  }

  return resolved.kind === 'string' ? 'primitiveArray' : undefined;
}
