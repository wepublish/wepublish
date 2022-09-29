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
  answerId: string,
  authenticateUser: Context['authenticateUser'],
  commentRating: PrismaClient['commentRating']
) => {
  const {user} = authenticateUser()

  const rating = await commentRating.findUnique({
    where: {
      answerId_commentId_userId: {
        commentId,
        answerId,
        userId: user.id
      }
    }
  })

  return rating?.value
}
