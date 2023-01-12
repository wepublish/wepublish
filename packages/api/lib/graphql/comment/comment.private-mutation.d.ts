import { CommentItemType, Prisma, PrismaClient } from '@prisma/client';
import { Context } from '../../context';
import { RichTextNode } from '../richText';
export declare const takeActionOnComment: (id: string, input: Pick<Prisma.CommentUncheckedUpdateInput, 'state' | 'rejectionReason'>, authenticate: Context['authenticate'], comment: PrismaClient['comment']) => Prisma.Prisma__CommentClient<import(".prisma/client").Comment & {
    revisions: import(".prisma/client").CommentsRevisions[];
}>;
declare type CommentRevisionInput = {
    text?: RichTextNode[];
    title?: string;
    lead?: string;
};
declare type CommentRatingOverrideInput = {
    answerId: string;
    value: number | null | undefined;
};
export declare const updateComment: (commentId: string, revision: CommentRevisionInput | undefined, userID: string, guestUsername: string, guestUserImageID: string, source: string, tagIds: string[] | undefined, ratingOverrides: CommentRatingOverrideInput[] | undefined, authenticate: Context['authenticate'], commentRatingAnswerClient: PrismaClient['commentRatingSystemAnswer'], commentClient: PrismaClient['comment']) => Promise<import(".prisma/client").Comment & {
    overriddenRatings: import(".prisma/client").CommentRatingOverride[];
    revisions: import(".prisma/client").CommentsRevisions[];
}>;
export declare const createAdminComment: (itemId: string, itemType: CommentItemType, parentID: string | undefined | null, text: string | undefined, tagIds: string[] | undefined, authenticate: Context['authenticate'], commentClient: PrismaClient['comment']) => Promise<import(".prisma/client").Comment & {
    revisions: import(".prisma/client").CommentsRevisions[];
}>;
export declare const deleteComment: (id: string, authenticate: Context['authenticate'], commentClient: PrismaClient['comment']) => Promise<import(".prisma/client").Comment>;
export {};
//# sourceMappingURL=comment.private-mutation.d.ts.map