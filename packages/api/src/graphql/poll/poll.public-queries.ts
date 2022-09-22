import {PrismaClient} from '@prisma/client'
import {Context} from '../../context'

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

export const userPollVote = async (
  pollId: string,
  authenticateUser: Context['authenticateUser'],
  pollVote: PrismaClient['pollVote']
) => {
  const {user} = authenticateUser()

  const vote = await pollVote.findUnique({
    where: {
      pollId_userId: {
        pollId,
        userId: user.id
      }
    }
  })

  return vote?.answerId
}
