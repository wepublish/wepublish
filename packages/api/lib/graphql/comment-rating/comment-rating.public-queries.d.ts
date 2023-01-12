import { PrismaClient } from '@prisma/client';
import { Context } from '../../context';
export declare const getRatingSystem: (commentRatingSystem: PrismaClient['commentRatingSystem']) => import(".prisma/client").Prisma.Prisma__CommentRatingSystemClient<(import(".prisma/client").CommentRatingSystem & {
    answers: import(".prisma/client").CommentRatingSystemAnswer[];
}) | null>;
export declare const userCommentRating: (commentId: string, authenticateUser: Context['authenticateUser'], commentRating: PrismaClient['commentRating']) => Promise<(import(".prisma/client").CommentRating & {
    answer: import(".prisma/client").CommentRatingSystemAnswer;
})[]>;
//# sourceMappingURL=comment-rating.public-queries.d.ts.map