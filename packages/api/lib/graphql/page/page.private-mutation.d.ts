import { Page, Prisma, PrismaClient } from '@prisma/client';
import { Context } from '../../context';
import { PageWithRevisions } from '../../db/page';
export declare const deletePageById: (id: string, authenticate: Context['authenticate'], prisma: PrismaClient) => Promise<Page>;
declare type CreatePageInput = Omit<Prisma.PageRevisionCreateInput, 'properties' | 'revision'> & {
    properties: Prisma.MetadataPropertyCreateManyPageRevisionInput[];
};
export declare const createPage: (input: CreatePageInput, authenticate: Context['authenticate'], page: PrismaClient['page']) => Promise<Page & {
    draft: (import(".prisma/client").PageRevision & {
        properties: import(".prisma/client").MetadataProperty[];
    }) | null;
    published: (import(".prisma/client").PageRevision & {
        properties: import(".prisma/client").MetadataProperty[];
    }) | null;
    pending: (import(".prisma/client").PageRevision & {
        properties: import(".prisma/client").MetadataProperty[];
    }) | null;
}>;
export declare const duplicatePage: (id: string, authenticate: Context['authenticate'], pages: Context['loaders']['pages'], pageClient: PrismaClient['page']) => Promise<PageWithRevisions>;
export declare const unpublishPage: (id: string, authenticate: Context['authenticate'], pageClient: PrismaClient['page']) => Promise<PageWithRevisions>;
export declare const publishPage: (id: string, input: Pick<Prisma.PageRevisionCreateInput, 'publishAt' | 'publishedAt' | 'updatedAt'>, authenticate: Context['authenticate'], pageClient: PrismaClient['page']) => Promise<PageWithRevisions | null>;
declare type UpdatePageInput = Omit<Prisma.PageRevisionCreateInput, 'revision' | 'properties'> & {
    properties: Prisma.MetadataPropertyUncheckedCreateWithoutPageRevisionInput[];
};
export declare const updatePage: (id: string, { properties, ...input }: UpdatePageInput, authenticate: Context['authenticate'], pageClient: PrismaClient['page']) => Promise<Page & {
    draft: (import(".prisma/client").PageRevision & {
        properties: import(".prisma/client").MetadataProperty[];
    }) | null;
    published: (import(".prisma/client").PageRevision & {
        properties: import(".prisma/client").MetadataProperty[];
    }) | null;
    pending: (import(".prisma/client").PageRevision & {
        properties: import(".prisma/client").MetadataProperty[];
    }) | null;
}>;
export {};
//# sourceMappingURL=page.private-mutation.d.ts.map