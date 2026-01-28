import { Injectable, Scope } from '@nestjs/common';
import { createOptionalsArray, DataLoaderService } from '@wepublish/utils/api';
import {
  Poll,
  PollAnswer,
  PollExternalVote,
  PollExternalVoteSource,
  Prisma,
  PrismaClient,
} from '@prisma/client';

export type PrismaFullPoll = Poll & {
  answers: (PollAnswer & {
    _count: Prisma.PollAnswerCountOutputType;
  })[];
  externalVoteSources: (PollExternalVoteSource & {
    voteAmounts: PollExternalVote[];
  })[];
};

@Injectable({ scope: Scope.REQUEST })
export class PollDataloaderService extends DataLoaderService<PrismaFullPoll> {
  constructor(private prisma: PrismaClient) {
    super();
  }

  protected async loadByKeys(ids: string[]) {
    return createOptionalsArray(
      ids,
      await this.prisma.poll.findMany({
        where: { id: { in: ids } },
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
      }),
      'id'
    );
  }
}
