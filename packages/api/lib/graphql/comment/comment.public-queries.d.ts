import { CommentRatingSystemAnswer, Comment, CommentState, PrismaClient } from '@prisma/client';
import { PublicCommentSort } from '../../db/comment';
export declare const getPublicChildrenCommentsByParentId: (parentId: string, userId: string | null, comment: PrismaClient['comment']) => Promise<{
    title: string | null;
    lead: string | null;
    text: import(".prisma/client").Prisma.JsonValue;
    id: string;
    createdAt: Date;
    modifiedAt: Date;
    itemID: string;
    itemType: import(".prisma/client").CommentItemType;
    peerId: string | null;
    parentID: string | null;
    rejectionReason: import(".prisma/client").CommentRejectionReason | null;
    state: CommentState;
    source: string | null;
    authorType: import(".prisma/client").CommentAuthorType;
    guestUsername: string | null;
    guestUserImageID: string | null;
    userID: string | null;
    tags: import(".prisma/client").TaggedComments[];
    revisions: import(".prisma/client").CommentsRevisions[];
}[]>;
export declare type CalculatedRating = {
    count: number;
    mean: number;
    total: number;
    answer: CommentRatingSystemAnswer;
};
export declare const getPublicCommentsForItemById: (itemId: string, userId: string | null, sort: PublicCommentSort | null, order: 1 | -1, commentRatingSystemAnswer: PrismaClient['commentRatingSystemAnswer'], comment: PrismaClient['comment']) => Promise<(Comment & {
    calculatedRatings: CalculatedRating[];
})[]>;
//# sourceMappingURL=comment.public-queries.d.ts.map