import {PrismaClient} from '@prisma/client'

export const getPoll = (id: string, poll: PrismaClient['poll']) => {
  return poll.findUnique({
    where: {id},
    include: {
      answers: {
        include: {
          _count: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      },
      externalVoteSources: {
        include: {
          voteAmounts: true
        }
      }
    }
  })
}
