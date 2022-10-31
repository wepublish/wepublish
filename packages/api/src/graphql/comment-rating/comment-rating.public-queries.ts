import {PrismaClient} from '@prisma/client'
import {Context} from '../../context'

export const getRatingSystem = (commentRatingSystem: PrismaClient['commentRatingSystem']) => {
  return commentRatingSystem.findFirst({
    include: {
      answers: true
    }
  })
}

export const userCommentRating = async (
  commentId: string,
  authenticateUser: Context['authenticateUser'],
  commentRating: PrismaClient['commentRating']
) => {
  const {user} = authenticateUser()

  return await commentRating.findMany({
    where: {
      commentId,
      userId: user.id
    },
    include: {
      answer: true
    }
  })
}
