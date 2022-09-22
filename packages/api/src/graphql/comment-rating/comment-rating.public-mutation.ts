import {PrismaClient, RatingSystemType} from '@prisma/client'
import {Context} from '../../context'
import {InvalidStarRatingValueError, NotFound} from '../../error'

export const rateComment = async (
  commentId: string,
  answerId: string,
  value: number,
  fingerprint: string | undefined,
  optionalAuthenticateUser: Context['optionalAuthenticateUser'],
  commentRatingSystemAnswer: PrismaClient['commentRatingSystemAnswer'],
  commentRating: PrismaClient['commentRating']
) => {
  const session = optionalAuthenticateUser()

  const answer = await commentRatingSystemAnswer.findUnique({
    where: {
      id: answerId
    }
  })

  if (!answer) {
    throw new NotFound('CommentRatingSystemAnswer', answerId)
  }

  switch (answer.type) {
    case RatingSystemType.star: {
      if (value < 0 || value > 5) {
        throw new InvalidStarRatingValueError()
      }
    }
  }

  return commentRating.upsert({
    where: {
      answerId_commentId_userId: {
        answerId,
        commentId,
        userId: session?.user.id ?? ''
      }
    },
    update: {
      fingerprint,
      value
    },
    create: {
      answerId,
      commentId,
      userId: session?.user.id,
      value,
      fingerprint
    }
  })
}
