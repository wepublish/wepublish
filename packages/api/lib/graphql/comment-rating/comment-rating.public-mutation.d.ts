import { PrismaClient, RatingSystemType } from '@prisma/client';
import { Context } from '../../context';
export declare const validateCommentRatingValue: (type: RatingSystemType, value: number) => void;
export declare const rateComment: (commentId: string, answerId: string, value: number, fingerprint: string | undefined, optionalAuthenticateUser: Context['optionalAuthenticateUser'], commentRatingSystemAnswer: PrismaClient['commentRatingSystemAnswer'], commentRating: PrismaClient['commentRating'], settingsClient: PrismaClient['setting']) => Promise<import(".prisma/client").CommentRating>;
//# sourceMappingURL=comment-rating.public-mutation.d.ts.map