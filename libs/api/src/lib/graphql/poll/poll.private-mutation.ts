import { Prisma, PrismaClient } from '@prisma/client';
import { GraphQLError } from 'graphql';
import { Context } from '../../context';
import { NotFound } from '../../error';
import { authorise } from '../permissions';
import {
  CanCreatePoll,
  CanDeletePoll,
  CanUpdatePoll,
} from '@wepublish/permissions';

export const deletePoll = (
  pollId: string,
  authenticate: Context['authenticate'],
  poll: PrismaClient['poll']
) => {
  const { roles } = authenticate();
  authorise(CanDeletePoll, roles);

  return poll.delete({
    where: { id: pollId },
    include: {
      answers: {
        include: {
          _count: true,
        },
      },
      externalVoteSources: {
        include: {
          voteAmounts: true,
        },
      },
    },
  });
};

export const createPoll = (
  input: Pick<
    Prisma.PollUncheckedCreateInput,
    'question' | 'opensAt' | 'closedAt' | 'infoText'
  >,
  authenticate: Context['authenticate'],
  poll: PrismaClient['poll']
) => {
  const { roles } = authenticate();
  authorise(CanCreatePoll, roles);

  return poll.create({
    data: {
      ...input,
      answers: {
        createMany: {
          data: [{ answer: '' }, { answer: '' }],
        },
      },
    },
    include: {
      answers: true,
    },
  });
};

type UpdatePollPollInput = Pick<
  Prisma.PollUncheckedCreateInput,
  'question' | 'opensAt' | 'closedAt' | 'infoText'
>;

type UpdatePollAnswer = { id: string; answer: string };

type UpdatePollExternalVoteAmount = {
  id: string;
  amount: number;
};

type UpdatePollExternalVoteSource = {
  id: string;
  source: string;
  voteAmounts: UpdatePollExternalVoteAmount[] | undefined;
};

export const updatePoll = (
  pollId: string,
  pollInput: UpdatePollPollInput,
  answers: UpdatePollAnswer[] | undefined,
  externalVoteSources: UpdatePollExternalVoteSource[] | undefined,
  authenticate: Context['authenticate'],
  poll: PrismaClient['poll']
) => {
  const { roles } = authenticate();
  authorise(CanUpdatePoll, roles);

  return poll.update({
    where: { id: pollId },
    data: {
      ...pollInput,
      infoText: pollInput.infoText || [],
      answers: {
        update: answers?.map(answer => ({
          where: { id: answer.id },
          data: {
            answer: answer.answer,
          },
        })),
      },
      externalVoteSources: {
        update: externalVoteSources?.map(externalVoteSource => ({
          where: { id: externalVoteSource.id },
          data: {
            source: externalVoteSource.source,
            voteAmounts: {
              update: externalVoteSource.voteAmounts?.map(voteAmount => ({
                where: { id: voteAmount.id },
                data: {
                  amount: voteAmount.amount,
                },
              })),
            },
          },
        })),
      },
    },
    include: {
      answers: {
        include: {
          _count: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
      externalVoteSources: {
        include: {
          voteAmounts: true,
        },
      },
    },
  });
};

export const createPollAnswer = async (
  pollId: string,
  answer: string,
  authenticate: Context['authenticate'],
  pollExternalVoteSource: PrismaClient['pollExternalVoteSource'],
  pollAnswer: PrismaClient['pollAnswer']
) => {
  const { roles } = authenticate();
  authorise(CanUpdatePoll, roles);

  const voteSources = await pollExternalVoteSource.findMany({
    where: {
      pollId,
    },
  });

  return pollAnswer.create({
    data: {
      answer,
      poll: {
        connect: {
          id: pollId,
        },
      },
      externalVotes: {
        createMany: {
          data: voteSources.map(source => ({
            sourceId: source.id,
          })),
        },
      },
    },
  });
};

export const deletePollAnswer = async (
  answerId: string,
  authenticate: Context['authenticate'],
  pollAnswer: PrismaClient['pollAnswer']
) => {
  const { roles } = authenticate();
  authorise(CanUpdatePoll, roles);

  const answerWithPoll = await pollAnswer.findUnique({
    where: {
      id: answerId,
    },
    include: {
      poll: {
        select: {
          answers: true,
        },
      },
    },
  });

  if (!answerWithPoll) {
    throw new NotFound('PollAnswer', answerId);
  }

  if (answerWithPoll.poll.answers.length <= 1) {
    throw new GraphQLError('A poll requires at least one answer.');
  }

  return pollAnswer.delete({
    where: { id: answerId },
    include: {
      _count: true,
    },
  });
};

export const createPollExternalVoteSource = async (
  pollId: string,
  voteSource: string,
  authenticate: Context['authenticate'],
  pollAnswer: PrismaClient['pollAnswer'],
  pollExternalVoteSource: PrismaClient['pollExternalVoteSource']
) => {
  const { roles } = authenticate();
  authorise(CanUpdatePoll, roles);

  const answers = await pollAnswer.findMany({
    where: {
      pollId,
    },
  });

  return pollExternalVoteSource.create({
    data: {
      source: voteSource,
      pollId,
      voteAmounts: {
        createMany: {
          data: answers.map(answer => ({
            answerId: answer.id,
          })),
        },
      },
    },
    include: {
      voteAmounts: true,
    },
  });
};

export const deletePollExternalVoteSource = (
  sourceId: string,
  authenticate: Context['authenticate'],
  pollExternalVoteSource: PrismaClient['pollExternalVoteSource']
) => {
  const { roles } = authenticate();
  authorise(CanUpdatePoll, roles);

  return pollExternalVoteSource.delete({
    where: { id: sourceId },
    include: {
      voteAmounts: true,
    },
  });
};
