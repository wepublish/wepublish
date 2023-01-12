import { Author, Prisma, PrismaClient } from '@prisma/client';
import { AuthorFilter, AuthorSort } from '../../db/author';
import { ConnectionResult } from '../../db/common';
import { SortOrder } from '../queries/sort';
export declare const createAuthorOrder: (field: AuthorSort, sortOrder: SortOrder) => Prisma.AuthorFindManyArgs['orderBy'];
export declare const createAuthorFilter: (filter: Partial<AuthorFilter>) => Prisma.AuthorWhereInput;
export declare const getAuthors: (filter: Partial<AuthorFilter>, sortedField: AuthorSort, order: 1 | -1, cursorId: string | null, skip: number, take: number, author: PrismaClient['author']) => Promise<ConnectionResult<Author>>;
//# sourceMappingURL=author.queries.d.ts.map