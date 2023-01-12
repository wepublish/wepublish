import { PrismaClient, RatingSystemType } from '@prisma/client';
import { Context } from '../../context';
declare type UpdateCommentRatingAnswer = {
    id: string;
    answer: string;
    type: RatingSystemType;
};
export declare const updateRatingSystem: (ratingSystemId: string, name: string | undefined, answers: UpdateCommentRatingAnswer[] | undefined, authenticate: Context['authenticate'], ratingSystem: PrismaClient['commentRatingSystem']) => import(".prisma/client").Prisma.Prisma__CommentRatingSystemClient<import(".prisma/client").CommentRatingSystem & {
    answers: import(".prisma/client").CommentRatingSystemAnswer[];
}>;
export declare const createCommentRatingAnswer: (ratingSystemId: string, type: RatingSystemType, answer: string | undefined, authenticate: Context['authenticate'], ratingAnswer: PrismaClient['commentRatingSystemAnswer']) => Promise<import(".prisma/client").CommentRatingSystemAnswer>;
export declare const deleteCommentRatingAnswer: (answerId: string, authenticate: Context['authenticate'], commentRatingAnswer: PrismaClient['commentRatingSystemAnswer']) => Promise<import(".prisma/client").CommentRatingSystemAnswer>;
export {};
//# sourceMappingURL=comment-rating.private-mutation.d.ts.map