import {PrismaClient} from '@prisma/client'
import {Context} from '../../context'
import {NotFound, PollClosedError, PollNotOpenError} from '../../error'

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

  if (poll.opensAt > new Date()) {
    throw new PollNotOpenError()
  }

  if (poll.closedAt && poll.closedAt < new Date()) {
    throw new PollClosedError()
  }

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
