import { Prisma } from '@prisma/client';

import {
  ApiBlock,
  ApiPuckRegistry,
  assertPuckDocument,
  parsePuckBlocks,
  parsePuckRegistry,
  readStoredPuckBlocks,
  readStoredPuckRegistry,
} from './puck-blocks';

type PuckColumn = Prisma.InputJsonValue | typeof Prisma.DbNull;

const toColumn = (value: unknown): PuckColumn =>
  value === undefined || value === null ?
    Prisma.DbNull
  : (value as Prisma.InputJsonValue);

export const puckBlocksColumn = (value: unknown): PuckColumn =>
  value === undefined || value === null ?
    Prisma.DbNull
  : toColumn(parsePuckBlocks(value));

export const puckRegistryColumn = (value: unknown): PuckColumn =>
  value === undefined || value === null ?
    Prisma.DbNull
  : toColumn(parsePuckRegistry(value));

export type PuckDocumentInput = {
  puckBlocks?: unknown;
  puckRegistry?: unknown;
};

export type StoredPuckDocument = {
  puckBlocks?: Prisma.JsonValue | null;
  puckRegistry?: Prisma.JsonValue | null;
};

const givenOrStored = <Parsed>(
  given: unknown,
  stored: unknown,
  parse: (value: unknown) => Parsed,
  readStored: (value: unknown) => Parsed | null
): { check: Parsed | null; column: PuckColumn } => {
  if (given === undefined) {
    return { check: readStored(stored), column: toColumn(stored) };
  }

  if (given === null) {
    return { check: null, column: Prisma.DbNull };
  }

  const parsed = parse(given);

  return { check: parsed, column: toColumn(parsed) };
};

export const puckDocumentColumns = (
  { puckBlocks, puckRegistry }: PuckDocumentInput,
  latest?: StoredPuckDocument | null
): { puckBlocks: PuckColumn; puckRegistry: PuckColumn } => {
  const blocks = givenOrStored<ApiBlock[]>(
    puckBlocks,
    latest?.puckBlocks,
    parsePuckBlocks,
    readStoredPuckBlocks
  );
  const registry = givenOrStored<ApiPuckRegistry>(
    puckRegistry,
    latest?.puckRegistry,
    parsePuckRegistry,
    readStoredPuckRegistry
  );

  assertPuckDocument(blocks.check ?? [], registry.check);

  return { puckBlocks: blocks.column, puckRegistry: registry.column };
};
