import { Context } from '../../context';
import { PrismaClient } from '@prisma/client';
import { AuthorFilter, AuthorSort } from '../../db/author';
export declare const getAuthorByIdOrSlug: (id: string | null, slug: string | null, authenticate: Context['authenticate'], authorsByID: Context['loaders']['authorsByID'], authorsBySlug: Context['loaders']['authorsBySlug']) => Promise<import(".prisma/client").Author | null>;
export declare const getAdminAuthors: (filter: Partial<AuthorFilter>, sortedField: AuthorSort, order: 1 | -1, cursorId: string | null, skip: number, take: number, authenticate: Context['authenticate'], author: PrismaClient['author']) => Promise<import("../..").ConnectionResult<import(".prisma/client").Author>>;
//# sourceMappingURL=author.private-queries.d.ts.map