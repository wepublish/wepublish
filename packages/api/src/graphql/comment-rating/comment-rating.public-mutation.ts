import {PrismaClient, RatingSystemType} from '@prisma/client'
import {Context} from '../../context'
import {
  AnonymousCommentRatingDisabledError,
  InvalidStarRatingValueError,
  NotFound
} from '../../error'
import {SettingName} from '../../db/setting'

export const rateComment = async (
  commentId: string,
  answerId: string,
  value: number,
  fingerprint: string | undefined,
  optionalAuthenticateUser: Context['optionalAuthenticateUser'],
  commentRatingSystemAnswer: PrismaClient['commentRatingSystemAnswer'],
  commentRating: PrismaClient['commentRating'],
  settingsClient: PrismaClient['setting']
) => {
  const session = optionalAuthenticateUser()
  // check if anonymous rating is allowed
  const guestRatingSetting = await settingsClient.findUnique({
    where: {
      name: SettingName.ALLOW_GUEST_COMMENT_RATING
    }
  })
  if (!session && guestRatingSetting?.value !== true) {
    throw new AnonymousCommentRatingDisabledError()
  }

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
