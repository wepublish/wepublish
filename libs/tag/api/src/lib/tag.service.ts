import {Injectable} from '@nestjs/common'
import {Prisma, PrismaClient} from '@prisma/client'
import {TagFilter, TagSort} from './tags.query'
import {getMaxTake, PrimeDataLoader, SortOrder} from '@wepublish/utils/api'
import {TagFields} from './tag.model'
import {TagDataloader} from './tag.dataloader'

@Injectable()
export class TagService {
  constructor(private prisma: PrismaClient) {}

  @PrimeDataLoader(TagDataloader)
  async getTags(
    filter?: TagFilter,
    sort: TagSort = TagSort.CreatedAt,
    order: SortOrder = SortOrder.Descending,
    cursorId: string | null = null,
    skip = 0,
    take = 10
  ) {
    const where = this.createTagFilter(filter)
    const orderBy = this.createTagOrder(sort, order)

    const [totalCount, tags] = await Promise.all([
      this.prisma.tag.count({
        where,
        orderBy
      }),
      this.prisma.tag.findMany({
        where,
        skip,
        take: getMaxTake(take) + 1,
        orderBy,
        cursor: cursorId ? {id: cursorId} : undefined
      })
    ])

    const nodes = tags.slice(0, take)
    const firstTag = nodes[0]
    const lastTag = nodes[nodes.length - 1]

    const hasPreviousPage = Boolean(skip)
    const hasNextPage = tags.length > nodes.length

    return {
      nodes,
      totalCount,
      pageInfo: {
        hasPreviousPage,
        hasNextPage,
        startCursor: firstTag?.id,
        endCursor: lastTag?.id
      }
    }
  }

  @PrimeDataLoader(TagDataloader)
  async getTagsByAuthorId(authorId: string): Promise<TagFields[]> {
    return this.prisma.tag.findMany({
      where: {
        authors: {
          some: {
            authorId
          }
        }
      }
    })
  }

  @PrimeDataLoader(TagDataloader)
  async getTagsByEventId(eventId: string): Promise<TagFields[]> {
    return this.prisma.tag.findMany({
      where: {
        events: {
          some: {
            eventId
          }
        }
      }
    })
  }

  @PrimeDataLoader(TagDataloader)
  async getTagsByArticleId(articleId: string): Promise<TagFields[]> {
    return this.prisma.tag.findMany({
      where: {
        articles: {
          some: {
            articleId
          }
        }
      }
    })
  }

  @PrimeDataLoader(TagDataloader)
  async getTagsByPageId(pageId: string): Promise<TagFields[]> {
    return this.prisma.tag.findMany({
      where: {
        pages: {
          some: {
            pageId
          }
        }
      }
    })
  }

  @PrimeDataLoader(TagDataloader)
  async getTagsByCommentId(commentId: string): Promise<TagFields[]> {
    return this.prisma.tag.findMany({
      where: {
        comments: {
          some: {
            commentId
          }
        }
      }
    })
  }

  private createTagOrder(
    field: TagSort,
    sortOrder: SortOrder
  ): Prisma.TagOrderByWithRelationAndSearchRelevanceInput {
    switch (field) {
      case TagSort.Tag:
        return {
          tag: sortOrder === SortOrder.Ascending ? 'asc' : 'desc'
        }

      case TagSort.ModifiedAt:
        return {
          modifiedAt: sortOrder === SortOrder.Ascending ? 'asc' : 'desc'
        }

      case TagSort.CreatedAt:
      default:
        return {
          createdAt: sortOrder === SortOrder.Ascending ? 'asc' : 'desc'
        }
    }
  }

  private createTagFilter(filter?: TagFilter): Prisma.TagWhereInput {
    const conditions: Prisma.TagWhereInput[] = []

    if (filter?.type) {
      conditions.push({
        type: filter.type
      })
    }

    if (filter?.tag) {
      conditions.push({
        tag: {
          mode: 'insensitive',
          equals: filter.tag
        }
      })
    }

    return conditions.length ? {AND: conditions} : {}
  }
}
