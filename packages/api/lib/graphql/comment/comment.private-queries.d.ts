import { Context } from '../../context';
import { CommentFilter, CommentSort } from '../../db/comment';
import { PrismaClient } from '@prisma/client';
export declare const getComment: (commentId: string, authenticate: Context['authenticate'], comment: PrismaClient['comment']) => import(".prisma/client").Prisma.Prisma__CommentClient<(import(".prisma/client").Comment & {
    overriddenRatings: import(".prisma/client").CommentRatingOverride[];
    revisions: import(".prisma/client").CommentsRevisions[];
}) | null>;
export declare const getAdminComments: (filter: Partial<CommentFilter>, sortedField: CommentSort, order: 1 | -1, cursorId: string | null, skip: number, take: number, authenticate: Context['authenticate'], comment: PrismaClient['comment']) => Promise<import("../..").ConnectionResult<import(".prisma/client").Comment>>;
//# sourceMappingURL=comment.private-queries.d.ts.map