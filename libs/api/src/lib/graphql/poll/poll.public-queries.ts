import {
  Poll,
  PollAnswer,
  PollExternalVote,
  PollExternalVoteSource,
  Prisma,
  PrismaClient,
} from '@prisma/client';

export type FullPoll = Poll & {
  answers: (PollAnswer & {
    _count: Prisma.PollAnswerCountOutputType;
  })[];
  externalVoteSources: (PollExternalVoteSource & {
    voteAmounts: PollExternalVote[];
  })[];
};

export const getPoll = (
  id: string,
  poll: PrismaClient['poll']
): Promise<FullPoll | null> => {
  return poll.findUnique({
    where: { id },
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
