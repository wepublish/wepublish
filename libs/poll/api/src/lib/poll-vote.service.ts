import { Prisma, PrismaClient } from '@prisma/client';
import {
  PoleVoteByIdArgs,
  PoleVoteListArgs,
  PollVoteFilter,
  PollVoteSort,
} from './poll-vote.model';
import {
  getMaxTake,
  graphQLSortOrderToPrisma,
  SortOrder,
} from '@wepublish/utils/api';
import { Injectable } from '@nestjs/common';
import {
  AnonymousPollVotingDisabledError,
  NotFound,
  PollClosedError,
  PollNotOpenError,
} from '@wepublish/api';
import { SettingName, SettingsService } from '@wepublish/settings/api';

@Injectable()
export class PollVoteService {
  constructor(
    readonly settings: SettingsService,
    readonly prisma: PrismaClient
  ) {}

  async userPollVote(pollId: string, userId: string): Promise<string | null> {
    const vote = await this.prisma.pollVote.findUnique({
      where: {
        pollId_userId: {
          pollId,
          userId,
        },
      },
    });

    return vote?.answerId || null;
  }

  async getPollVotes({
    filter,
    sort = PollVoteSort.CreatedAt,
    order = SortOrder.Ascending,
    skip,
    take = 10,
    cursorId,
  }: PoleVoteListArgs) {
    const orderBy = createPollVoteOrder(sort, order);
    const where = createPollVoteFilter(filter);

    const [totalCount, items] = await Promise.all([
      this.prisma.pollVote.count({
        where,
        orderBy,
      }),
      this.prisma.pollVote.findMany({
        where,
        skip,
        take: getMaxTake(take) + 1,
        orderBy,
        cursor: cursorId ? { id: cursorId } : undefined,
        include: {
          answer: true,
        },
      }),
    ]);

    const nodes = items.slice(0, take);
    const firstItem = nodes[0];
    const lastItem = nodes[nodes.length - 1];

    const hasPreviousPage = Boolean(skip);
    const hasNextPage = items.length > nodes.length;

    return {
      nodes,
      totalCount,
      pageInfo: {
        hasPreviousPage,
        hasNextPage,
        startCursor: firstItem?.id,
        endCursor: lastItem?.id,
      },
    };
  }

  async deletePollVotes({ ids }: PoleVoteByIdArgs) {
    return this.prisma.pollVote.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });
  }

  async voteOnPoll(
    answerId: string,
    fingerprint: string | undefined,
    userId: string | undefined
  ) {
    const guestVotingSetting = await this.settings.settingByName(
      SettingName.ALLOW_GUEST_POLL_VOTING
    );

    if (!userId && !guestVotingSetting?.value) {
      throw new AnonymousPollVotingDisabledError();
    }

    const answer = await this.prisma.pollAnswer.findUnique({
      where: {
        id: answerId,
      },
      include: {
        poll: true,
      },
    });

    if (!answer) {
      throw new NotFound('PollAnswer', answerId);
    }

    const { poll } = answer;

    if (poll.opensAt > new Date()) {
      throw new PollNotOpenError();
    }

    if (poll.closedAt && poll.closedAt < new Date()) {
      throw new PollClosedError();
    }

    return this.prisma.pollVote.upsert({
      where: {
        pollId_userId: {
          pollId: poll.id,
          userId: userId ?? '',
        },
      },
      update: {
        answerId,
        fingerprint,
      },
      create: {
        answerId,
        fingerprint,
        pollId: poll.id,
        userId,
      },
      include: {
        answer: true,
      },
    });
  }
}

export const createPollVoteOrder = (
  field: PollVoteSort,
  sortOrder: SortOrder
): Prisma.PollVoteFindManyArgs['orderBy'] => {
  switch (field) {
    case PollVoteSort.CreatedAt:
      return {
        createdAt: graphQLSortOrderToPrisma(sortOrder),
      };
    default:
      return {
        createdAt: graphQLSortOrderToPrisma(sortOrder),
      };
  }
};

const createPollFilter = (
  filter?: Partial<PollVoteFilter>
): Prisma.PollVoteWhereInput => {
  if (filter?.pollId) {
    return {
      pollId: filter.pollId,
    };
  }
  return {};
};

const createAnswersFilter = (
  filter?: Partial<PollVoteFilter>
): Prisma.PollVoteWhereInput => {
  if (filter?.answerIds) {
    return {
      answerId: {
        in: filter.answerIds,
      },
    };
  }
  return {};
};

const createFromFilter = (
  filter?: Partial<PollVoteFilter>
): Prisma.PollVoteWhereInput => {
  if (filter?.from) {
    return {
      createdAt: {
        gte: filter.from,
      },
    };
  }

  return {};
};

const createToFilter = (
  filter?: Partial<PollVoteFilter>
): Prisma.PollVoteWhereInput => {
  if (filter?.to) {
    return {
      createdAt: {
        lte: filter.to,
      },
    };
  }

  return {};
};

const createFingerprintFilter = (
  filter?: Partial<PollVoteFilter>
): Prisma.PollVoteWhereInput => {
  if (filter?.fingerprint) {
    return {
      fingerprint: {
        contains: filter.fingerprint,
      },
    };
  }

  return {};
};

const createPollVoteFilter = (
  filter?: Partial<PollVoteFilter>
): Prisma.PollVoteWhereInput => ({
  AND: [
    createPollFilter(filter),
    createAnswersFilter(filter),
    createFromFilter(filter),
    createToFilter(filter),
    createFingerprintFilter(filter),
  ],
});
