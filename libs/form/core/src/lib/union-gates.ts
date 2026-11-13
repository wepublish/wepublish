import type { z } from 'zod/v4';
import { joinPath, resolvePath, type ItemScope } from './field-path';
import {
  branchShape,
  discriminatedUnionOf,
  findBranch,
  schemaAt,
  type BranchChoice,
  type DiscriminatedUnion,
} from './schema-at';

export type UnionGate = {
  union: DiscriminatedUnion;
  unionName: string;
  discriminatorPath: string;
  key: string;
};

export function unionGates(
  schema: z.ZodType,
  name: string,
  scope: ItemScope
): UnionGate[] {
  const gates: UnionGate[] = [];
  let prefix = '';

  for (const segment of name.split('.')) {
    const parent = schemaAt(schema, prefix);
    const union =
      parent === undefined ? undefined : discriminatedUnionOf(parent);

    if (union !== undefined && segment !== union.discriminator) {
      gates.push({
        union,
        unionName: prefix,
        discriminatorPath: resolvePath(
          joinPath(prefix, union.discriminator),
          scope
        ),
        key: segment,
      });
    }

    prefix = joinPath(prefix, segment);
  }

  return gates;
}

export function isGateOpen(gate: UnionGate, discriminant: unknown): boolean {
  const branch = findBranch(gate.union, discriminant);
  const shape = branch === undefined ? undefined : branchShape(branch);

  return shape !== undefined && Object.hasOwn(shape, gate.key);
}

export const branchChoice = (
  gates: readonly UnionGate[],
  discriminants: readonly unknown[]
): BranchChoice =>
  Object.fromEntries(
    gates.map((gate, index) => [gate.unionName, discriminants[index]])
  );
