import { z } from 'zod/v4';
import { joinPath } from './field-path';
import { innermost, isCustomKind } from './kind';
import { fieldMeta, withDerivedMeta } from './meta';
import { accepts, defOf, isPlainObject } from './zod-def';

export type Shape = Readonly<Record<string, z.ZodType>>;

export type BranchChoice = Readonly<Partial<Record<string, unknown>>>;

export type DiscriminatedUnion = {
  inner: z.ZodType;
  discriminator: string;
  branches: readonly z.ZodType[];
};

const NO_CHOICE: BranchChoice = {};

const discriminatorSchemas = new WeakMap<z.ZodType, z.ZodType>();

const isDefined = <T>(value: T | undefined): value is T => value !== undefined;

export const branchShape = (branch: z.ZodType): Shape | undefined => {
  const def = defOf(innermost(branch));

  return def.type === 'object' ? def.shape : undefined;
};

export const discriminatedUnionOf = (
  schema: z.ZodType
): DiscriminatedUnion | undefined => {
  const inner = innermost(schema);
  const def = defOf(inner);

  if (def.type !== 'union' || def.discriminator === undefined) {
    return undefined;
  }

  return { inner, discriminator: def.discriminator, branches: def.options };
};

export const branchDiscriminant = (
  branch: z.ZodType,
  discriminator: string
): unknown => {
  const literal = branchShape(branch)?.[discriminator];
  const [discriminant] =
    literal ? [...(innermost(literal)._zod.values ?? [])] : [];

  return discriminant;
};

export const findBranch = (
  union: DiscriminatedUnion,
  discriminant: unknown
) => {
  if (discriminant === undefined) {
    return undefined;
  }

  return union.branches.find(branch => {
    const literal = branchShape(branch)?.[union.discriminator];

    return literal !== undefined && accepts(literal, discriminant);
  });
};

export function activeBranch(
  schema: z.ZodType,
  value: unknown
): z.ZodType | undefined {
  const union = discriminatedUnionOf(schema);

  if (!union || !isPlainObject(value)) {
    return undefined;
  }

  return findBranch(union, value[union.discriminator]);
}

function discriminatorSchema(union: DiscriminatedUnion): z.ZodType {
  const cached = discriminatorSchemas.get(union.inner);

  if (cached) {
    return cached;
  }

  const literals = union.branches
    .map(branch => branchShape(branch)?.[union.discriminator])
    .filter(isDefined);
  const meta = literals
    .map(fieldMeta)
    .find(found => Object.keys(found).length > 0);
  const created = withDerivedMeta(z.union(literals), meta ?? {});

  discriminatorSchemas.set(union.inner, created);

  return created;
}

function branchShapes(
  union: DiscriminatedUnion,
  discriminant: unknown
): (Shape | undefined)[] {
  const active = findBranch(union, discriminant);

  return active ? [branchShape(active)] : union.branches.map(branchShape);
}

function childSchema(
  parent: z.ZodType,
  segment: string,
  discriminant: unknown
): z.ZodType | undefined {
  const inner = innermost(parent);
  const def = defOf(inner);

  if (def.type === 'array') {
    return segment === '*' || /^\d+$/.test(segment) ? def.element : undefined;
  }

  if (def.type === 'object') {
    return Object.hasOwn(def.shape, segment) ? def.shape[segment] : undefined;
  }

  const union = discriminatedUnionOf(inner);

  if (!union) {
    return undefined;
  }

  if (segment === union.discriminator) {
    return discriminatorSchema(union);
  }

  return branchShapes(union, discriminant).find(
    shape => shape !== undefined && Object.hasOwn(shape, segment)
  )?.[segment];
}

export function schemaAt(
  schema: z.ZodType,
  path: string,
  branches: BranchChoice = NO_CHOICE
): z.ZodType | undefined {
  if (path === '') {
    return schema;
  }

  let current: z.ZodType | undefined = schema;
  let prefix = '';

  for (const segment of path.split('.')) {
    if (!current || isCustomKind(current)) {
      return undefined;
    }

    current = childSchema(current, segment, branches[prefix]);
    prefix = joinPath(prefix, segment);
  }

  return current;
}

export function topLevelKeys(schema: z.ZodType): string[] {
  const def = defOf(innermost(schema));

  if (def.type === 'object') {
    return Object.keys(def.shape);
  }

  const union = discriminatedUnionOf(schema);

  if (!union) {
    return [];
  }

  const keys = union.branches.flatMap(branch =>
    Object.keys(branchShape(branch) ?? {})
  );

  return [...new Set([union.discriminator, ...keys])];
}
