import { AuthorFilter, AuthorSort } from '../../db/author';
import { PrismaClient } from '@prisma/client';
export declare const getPublicAuthors: (filter: Partial<AuthorFilter>, sortedField: AuthorSort, order: 1 | -1, cursorId: string | null, skip: number, take: number, author: PrismaClient['author']) => Promise<import("../..").ConnectionResult<import(".prisma/client").Author>>;
//# sourceMappingURL=author.public-queries.d.ts.map