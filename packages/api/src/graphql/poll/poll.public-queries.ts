import {
  PollAnswer,
  PollExternalVoteSource,
  PrismaClient,
  Poll,
  PollExternalVote,
  Prisma
} from '@prisma/client'
import {Context} from '../../context'

export type FullPoll = Poll & {
  answers: (PollAnswer & {
    _count: Prisma.PollAnswerCountOutputType
  })[]
  externalVoteSources: (PollExternalVoteSource & {
    voteAmounts: PollExternalVote[]
  })[]
}

export const getPoll = (id: string, poll: PrismaClient['poll']): Promise<FullPoll | null> => {
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
