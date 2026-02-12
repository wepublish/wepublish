import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import {
  Author,
  AuthorFilter,
  AuthorSort,
  AuthorListArgs,
  CreateAuthorInput,
  UpdateAuthorInput,
} from './author.model';
import { AuthorDataloaderService } from './author-dataloader.service';
import {
  getMaxTake,
  graphQLSortOrderToPrisma,
  PrimeDataLoader,
  SortOrder,
} from '@wepublish/utils/api';

function lowercaseFirstLetter(str: string): string {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

@Injectable()
export class AuthorService {
  constructor(private prisma: PrismaClient) {}

  @PrimeDataLoader(AuthorDataloaderService)
  async getAuthorById(id: string) {
    return this.prisma.author.findUnique({
      where: {
        id,
      },
      include: {
        links: true,
      },
    });
  }

  @PrimeDataLoader(AuthorDataloaderService)
  async getAuthorBySlug(slug: string) {
    return this.prisma.author.findFirst({
      where: {
        slug,
      },
      include: {
        links: true,
      },
    });
  }

  @PrimeDataLoader(AuthorDataloaderService)
  async getAuthors({
    filter,
    sort = AuthorSort.ModifiedAt,
    order = SortOrder.Descending,
    cursorId,
    skip = 0,
    take = 10,
  }: AuthorListArgs) {
    const where = createAuthorFilter(filter);
    const prismaOrder = graphQLSortOrderToPrisma(order);

    const orderBy: Record<string, string> = {};
    orderBy[lowercaseFirstLetter(sort)] = prismaOrder;

    const [totalCount, authors] = await Promise.all([
      this.prisma.author.count({ where }),
      this.prisma.author.findMany({
        where,
        take: getMaxTake(take) + 1, // Take one more to check for next page
        skip,
        cursor: cursorId ? { id: cursorId } : undefined,
        orderBy,
        include: {
          links: true,
        },
      }),
    ]);

    // Slice to the requested amount
    const nodes = authors.slice(0, getMaxTake(take)) as unknown as Author[];
    const firstAuthor = nodes[0];
    const lastAuthor = nodes[nodes.length - 1];

    // Determine if there are previous/next pages
    const hasNextPage = authors.length > nodes.length;
    const hasPreviousPage = Boolean(skip);

    return {
      nodes,
      totalCount,
      pageInfo: {
        hasNextPage,
        hasPreviousPage,
        startCursor: firstAuthor?.id,
        endCursor: lastAuthor?.id,
      },
    };
  }

  @PrimeDataLoader(AuthorDataloaderService)
  async updateAuthor({ id, bio, links, tagIds, ...input }: UpdateAuthorInput) {
    return this.prisma.author.update({
      where: {
        id,
      },
      data: {
        ...input,
        bio: bio as any[],
        links: {
          deleteMany: {
            authorId: {
              equals: id,
            },
          },
          create: links,
        },
        tags: {
          deleteMany: {
            tagId: {
              notIn: tagIds,
            },
          },
          createMany: {
            skipDuplicates: true,
            data:
              tagIds?.map(tagId => ({
                tagId,
              })) ?? [],
          },
        },
      },
    });
  }

  @PrimeDataLoader(AuthorDataloaderService)
  async createAuthor({ bio, tagIds, links, ...input }: CreateAuthorInput) {
    return this.prisma.author.create({
      data: {
        ...input,
        bio: bio as any[],
        links: {
          create: links,
        },
        tags: {
          createMany: {
            data: tagIds.map(tagId => ({
              tagId,
            })),
            skipDuplicates: true,
          },
        },
      },
    });
  }

  async deleteAuthor(id: string) {
    return this.prisma.author.delete({
      where: {
        id,
      },
    });
  }
}

/**
 * Creates a filter for author name
 */
export const createNameFilter = (
  filter?: Partial<AuthorFilter>
): Prisma.AuthorWhereInput => {
  if (filter?.name) {
    return {
      name: {
        contains: filter.name,
        mode: 'insensitive',
      },
    };
  }

  return {};
};

/**
 * Creates a filter for author tags
 */
export const createTagIdsFilter = (
  filter?: Partial<AuthorFilter>
): Prisma.AuthorWhereInput => {
  if (filter?.tagIds?.length) {
    return {
      tags: {
        some: {
          tagId: {
            in: filter?.tagIds,
          },
        },
      },
    };
  }

  return {};
};

/**
 * Creates a filter for hideOnTeam property
 */
export const createHideOnTeamFilter = (
  filter?: Partial<AuthorFilter>
): Prisma.AuthorWhereInput => {
  if (filter?.hideOnTeam !== undefined) {
    return {
      hideOnTeam: filter.hideOnTeam,
    };
  }
  return {};
};

/**
 * Combines all author filters into a single filter
 */
export const createAuthorFilter = (
  filter?: Partial<AuthorFilter>
): Prisma.AuthorWhereInput => {
  if (!filter) return {};

  return {
    AND: [
      createNameFilter(filter),
      createTagIdsFilter(filter),
      createHideOnTeamFilter(filter),
    ],
  };
};
