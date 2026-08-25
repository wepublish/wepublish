import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { getMaxTake } from '@wepublish/utils/api';
import {
  ChangelogEntryFilter,
  ChangelogEntryListArgs,
} from './changelog-entry.model';

@Injectable()
export class ChangelogService {
  constructor(private prisma: PrismaClient) {}

  async getChangelogEntries({
    filter,
    skip = 0,
    take = 10,
  }: ChangelogEntryListArgs) {
    const where = createChangelogEntryFilter(filter);

    const [totalCount, entries] = await Promise.all([
      this.prisma.changelogEntry.count({
        where,
      }),
      this.prisma.changelogEntry.findMany({
        where,
        skip,
        take: getMaxTake(take) + 1,
        orderBy: {
          releasedAt: 'desc',
        },
      }),
    ]);

    const nodes = entries.slice(0, getMaxTake(take));
    const firstEntry = nodes[0];
    const lastEntry = nodes[nodes.length - 1];

    return {
      nodes,
      totalCount,
      pageInfo: {
        hasPreviousPage: Boolean(skip),
        hasNextPage: entries.length > nodes.length,
        startCursor: firstEntry?.id,
        endCursor: lastEntry?.id,
      },
    };
  }

  async confirmChangelogEntry(id: string, userId: string) {
    const entry = await this.prisma.changelogEntry.findUnique({
      where: { id },
    });

    if (!entry) {
      throw new NotFoundException(`Changelog entry with id ${id} not found`);
    }

    if (!entry.actionRequired) {
      throw new BadRequestException(
        `Changelog entry with id ${id} does not require a confirmation`
      );
    }

    if (entry.confirmedAt) {
      return entry;
    }

    return this.prisma.changelogEntry.update({
      where: { id },
      data: {
        confirmedAt: new Date(),
        confirmedByUserId: userId,
      },
    });
  }
}

function createChangelogEntryFilter(
  filter?: ChangelogEntryFilter
): Prisma.ChangelogEntryWhereInput {
  return {
    ...(filter?.actionRequired != null ?
      { actionRequired: filter.actionRequired }
    : {}),
    ...(filter?.confirmed != null ?
      { confirmedAt: filter.confirmed ? { not: null } : null }
    : {}),
  };
}
