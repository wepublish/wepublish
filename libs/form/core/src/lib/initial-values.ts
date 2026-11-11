import type { z } from 'zod/v4';
import { clearedValue } from './cleared-value';
import { absentValue } from './empty-groups';
import { innermost, isCustomKind, schemaLayers } from './kind';
import {
  branchDiscriminant,
  branchShape,
  discriminatedUnionOf,
  findBranch,
  type DiscriminatedUnion,
  type Shape,
} from './schema-at';
import { settledDefault } from './settled-default';
import { snapshotValues } from './snapshot-values';
import { defOf, isPlainObject, type SchemaDef } from './zod-def';

const MAX_DEPTH = 16;

type DefaultDef = Extract<SchemaDef, { defaultValue: unknown }>;

type Walk = {
  depth: number;
  ancestors: ReadonlySet<z.ZodType>;
  blank: boolean;
};

const START: Walk = { depth: 0, ancestors: new Set(), blank: false };

const isContainer = (schema: z.ZodType) =>
  !isCustomKind(schema) &&
  (defOf(innermost(schema)).type === 'object' ||
    discriminatedUnionOf(schema) !== undefined);

const isRecursive = (schema: z.ZodType, walk: Walk) =>
  schemaLayers(schema).some(layer => walk.ancestors.has(layer));

const expandsWhenAbsent = (schema: z.ZodType, walk: Walk) =>
  discriminatedUnionOf(schema) === undefined && !isRecursive(schema, walk);

const enter = (schema: z.ZodType, walk: Walk): Walk => ({
  depth: walk.depth + 1,
  ancestors: new Set([...walk.ancestors, ...schemaLayers(schema)]),
  blank: walk.blank || absentValue(schema) !== undefined,
});

const itemWalk = (walk: Walk): Walk => ({
  ...walk,
  depth: walk.depth + 1,
  blank: false,
});

export const emptyValues = (schema: z.ZodType): unknown =>
  computeEmpty(schema, START);

export const branchEmpty = (
  branch: z.ZodType,
  discriminator: string
): Record<string, unknown> => computeBranchEmpty(branch, discriminator, START);

export const mergeValues = (
  schema: z.ZodType,
  base: unknown,
  loaded: unknown
): unknown => merge(schema, base, loaded, START);

function computeEmpty(schema: z.ZodType, walk: Walk): unknown {
  const def = defOf(schema);

  if (def.type === 'default' || def.type === 'prefault') {
    return computeDefault(schema, def, walk);
  }

  if (walk.depth > MAX_DEPTH || !isContainer(schema)) {
    return clearedValue(schema);
  }

  const absent = absentValue(schema);

  if (absent !== undefined && !expandsWhenAbsent(schema, walk)) {
    return absent.value;
  }

  return expandGroup(schema, walk);
}

function computeDefault(
  schema: z.ZodType,
  def: DefaultDef,
  walk: Walk
): unknown {
  if (walk.blank && isContainer(schema)) {
    return computeEmpty(def.innerType, walk);
  }

  const defaultValue =
    walk.blank ?
      snapshotValues(settledDefault(schema)?.value)
    : def.defaultValue;

  return isCustomKind(schema) ? defaultValue : (
      merge(
        def.innerType,
        computeEmpty(def.innerType, walk),
        defaultValue,
        walk
      )
    );
}

function expandGroup(schema: z.ZodType, walk: Walk): unknown {
  const inner = enter(schema, walk);
  const union = discriminatedUnionOf(schema);

  if (union) {
    return computeBranchEmpty(union.branches[0], union.discriminator, inner);
  }

  return Object.fromEntries(
    Object.entries(branchShape(schema) ?? {}).map(([key, child]) => [
      key,
      computeEmpty(child, inner),
    ])
  );
}

function computeBranchEmpty(
  branch: z.ZodType,
  discriminator: string,
  walk: Walk
): Record<string, unknown> {
  const value = computeEmpty(branch, walk);

  return {
    ...(isPlainObject(value) ? value : {}),
    [discriminator]: branchDiscriminant(branch, discriminator),
  };
}

function merge(
  schema: z.ZodType,
  base: unknown,
  loaded: unknown,
  walk: Walk
): unknown {
  if (loaded === undefined) {
    return base;
  }

  if (walk.depth > MAX_DEPTH || isCustomKind(schema)) {
    return loaded;
  }

  if (loaded === null) {
    return mergeNull(schema, base, walk);
  }

  const union = discriminatedUnionOf(schema);

  if (union) {
    return mergeUnion(schema, union, base, loaded, walk);
  }

  const def = defOf(innermost(schema));

  if (def.type === 'array') {
    const item = itemWalk(walk);

    return Array.isArray(loaded) && isContainer(def.element) ?
        loaded.map(value =>
          merge(def.element, computeEmpty(def.element, item), value, item)
        )
      : loaded;
  }

  if (def.type === 'object' && isPlainObject(loaded)) {
    const start = isPlainObject(base) ? base : expandGroup(schema, walk);

    return mergeShape(def.shape, start, loaded, enter(schema, walk));
  }

  return loaded;
}

function mergeNull(schema: z.ZodType, base: unknown, walk: Walk): unknown {
  const expands =
    defOf(innermost(schema)).type === 'object' &&
    absentValue(schema) !== undefined &&
    !isRecursive(schema, walk);

  if (!expands) {
    return null;
  }

  return isPlainObject(base) ? base : expandGroup(schema, walk);
}

function mergeUnion(
  schema: z.ZodType,
  union: DiscriminatedUnion,
  base: unknown,
  loaded: unknown,
  walk: Walk
) {
  if (!isPlainObject(loaded)) {
    return loaded;
  }

  const baseDiscriminant =
    isPlainObject(base) ? base[union.discriminator] : undefined;
  const discriminant = loaded[union.discriminator] ?? baseDiscriminant;
  const branch = findBranch(union, discriminant);

  if (!branch) {
    return loaded;
  }

  const inner = enter(schema, walk);
  const start =
    baseDiscriminant !== undefined && baseDiscriminant === discriminant ?
      base
    : computeBranchEmpty(branch, union.discriminator, inner);

  return mergeShape(branchShape(branch) ?? {}, start, loaded, inner);
}

function mergeShape(
  shape: Shape,
  start: unknown,
  loaded: Record<string, unknown>,
  walk: Walk
): Record<string, unknown> {
  const startValues = isPlainObject(start) ? start : {};

  return Object.fromEntries(
    Object.entries(shape).map(([key, child]) => [
      key,
      merge(child, startValues[key], loaded[key], walk),
    ])
  );
}
