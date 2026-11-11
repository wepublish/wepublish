import type { z } from 'zod/v4';
import { clearedValue, withoutDefaults } from './cleared-value';
import { isEmptyValue } from './error-keys';
import { joinPath } from './field-path';
import { innermost, isCustomKind } from './kind';
import { isSameValue } from './same-value';
import {
  activeBranch,
  branchDiscriminant,
  branchShape,
  discriminatedUnionOf,
  schemaAt,
  type BranchChoice,
  type Shape,
} from './schema-at';
import { settledDefault } from './settled-default';
import { accepts, defOf, isPlainObject } from './zod-def';

const MAX_DEPTH = 16;

type Absent = { value: null | undefined };

export function absentValue(schema: z.ZodType): Absent | undefined {
  if (isCustomKind(schema)) {
    return undefined;
  }

  const plain = withoutDefaults(schema);

  if (accepts(plain, null)) {
    return { value: null };
  }

  return accepts(plain, undefined) ? { value: undefined } : undefined;
}

function groupShape(schema: z.ZodType, value: unknown): Shape | undefined {
  if (isCustomKind(schema)) {
    return undefined;
  }

  const def = defOf(innermost(schema));

  if (def.type === 'object') {
    return def.shape;
  }

  const branch = activeBranch(schema, value);

  return branch === undefined ? undefined : branchShape(branch);
}

const isGroup = (schema: z.ZodType) =>
  !isCustomKind(schema) &&
  (defOf(innermost(schema)).type === 'object' ||
    discriminatedUnionOf(schema) !== undefined);

function isBlankLeaf(schema: z.ZodType, value: unknown): boolean {
  const fallback = settledDefault(schema);

  if (isEmptyValue(value)) {
    return true;
  }

  return fallback === undefined ?
      Object.is(value, clearedValue(schema))
    : isSameValue(value, fallback.value);
}

type BlankDiscriminant = { key: string; value: unknown };

function blankDiscriminant(schema: z.ZodType): BlankDiscriminant | undefined {
  const union = isCustomKind(schema) ? undefined : discriminatedUnionOf(schema);

  if (union === undefined || absentValue(schema) !== undefined) {
    return undefined;
  }

  return {
    key: union.discriminator,
    value: branchDiscriminant(union.branches[0], union.discriminator),
  };
}

function isBlank(schema: z.ZodType, value: unknown, depth: number): boolean {
  if (value === undefined || value === null) {
    return true;
  }

  const shape = depth > MAX_DEPTH ? undefined : groupShape(schema, value);

  if (shape === undefined && isPlainObject(value) && isGroup(schema)) {
    return Object.values(value).every(isEmptyValue);
  }

  if (shape === undefined || !isPlainObject(value)) {
    return isBlankLeaf(schema, value);
  }

  const discriminant = blankDiscriminant(schema);

  return Object.entries(shape).every(([key, child]) =>
    key === discriminant?.key ?
      isEmptyValue(value[key]) || Object.is(value[key], discriminant.value)
    : isBlank(child, value[key], depth + 1)
  );
}

function collapse(schema: z.ZodType, value: unknown, depth: number): unknown {
  if (depth > MAX_DEPTH || isCustomKind(schema)) {
    return value;
  }

  const def = defOf(innermost(schema));

  if (def.type === 'array') {
    return Array.isArray(value) ?
        value.map(item => collapse(def.element, item, depth + 1))
      : value;
  }

  const shape = groupShape(schema, value);

  if (shape === undefined && isPlainObject(value) && isGroup(schema)) {
    const unchosen = absentValue(schema);

    return unchosen !== undefined && isBlank(schema, value, depth) ?
        unchosen.value
      : value;
  }

  if (shape === undefined || !isPlainObject(value)) {
    return value;
  }

  const collapsed = Object.fromEntries(
    Object.entries(value).map(([key, child]) => [
      key,
      Object.hasOwn(shape, key) ?
        collapse(shape[key], child, depth + 1)
      : child,
    ])
  );
  const absent = absentValue(schema);

  return absent !== undefined && isBlank(schema, collapsed, depth) ?
      absent.value
    : collapsed;
}

export const collapseEmptyGroups = (
  schema: z.ZodType,
  values: unknown
): unknown => collapse(schema, values, 0);

export function insideOptionalGroup(
  root: z.ZodType,
  name: string,
  branches: BranchChoice
): boolean {
  let prefix = '';

  for (const segment of name.split('.').slice(0, -1)) {
    prefix = joinPath(prefix, segment);

    const group = schemaAt(root, prefix, branches);

    if (
      group !== undefined &&
      isGroup(group) &&
      absentValue(group) !== undefined
    ) {
      return true;
    }
  }

  return false;
}
