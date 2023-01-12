import { Prisma, PrismaClient } from '@prisma/client';
import { ConnectionResult } from '../../db/common';
import { PageFilter, PageSort, PageWithRevisions } from '../../db/page';
import { SortOrder } from '../queries/sort';
export declare const createPageOrder: (field: PageSort, sortOrder: SortOrder) => Prisma.PageFindManyArgs['orderBy'];
export declare const createPageFilter: (filter: Partial<PageFilter>) => Prisma.PageWhereInput;
export declare const getPages: (filter: Partial<PageFilter>, sortedField: PageSort, order: 1 | -1, cursorId: string | null, skip: number, take: number, page: PrismaClient['page']) => Promise<ConnectionResult<PageWithRevisions>>;
//# sourceMappingURL=page.queries.d.ts.map