import {PrismaClient} from '@prisma/client'
import {Context} from '../../context'
import {NotFound} from '../../error'

export const voteOnPoll = async (
  answerId: string,
  fingerprint: string | undefined,
  optionalAuthenticateUser: Context['optionalAuthenticateUser'],
  pollAnswer: PrismaClient['pollAnswer'],
  pollVote: PrismaClient['pollVote']
) => {
  const session = optionalAuthenticateUser()

  const answer = await pollAnswer.findUnique({
    where: {
      id: answerId
    },
    include: {
      poll: true
    }
  })

  if (!answer) {
    throw new NotFound('PollAnswer', answerId)
  }

  const {poll} = answer

  return pollVote.upsert({
    where: {
      pollId_userId: {
        pollId: poll.id,
        userId: session?.user.id ?? ''
      }
    },
    update: {
      answerId,
      fingerprint
    },
    create: {
      answerId,
      fingerprint,
      pollId: poll.id,
      userId: session?.user.id
    }
  })
}
