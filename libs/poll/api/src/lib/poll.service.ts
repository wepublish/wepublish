import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import {
  getMaxTake,
  graphQLSortOrderToPrisma,
  PrimeDataLoader,
  SortOrder,
} from '@wepublish/utils/api';
import { PollDataloaderService } from './poll-dataloader.service';
import {
  CreatePollExternalVoteSourceInput,
  CreatePollInput,
  PollFilter,
  PollListArgs,
  PollSort,
  UpdatePollInput,
} from './poll.model';
import { CreatePollAnswerInput } from './poll-answer.model';

@Injectable()
export class PollService {
  constructor(private prisma: PrismaClient) {}

  @PrimeDataLoader(PollDataloaderService)
  async getPolls({
    filter,
    cursorId,
    sort = PollSort.OpensAt,
    order = SortOrder.Descending,
    take = 10,
    skip,
  }: PollListArgs) {
    const orderBy = createPollOrder(sort, order);
    const where = createPollFilter(filter);

    const [totalCount, polls] = await Promise.all([
      this.prisma.poll.count({
        where,
        orderBy,
      }),
      this.prisma.poll.findMany({
        where,
        skip,
        take: getMaxTake(take) + 1,
        orderBy,
        cursor: cursorId ? { id: cursorId } : undefined,
      }),
    ]);

    const nodes = polls.slice(0, getMaxTake(take));
    const firstPoll = nodes[0];
    const lastPoll = nodes[nodes.length - 1];

    const hasPreviousPage = Boolean(skip);
    const hasNextPage = polls.length > nodes.length;

    return {
      nodes,
      totalCount,
      pageInfo: {
        hasPreviousPage,
        hasNextPage,
        startCursor: firstPoll?.id,
        endCursor: lastPoll?.id,
      },
    };
  }

  @PrimeDataLoader(PollDataloaderService)
  async updatePoll({
    id,
    infoText,
    answers,
    externalVoteSources,
    ...input
  }: UpdatePollInput) {
    return this.prisma.poll.update({
      where: { id },
      data: {
        ...input,
        infoText: infoText as any,
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
  }

  @PrimeDataLoader(PollDataloaderService)
  async createPoll({ infoText, ...input }: CreatePollInput) {
    return this.prisma.poll.create({
      data: {
        ...input,
        infoText: infoText as any,
        answers: {
          createMany: {
            data: [{ answer: '' }, { answer: '' }],
          },
        },
      },
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
  }

  async createPollAnswer({ pollId, ...input }: CreatePollAnswerInput) {
    const voteSources = await this.prisma.pollExternalVoteSource.findMany({
      where: {
        pollId,
      },
    });

    return this.prisma.pollAnswer.create({
      data: {
        ...input,
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
  }

  async createPollExternalVoteSource({
    pollId,
    ...input
  }: CreatePollExternalVoteSourceInput) {
    const answers = await this.prisma.pollAnswer.findMany({
      where: {
        pollId,
      },
    });

    return this.prisma.pollExternalVoteSource.create({
      data: {
        ...input,
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
  }

  async deletePoll(id: string) {
    return this.prisma.poll.delete({
      where: { id },
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
  }

  async deletePollAnswer(id: string) {
    const answerWithPoll = await this.prisma.pollAnswer.findUnique({
      where: {
        id,
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
      throw new NotFoundException(`PollAnswer with id ${id} was not found.`);
    }

    if (answerWithPoll.poll.answers.length <= 1) {
      throw new BadRequestException('A poll requires at least one answer.');
    }

    return this.prisma.pollAnswer.delete({
      where: { id },
      include: {
        _count: true,
      },
    });
  }

  async deletePollExternalVoteSource(id: string) {
    return this.prisma.pollExternalVoteSource.delete({
      where: {
        id,
      },
      include: {
        voteAmounts: true,
      },
    });
  }
}

export const createPollOrder = (
  field: PollSort,
  sortOrder: SortOrder
): Prisma.PollFindManyArgs['orderBy'] => {
  switch (field) {
    case PollSort.ModifiedAt:
      return {
        modifiedAt: graphQLSortOrderToPrisma(sortOrder),
      };

    case PollSort.CreatedAt:
      return {
        createdAt: graphQLSortOrderToPrisma(sortOrder),
      };

    case PollSort.OpensAt:
    default:
      return {
        opensAt: graphQLSortOrderToPrisma(sortOrder),
      };
  }
};

const createOpenOnlyFilter = (
  filter?: Partial<PollFilter>
): Prisma.PollWhereInput => {
  if (filter?.openOnly) {
    return {
      opensAt: {
        lte: new Date(),
      },
      OR: [
        {
          closedAt: null,
        },
        {
          closedAt: {
            gte: new Date(),
          },
        },
      ],
    };
  }

  return {};
};

export const createPollFilter = (
  filter?: Partial<PollFilter>
): Prisma.PollWhereInput => ({
  AND: [createOpenOnlyFilter(filter)],
});
