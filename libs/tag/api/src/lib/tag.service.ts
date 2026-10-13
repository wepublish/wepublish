import { PublicContentCacheInvalidator } from '@wepublish/kv-ttl-cache/api';
import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient, TagType } from '@prisma/client';
import { getMaxTake, PrimeDataLoader, SortOrder } from '@wepublish/utils/api';
import { TagDataloader } from './tag.dataloader';
import {
  CreateTagInput,
  TagFilter,
  TagListArgs,
  TagSort,
  UpdateTagInput,
} from './tag.model';

@Injectable()
export class TagService {
  constructor(
    private prisma: PrismaClient,
    private publicContentCache: PublicContentCacheInvalidator
  ) {}

  @PrimeDataLoader(TagDataloader)
  async getTags({
    filter,
    sort = TagSort.CreatedAt,
    order = SortOrder.Descending,
    cursorId,
    skip = 0,
    take = 10,
  }: TagListArgs) {
    const where = createTagFilter(filter);
    const orderBy = createTagOrder(sort, order);

    const [totalCount, tags] = await Promise.all([
      this.prisma.tag.count({
        where,
        orderBy,
      }),
      this.prisma.tag.findMany({
        where,
        skip,
        take: getMaxTake(take) + 1,
        orderBy,
        cursor: cursorId ? { id: cursorId } : undefined,
      }),
    ]);

    const nodes = tags.slice(0, getMaxTake(take));
    const firstTag = nodes[0];
    const lastTag = nodes[nodes.length - 1];

    const hasPreviousPage = Boolean(skip);
    const hasNextPage = tags.length > nodes.length;

    return {
      nodes,
      totalCount,
      pageInfo: {
        hasPreviousPage,
        hasNextPage,
        startCursor: firstTag?.id,
        endCursor: lastTag?.id,
      },
    };
  }

  @PrimeDataLoader(TagDataloader)
  async getTagByName(tag: string, type: TagType) {
    return this.prisma.tag.findFirst({
      where: {
        type,
        tag: {
          mode: 'insensitive',
          equals: tag,
        },
      },
    });
  }

  @PrimeDataLoader(TagDataloader)
  async updateTag({ id, description, ...input }: UpdateTagInput) {
    const result = await this.prisma.tag.update({
      where: {
        id,
      },
      data: {
        ...input,
        description: description as any,
      },
    });
    await this.publicContentCache.invalidate('articles');

    return result;
  }

  @PrimeDataLoader(TagDataloader)
  async createTag({ description, ...input }: CreateTagInput) {
    const result = await this.prisma.tag.create({
      data: {
        ...input,
        description: description as any,
      },
    });
    await this.publicContentCache.invalidate();

    return result;
  }

  async deleteTag(id: string) {
    const result = await this.prisma.tag.delete({
      where: {
        id,
      },
    });
    await this.publicContentCache.invalidate('articles', 'pages');

    return result;
  }
}

function createTagOrder(
  field: TagSort,
  sortOrder: SortOrder
): Prisma.TagOrderByWithRelationInput {
  switch (field) {
    case TagSort.Tag:
      return {
        tag: sortOrder === SortOrder.Ascending ? 'asc' : 'desc',
      };

    case TagSort.ModifiedAt:
      return {
        modifiedAt: sortOrder === SortOrder.Ascending ? 'asc' : 'desc',
      };

    case TagSort.CreatedAt:
    default:
      return {
        createdAt: sortOrder === SortOrder.Ascending ? 'asc' : 'desc',
      };
  }
}

function createTagFilter(filter?: TagFilter): Prisma.TagWhereInput {
  const conditions: Prisma.TagWhereInput[] = [];

  if (filter?.type) {
    conditions.push({
      type: filter.type,
    });
  }

  if (filter?.tag) {
    conditions.push({
      tag: {
        mode: 'insensitive',
        contains: filter.tag,
      },
    });
  }

  if (filter?.tags?.length) {
    conditions.push({
      tag: {
        in: filter.tags,
        mode: 'insensitive',
      },
    });
  }

  return conditions.length ? { AND: conditions } : {};
}
