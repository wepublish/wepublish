import {Prisma, PrismaClient} from '@prisma/client'
import {GraphQLError} from 'graphql'
import {Context} from '../../context'
import {NotFound} from '../../error'
import {authorise, CanCreatePoll, CanDeletePoll, CanUpdatePoll} from '../permissions'

export const deletePoll = (
  pollId: string,
  authenticate: Context['authenticate'],
  poll: PrismaClient['poll']
) => {
  const {roles} = authenticate()
  authorise(CanDeletePoll, roles)

  return poll.delete({
    where: {id: pollId},
    include: {
      answers: {
        include: {
          _count: true
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

export const createPoll = (
  input: Pick<Prisma.PollUncheckedCreateInput, 'question' | 'opensAt' | 'closedAt'>,
  authenticate: Context['authenticate'],
  poll: PrismaClient['poll']
) => {
  const {roles} = authenticate()
  authorise(CanCreatePoll, roles)

  return poll.create({
    data: {
      ...input,
      answers: {
        createMany: {
          data: [{answer: ''}, {answer: ''}]
        }
      }
    },
    include: {
      answers: true
    }
  })
}

type UpdatePollPollInput = Pick<
  Prisma.PollUncheckedCreateInput,
  'question' | 'opensAt' | 'closedAt'
>

type UpdatePollAnswer = {id: string; answer: string}

type UpdatePollExternalVoteAmount = {
  id: string
  amount: number
}

type UpdatePollExternalVoteSource = {
  id: string
  source: string
  voteAmounts: UpdatePollExternalVoteAmount[] | undefined
}

export const updatePoll = (
  pollId: string,
  pollInput: UpdatePollPollInput,
  answers: UpdatePollAnswer[] | undefined,
  externalVoteSources: UpdatePollExternalVoteSource[] | undefined,
  authenticate: Context['authenticate'],
  poll: PrismaClient['poll']
) => {
  const {roles} = authenticate()
  authorise(CanUpdatePoll, roles)

  return poll.update({
    where: {id: pollId},
    data: {
      ...pollInput,
      answers: {
        update: answers?.map(answer => ({
          where: {id: answer.id},
          data: {
            answer: answer.answer
          }
        }))
      },
      externalVoteSources: {
        update: externalVoteSources?.map(externalVoteSource => ({
          where: {id: externalVoteSource.id},
          data: {
            source: externalVoteSource.source,
            voteAmounts: {
              update: externalVoteSource.voteAmounts?.map(voteAmount => ({
                where: {id: voteAmount.id},
                data: {
                  amount: voteAmount.amount
                }
              }))
            }
          }
        }))
      }
    },
    include: {
      answers: {
        include: {
          _count: true
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

export const createPollAnswer = async (
  pollId: string,
  answer: string,
  authenticate: Context['authenticate'],
  pollExternalVoteSource: PrismaClient['pollExternalVoteSource'],
  pollAnswer: PrismaClient['pollAnswer']
) => {
  const {roles} = authenticate()
  authorise(CanUpdatePoll, roles)

  const voteSources = await pollExternalVoteSource.findMany({
    where: {
      pollId
    }
  })

  return pollAnswer.create({
    data: {
      answer,
      poll: {
        connect: {
          id: pollId
        }
      },
      externalVotes: {
        createMany: {
          data: voteSources.map(source => ({
            sourceId: source.id
          }))
        }
      }
    }
  })
}

export const deletePollAnswer = async (
  answerId: string,
  authenticate: Context['authenticate'],
  pollAnswer: PrismaClient['pollAnswer']
) => {
  const {roles} = authenticate()
  authorise(CanUpdatePoll, roles)

  const answerWithPoll = await pollAnswer.findUnique({
    where: {
      id: answerId
    },
    include: {
      poll: {
        select: {
          answers: true
        }
      }
    }
  })

  if (!answerWithPoll) {
    throw new NotFound('PollAnswer', answerId)
  }

  if (answerWithPoll.poll.answers.length <= 2) {
    throw new GraphQLError('A poll requires atleast 2 answers')
  }

  return pollAnswer.delete({
    where: {id: answerId},
    include: {
      _count: true
    }
  })
}

export const createPollExternalVoteSource = async (
  pollId: string,
  voteSource: string,
  authenticate: Context['authenticate'],
  pollAnswer: PrismaClient['pollAnswer'],
  pollExternalVoteSource: PrismaClient['pollExternalVoteSource']
) => {
  const {roles} = authenticate()
  authorise(CanUpdatePoll, roles)

  const answers = await pollAnswer.findMany({
    where: {
      pollId
    }
  })

  return pollExternalVoteSource.create({
    data: {
      source: voteSource,
      pollId,
      voteAmounts: {
        createMany: {
          data: answers.map(answer => ({
            answerId: answer.id
          }))
        }
      }
    },
    include: {
      voteAmounts: true
    }
  })
}

export const deletePollExternalVoteSource = (
  sourceId: string,
  authenticate: Context['authenticate'],
  pollExternalVoteSource: PrismaClient['pollExternalVoteSource']
) => {
  const {roles} = authenticate()
  authorise(CanUpdatePoll, roles)

  return pollExternalVoteSource.delete({
    where: {id: sourceId},
    include: {
      voteAmounts: true
    }
  })
}
