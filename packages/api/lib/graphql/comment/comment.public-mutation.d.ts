import { Comment, CommentAuthorType, CommentItemType, CommentState, Prisma, PrismaClient } from '@prisma/client';
import { Context } from '../../context';
export declare const addPublicComment: (input: {
    title?: string | undefined;
    text: string;
    challenge: {
        challengeID: string;
        challengeSolution: number;
    };
} & Omit<Prisma.CommentUncheckedCreateInput, "userID" | "state" | "revisions" | "authorType">, optionalAuthenticateUser: Context['optionalAuthenticateUser'], challenge: Context['challenge'], settingsClient: PrismaClient['setting'], commentClient: PrismaClient['comment']) => Promise<{
    title: string | undefined;
    text: string;
    id: string;
    createdAt: Date;
    modifiedAt: Date;
    itemID: string;
    itemType: CommentItemType;
    peerId: string | null;
    parentID: string | null;
    rejectionReason: import(".prisma/client").CommentRejectionReason | null;
    state: CommentState;
    source: string | null;
    authorType: CommentAuthorType;
    guestUsername: string | null;
    guestUserImageID: string | null;
    userID: string | null;
}>;
export declare const updatePublicComment: (input: {
    id: Comment['id'];
} & Prisma.CommentsRevisionsCreateInput, authenticateUser: Context['authenticateUser'], commentClient: PrismaClient['comment']) => Promise<{
    text: string | number | boolean | Prisma.InputJsonObject | Prisma.InputJsonArray | undefined;
    id: string;
    createdAt: Date;
    modifiedAt: Date;
    itemID: string;
    itemType: CommentItemType;
    peerId: string | null;
    parentID: string | null;
    rejectionReason: import(".prisma/client").CommentRejectionReason | null;
    state: CommentState;
    source: string | null;
    authorType: CommentAuthorType;
    guestUsername: string | null;
    guestUserImageID: string | null;
    userID: string | null;
} | null>;
//# sourceMappingURL=comment.public-mutation.d.ts.map