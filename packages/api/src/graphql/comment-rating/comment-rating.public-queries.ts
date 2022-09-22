import {PrismaClient} from '@prisma/client'

export const getRatingSystem = (commentRatingSystem: PrismaClient['commentRatingSystem']) => {
  return commentRatingSystem.findFirst({
    include: {
      answers: true
    }
  })
}
