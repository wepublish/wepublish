import { Context } from '../../context';
import { PrismaClient } from '@prisma/client';
export declare const getNavigationByIdOrKey: (id: string | null, key: string | null, authenticate: Context['authenticate'], navigationByID: Context['loaders']['navigationByID'], navigationByKey: Context['loaders']['navigationByKey']) => Promise<import("../..").NavigationWithLinks | null>;
export declare const getNavigations: (authenticate: Context['authenticate'], navigation: PrismaClient['navigation']) => import(".prisma/client").PrismaPromise<(import(".prisma/client").Navigation & {
    links: import(".prisma/client").NavigationLink[];
})[]>;
//# sourceMappingURL=navigation.private-queries.d.ts.map