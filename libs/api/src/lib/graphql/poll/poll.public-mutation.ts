import {PrismaClient} from '@prisma/client'
import {Context} from '../../context'
import {
  AnonymousPollVotingDisabledError,
  NotFound,
  PollClosedError,
  PollNotOpenError
} from '../../error'
import {SettingName} from '@wepublish/settings/api'

export const voteOnPoll = async (
  answerId: string,
  fingerprint: string | undefined,
  optionalAuthenticateUser: Context['optionalAuthenticateUser'],
  pollAnswer: PrismaClient['pollAnswer'],
  pollVote: PrismaClient['pollVote'],
  settingsClient: PrismaClient['setting']
) => {
  const session = optionalAuthenticateUser()
  // check if anonymous vote on poll is allowed
  const guestVotingSetting = await settingsClient.findUnique({
    where: {
      name: SettingName.ALLOW_GUEST_POLL_VOTING
    }
  })
  if (!session && guestVotingSetting?.value !== true) {
    throw new AnonymousPollVotingDisabledError()
  }

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
