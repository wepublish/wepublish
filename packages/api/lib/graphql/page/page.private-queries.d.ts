import { PrismaClient } from '@prisma/client';
import { Context } from '../../context';
import { PageFilter, PageSort } from '../../db/page';
export declare const getPageById: (id: string, authenticate: Context['authenticate'], pages: Context['loaders']['pages']) => Promise<import("../../db/page").PageWithRevisions | null>;
export declare const getPagePreviewLink: (id: string, hours: number, authenticate: Context['authenticate'], generateJWT: Context['generateJWT'], urlAdapter: Context['urlAdapter'], pagesLoader: Context['loaders']['pages']) => Promise<string>;
export declare const getAdminPages: (filter: Partial<PageFilter>, sortedField: PageSort, order: 1 | -1, cursorId: string | null, skip: number, take: number, authenticate: Context['authenticate'], page: PrismaClient['page']) => Promise<import("../..").ConnectionResult<import("../../db/page").PageWithRevisions>>;
//# sourceMappingURL=page.private-queries.d.ts.map