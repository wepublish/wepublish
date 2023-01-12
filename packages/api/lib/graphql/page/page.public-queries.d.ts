import { PageFilter, PageSort } from '../../db/page';
import { PrismaClient } from '@prisma/client';
export declare const getPublishedPages: (filter: Partial<PageFilter>, sortedField: PageSort, order: 1 | -1, cursorId: string | null, skip: number, take: number, page: PrismaClient['page']) => Promise<{
    nodes: {
        id: string;
        revision?: number | undefined;
        createdAt?: Date | undefined;
        modifiedAt?: Date | null | undefined;
        updatedAt?: Date | null | undefined;
        publishedAt?: Date | null | undefined;
        publishAt?: Date | null | undefined;
        slug?: string | null | undefined;
        title?: string | undefined;
        description?: string | null | undefined;
        tags?: string[] | undefined;
        imageID?: string | null | undefined;
        socialMediaTitle?: string | null | undefined;
        socialMediaDescription?: string | null | undefined;
        socialMediaImageID?: string | null | undefined;
        blocks?: import(".prisma/client").Prisma.JsonValue[] | undefined;
        properties?: import(".prisma/client").MetadataProperty[] | undefined;
    }[];
    pageInfo: import("../..").PageInfo;
    totalCount: number;
}>;
//# sourceMappingURL=page.public-queries.d.ts.map