import { Prisma } from '@prisma/client';

import { parsePuckBlocks } from './puck-blocks';

export const puckBlocksColumn = (
  value: unknown
): Prisma.InputJsonValue | typeof Prisma.DbNull =>
  value === undefined || value === null ?
    Prisma.DbNull
  : (parsePuckBlocks(value) as unknown as Prisma.InputJsonValue);
