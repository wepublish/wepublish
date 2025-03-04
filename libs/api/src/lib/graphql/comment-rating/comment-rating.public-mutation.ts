import {PrismaClient, RatingSystemType} from '@prisma/client'
import {Context} from '../../context'
import {
  AnonymousCommentRatingDisabledError,
  InvalidStarRatingValueError,
  NotFound
} from '../../error'
import {SettingName} from '@wepublish/settings/api'
import {mapCommentToPublicComment} from '../comment/comment.public-queries'

export const validateCommentRatingValue = (type: RatingSystemType, value: number) => {
  switch (type) {
    case RatingSystemType.star: {
      if (value <= 0 || value > 5) {
        throw new InvalidStarRatingValueError()
      }
    }
  }
}

export const rateComment = async (
  commentId: string,
  answerId: string,
  value: number,
  fingerprint: string | undefined,
  optionalAuthenticateUser: Context['optionalAuthenticateUser'],
  commentRatingSystemAnswer: PrismaClient['commentRatingSystemAnswer'],
  commentRating: PrismaClient['commentRating'],
  commentClient: PrismaClient['comment'],
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

  validateCommentRatingValue(answer.type, value)

  await commentRating.upsert({
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

  const comment = await commentClient.findFirst({
    where: {
      id: commentId
    },
    include: {
      revisions: {orderBy: {createdAt: 'asc'}},
      overriddenRatings: true
    }
  })

  return comment ? mapCommentToPublicComment(comment) : null
}
