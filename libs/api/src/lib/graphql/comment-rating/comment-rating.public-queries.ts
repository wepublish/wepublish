import { PrismaClient } from '@prisma/client';
import { Context } from '../../context';

export const userCommentRating = async (
  commentId: string,
  optionalAuthenticateUser: Context['optionalAuthenticateUser'],
  commentRating: PrismaClient['commentRating']
) => {
  const session = optionalAuthenticateUser();

  if (!session) {
    return [];
  }

  return await commentRating.findMany({
    where: {
      commentId,
      userId: session.user.id,
    },
    include: {
      answer: true,
    },
  });
};
