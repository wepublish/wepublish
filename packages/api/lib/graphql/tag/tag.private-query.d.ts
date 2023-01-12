import { Prisma, PrismaClient, TagType } from '@prisma/client';
import { Context } from '../../context';
import { SortOrder } from '../queries/sort';
export declare type TagFilter = {
    type: TagType;
    tag: string;
};
export declare enum TagSort {
    CreatedAt = "CreatedAt",
    ModifiedAt = "ModifiedAt",
    Tag = "Tag"
}
export declare const createTagOrder: (field: TagSort, sortOrder: SortOrder) => Prisma.TagFindManyArgs['orderBy'];
export declare const createTagFilter: (filter?: Partial<TagFilter> | undefined) => Prisma.TagWhereInput;
export declare const getTags: (filter: Partial<TagFilter>, sortedField: TagSort, order: 1 | -1, cursorId: string | null, skip: number, take: number, authenticate: Context['authenticate'], tag: PrismaClient['tag']) => Promise<{
    nodes: import(".prisma/client").Tag[];
    totalCount: number;
    pageInfo: {
        hasPreviousPage: boolean;
        hasNextPage: boolean;
        startCursor: string;
        endCursor: string;
    };
}>;
//# sourceMappingURL=tag.private-query.d.ts.map