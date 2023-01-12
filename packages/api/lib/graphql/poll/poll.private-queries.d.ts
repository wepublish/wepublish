import { Prisma, PrismaClient } from '@prisma/client';
import { SortOrder } from '../queries/sort';
import { Context } from '../../context';
export declare type PollFilter = {
    openOnly: boolean;
};
export declare enum PollSort {
    CreatedAt = "CreatedAt",
    ModifiedAt = "ModifiedAt",
    OpensAt = "OpensAt"
}
export declare const createPollOrder: (field: PollSort, sortOrder: SortOrder) => Prisma.PollFindManyArgs['orderBy'];
export declare const createPollFilter: (filter?: Partial<PollFilter> | undefined) => Prisma.PollWhereInput;
export declare const getPolls: (filter: Partial<PollFilter>, sortedField: PollSort, order: 1 | -1, cursorId: string | null, skip: number, take: number, authenticate: Context['authenticate'], poll: PrismaClient['poll']) => Promise<{
    nodes: (import(".prisma/client").Poll & {
        answers: import(".prisma/client").PollAnswer[];
    })[];
    totalCount: number;
    pageInfo: {
        hasPreviousPage: boolean;
        hasNextPage: boolean;
        startCursor: string;
        endCursor: string;
    };
}>;
//# sourceMappingURL=poll.private-queries.d.ts.map