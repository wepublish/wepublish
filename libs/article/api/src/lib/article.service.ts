import {Injectable, NotFoundException} from '@nestjs/common'
import {Prisma, PrismaClient} from '@prisma/client'
import {
  ArticleFilter,
  ArticleListArgs,
  ArticleSort,
  CreateArticleInput,
  UpdateArticleInput
} from './article.model'
import {ArticleDataloaderService} from './article-dataloader.service'
import {
  getMaxTake,
  graphQLSortOrderToPrisma,
  mapDateFilterToPrisma,
  PrimeDataLoader,
  SortOrder
} from '@wepublish/utils/api'
import {
  BlockContent,
  mapBlockUnionMap,
  RichTextBlock,
  BlockType
} from '@wepublish/block-content/api'
import {TrackingPixelService} from '@wepublish/tracking-pixel/api'
import {toPlaintext} from '@wepublish/richtext'

@Injectable()
export class ArticleService {
  constructor(private prisma: PrismaClient, private trackingPixelService: TrackingPixelService) {}

  @PrimeDataLoader(ArticleDataloaderService)
  async getArticleBySlug(slug: string) {
    return this.prisma.article.findFirst({
      where: {
        slug
      }
    })
  }

  @PrimeDataLoader(ArticleDataloaderService)
  async getArticles({
    filter,
    cursorId,
    sort = ArticleSort.PublishedAt,
    order = SortOrder.Descending,
    take = 10,
    skip
  }: ArticleListArgs) {
    const orderBy = createArticleOrder(sort, order)
    const where = createArticleFilter(filter ?? {})

    const [totalCount, articles] = await Promise.all([
      this.prisma.article.count({
        where,
        orderBy
      }),
      this.prisma.article.findMany({
        where,
        skip,
        take: getMaxTake(take) + 1,
        orderBy,
        cursor: cursorId ? {id: cursorId} : undefined
      })
    ])

    const nodes = articles.slice(0, take)
    const firstArticle = nodes[0]
    const lastArticle = nodes[nodes.length - 1]

    const hasPreviousPage = Boolean(skip)
    const hasNextPage = articles.length > nodes.length

    return {
      nodes,
      totalCount,
      pageInfo: {
        hasPreviousPage,
        hasNextPage,
        startCursor: firstArticle?.id,
        endCursor: lastArticle?.id
      }
    }
  }

  @PrimeDataLoader(ArticleDataloaderService)
  async createArticle(
    {
      slug,
      shared,
      hidden,
      likes,
      disableComments,
      authorIds,
      socialMediaAuthorIds,
      tagIds,
      properties,
      blocks,
      paywallId,
      ...revision
    }: CreateArticleInput,
    userId: string | null | undefined
  ) {
    const mappedBlocks = blocks.map(mapBlockUnionMap)
    const searchPlainText = blocksToSearchText(mappedBlocks)

    const article = await this.prisma.article.create({
      data: {
        paywallId,
        likes,
        slug,
        shared,
        hidden,
        disableComments,
        tags: {
          createMany: {
            data: tagIds.map(tagId => ({
              tagId
            })),
            skipDuplicates: true
          }
        },
        revisions: {
          create: {
            ...revision,
            userId,
            blocks: mappedBlocks as any[],
            searchPlainText,
            properties: {
              createMany: {
                data: properties
              }
            },
            authors: {
              createMany: {
                data: authorIds.map(authorId => ({authorId}))
              }
            },
            socialMediaAuthors: {
              createMany: {
                data: socialMediaAuthorIds.map(authorId => ({authorId}))
              }
            }
          }
        }
      }
    })

    if (!article.peerId) {
      const trackingPixels = await this.trackingPixelService.getArticlePixels(article.id)
      await this.prisma.articleTrackingPixels.createMany({
        data: trackingPixels
      })
    }

    return article
  }

  @PrimeDataLoader(ArticleDataloaderService)
  async updateArticle(
    {
      id,
      likes,
      slug,
      shared,
      paywallId,
      hidden,
      disableComments,
      authorIds,
      socialMediaAuthorIds,
      tagIds,
      properties,
      blocks,
      ...revision
    }: UpdateArticleInput,
    userId: string | null | undefined
  ) {
    const article = await this.prisma.article.findUnique({
      where: {id},
      include: {
        tags: true
      }
    })

    if (!article) {
      throw new NotFoundException(`Article with id ${id} not found`)
    }

    const mappedBlocks = blocks.map(mapBlockUnionMap)
    const searchPlainText = blocksToSearchText(mappedBlocks)

    return this.prisma.article.update({
      where: {id},
      data: {
        likes,
        slug,
        paywallId,
        shared,
        hidden,
        disableComments,
        revisions: {
          create: {
            ...revision,
            blocks: mappedBlocks as any[],
            searchPlainText,
            userId,
            properties: {
              createMany: {
                data: properties.map(property => ({
                  key: property.key,
                  value: property.value,
                  public: property.public
                }))
              }
            },
            authors: {
              createMany: {
                data: authorIds.map(authorId => ({authorId}))
              }
            },
            socialMediaAuthors: {
              createMany: {
                data: socialMediaAuthorIds.map(authorId => ({authorId}))
              }
            }
          }
        },
        tags: {
          deleteMany: {
            tagId: {
              notIn: tagIds
            }
          },
          createMany: {
            data: tagIds
              .filter(tagId => !article.tags.some(tag => tag.tagId === tagId))
              .map(tagId => ({
                tagId
              }))
          }
        }
      }
    })
  }

  async deleteArticle(id: string) {
    const article = await this.prisma.article.findUnique({
      where: {id}
    })

    if (!article) {
      throw new NotFoundException(`Article with id ${id} not found`)
    }

    return this.prisma.article.delete({
      where: {
        id
      }
    })
  }

  @PrimeDataLoader(ArticleDataloaderService)
  async publishArticle(id: string, publishedAt: Date) {
    const article = await this.prisma.article.findUnique({
      where: {id},
      include: {
        revisions: {
          take: 1,
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!article?.revisions?.[0]) {
      throw new NotFoundException(`Article with id ${id} not found`)
    }

    // Unpublish existing pending revisions
    await this.prisma.articleRevision.updateMany({
      data: {
        publishedAt: null
      },
      where: {
        articleId: id,
        publishedAt: {
          gte: new Date()
        }
      }
    })

    const articlePublishedAt =
      !article.publishedAt || article.publishedAt > publishedAt ? publishedAt : article.publishedAt

    return this.prisma.article.update({
      where: {
        id
      },
      data: {
        publishedAt: articlePublishedAt,
        modifiedAt: new Date(),
        revisions: {
          update: {
            where: {
              id: article.revisions[0].id
            },
            data: {
              publishedAt
            }
          }
        }
      }
    })
  }

  @PrimeDataLoader(ArticleDataloaderService)
  async unpublishArticle(id: string) {
    const article = await this.prisma.article.findUnique({
      where: {id}
    })

    if (!article) {
      throw new NotFoundException(`Article with id ${id} not found`)
    }

    return this.prisma.article.update({
      where: {
        id
      },
      data: {
        publishedAt: null,
        revisions: {
          updateMany: {
            where: {
              publishedAt: {
                not: null
              }
            },
            data: {
              publishedAt: null
            }
          }
        }
      }
    })
  }

  @PrimeDataLoader(ArticleDataloaderService)
  async duplicateArticle(id: string, userId: string | null | undefined) {
    const article = await this.prisma.article.findUnique({
      where: {
        id
      },
      include: {
        tags: true,
        revisions: {
          take: 1,
          orderBy: {
            createdAt: 'desc'
          },
          include: {
            properties: true,
            authors: true,
            socialMediaAuthors: true
          }
        }
      }
    })

    if (!article?.revisions?.[0]) {
      throw new NotFoundException(`Article with id ${id} not found`)
    }

    const [
      {
        id: _id,
        createdAt: _createdAt,
        publishedAt: _publishedAt,
        userId: _userId,
        articleId: _articleId,
        properties,
        authors,
        socialMediaAuthors,
        ...revision
      }
    ] = article.revisions

    return this.prisma.article.create({
      data: {
        paywallId: article.paywallId,
        shared: article.shared,
        hidden: article.hidden,
        disableComments: article.disableComments,
        tags: {
          createMany: {
            data: article.tags.map(({tagId}) => ({
              tagId
            })),
            skipDuplicates: true
          }
        },
        revisions: {
          create: {
            ...revision,
            userId,
            blocks: revision.blocks || [],
            properties: {
              createMany: {
                data: properties.map(property => ({
                  key: property.key,
                  value: property.value,
                  public: property.public
                }))
              }
            },
            authors: {
              createMany: {
                data: authors.map(({authorId}) => ({authorId}))
              }
            },
            socialMediaAuthors: {
              createMany: {
                data: socialMediaAuthors.map(({authorId}) => ({authorId}))
              }
            }
          }
        }
      }
    })
  }

  @PrimeDataLoader(ArticleDataloaderService)
  async likeArticle(id: string) {
    return this.prisma.article.update({
      where: {
        id
      },
      data: {
        likes: {
          increment: 1
        }
      }
    })
  }

  @PrimeDataLoader(ArticleDataloaderService)
  async dislikeArticle(id: string) {
    const article = await this.prisma.article.findUnique({
      where: {
        id
      }
    })

    if (!article?.likes) {
      return article
    }

    return this.prisma.article.update({
      where: {
        id
      },
      data: {
        likes: {
          decrement: 1
        }
      }
    })
  }

  async getTagIds(articleId: string) {
    return this.prisma.tag.findMany({
      select: {
        id: true
      },
      where: {
        articles: {
          some: {
            articleId
          }
        }
      }
    })
  }

  async getTrackingPixels(articleId: string) {
    return this.prisma.articleTrackingPixels.findMany({
      where: {
        articleId
      },
      include: {
        trackingPixelMethod: true
      }
    })
  }
}

export const createArticleOrder = (
  field: ArticleSort,
  sortOrder: SortOrder
): Prisma.ArticleFindManyArgs['orderBy'] => {
  switch (field) {
    case ArticleSort.CreatedAt:
      return {
        createdAt: graphQLSortOrderToPrisma(sortOrder)
      }

    case ArticleSort.ModifiedAt:
      return {
        modifiedAt: graphQLSortOrderToPrisma(sortOrder)
      }

    case ArticleSort.PublishedAt:
      return {
        publishedAt: graphQLSortOrderToPrisma(sortOrder)
      }
  }
}

const createTitleFilter = (filter: Partial<ArticleFilter>): Prisma.ArticleWhereInput => {
  if (filter?.title) {
    return {
      revisions: {
        some: {
          title: {
            contains: filter.title,
            mode: 'insensitive'
          }
        }
      }
    }
  }

  return {}
}

const createPreTitleFilter = (filter: Partial<ArticleFilter>): Prisma.ArticleWhereInput => {
  if (filter?.preTitle) {
    return {
      revisions: {
        some: {
          preTitle: {
            contains: filter.preTitle,
            mode: 'insensitive'
          }
        }
      }
    }
  }

  return {}
}

const createLeadFilter = (filter: Partial<ArticleFilter>): Prisma.ArticleWhereInput => {
  if (filter?.lead) {
    return {
      revisions: {
        some: {
          lead: {
            contains: filter.lead,
            mode: 'insensitive'
          }
        }
      }
    }
  }

  return {}
}

const createBodyFilter = (filter: Partial<ArticleFilter>): Prisma.ArticleWhereInput => {
  if (filter?.body) {
    return {
      revisions: {
        some: {
          searchPlainText: {
            contains: filter.body,
            mode: 'insensitive'
          }
        }
      }
    }
  }

  return {}

  return {}
}

const createPublicationDateFromFilter = (
  filter: Partial<ArticleFilter>
): Prisma.ArticleWhereInput => {
  if (filter?.publicationDateFrom) {
    const {comparison, date} = filter.publicationDateFrom
    const compare = mapDateFilterToPrisma(comparison)

    return {
      publishedAt: {
        [compare]: date
      }
    }
  }

  return {}
}

const createPublicationDateToFilter = (
  filter: Partial<ArticleFilter>
): Prisma.ArticleWhereInput => {
  if (filter?.publicationDateTo) {
    const {comparison, date} = filter.publicationDateTo
    const compare = mapDateFilterToPrisma(comparison)

    return {
      publishedAt: {
        [compare]: date
      }
    }
  }

  return {}
}

const createPublishedFilter = (filter: Partial<ArticleFilter>): Prisma.ArticleWhereInput => {
  if (filter?.published != null) {
    return {
      publishedAt: filter.published ? {lte: new Date()} : {not: {lte: new Date()}}
    }
  }

  return {}
}

const createDraftFilter = (filter: Partial<ArticleFilter>): Prisma.ArticleWhereInput => {
  if (filter?.draft != null) {
    return {
      revisions: {
        some: {
          publishedAt: filter.draft ? null : {not: null}
        }
      }
    }
  }

  return {}
}

const createPendingFilter = (filter: Partial<ArticleFilter>): Prisma.ArticleWhereInput => {
  if (filter?.pending != null) {
    return {
      revisions: {
        some: {
          publishedAt: filter.pending ? {gt: new Date()} : {not: {gt: new Date()}}
        }
      }
    }
  }

  return {}
}

const createSharedFilter = (filter: Partial<ArticleFilter>): Prisma.ArticleWhereInput => {
  if (filter?.shared != null) {
    return {
      shared: filter.shared
    }
  }

  return {}
}

const createTagsFilter = (filter: Partial<ArticleFilter>): Prisma.ArticleWhereInput => {
  if (filter?.tags?.length) {
    const hasTags = {
      some: {
        tag: {
          id: {
            in: filter.tags
          }
        }
      }
    } satisfies Prisma.TaggedArticlesListRelationFilter

    return {
      tags: hasTags
    }
  }

  return {}
}

const createAuthorFilter = (filter: Partial<ArticleFilter>): Prisma.ArticleWhereInput => {
  if (filter?.authors) {
    return {
      revisions: {
        some: {
          authors: {
            some: {
              authorId: {
                in: filter.authors
              }
            }
          }
        }
      }
    }
  }

  return {}
}

const createHiddenFilter = (filter: Partial<ArticleFilter>): Prisma.ArticleWhereInput => {
  if (filter?.includeHidden) {
    return {}
  }

  return {
    hidden: false
  }
}

const createPeerIdFilter = (filter: Partial<ArticleFilter>): Prisma.ArticleWhereInput => {
  if (filter?.peerId) {
    return {
      peerId: filter.peerId
    }
  }

  return {}
}

export const createArticleFilter = (filter: Partial<ArticleFilter>): Prisma.ArticleWhereInput => ({
  AND: [
    createTitleFilter(filter),
    createPreTitleFilter(filter),
    createPublicationDateFromFilter(filter),
    createPublicationDateToFilter(filter),
    createLeadFilter(filter),
    createBodyFilter(filter),
    createSharedFilter(filter),
    createTagsFilter(filter),
    createAuthorFilter(filter),
    createHiddenFilter(filter),
    createPeerIdFilter(filter),
    {
      OR: [createPublishedFilter(filter), createDraftFilter(filter), createPendingFilter(filter)]
    }
  ]
})

/**
 * Parse rich text blocks to plain text. It allows to search in articles and pages for the whole content.
 * TODO: write migration for existing articles and pages. Implement function on all page mutations.
 * @param blocks
 * @returns
 */
export function blocksToSearchText(blocks: Array<typeof BlockContent>): string | undefined {
  if (!blocks) {
    return
  }

  try {
    const richTextBlocks = blocks.filter(
      (block): block is RichTextBlock => block.type === BlockType.RichText
    )

    return richTextBlocks.map(richTextBlock => toPlaintext(richTextBlock.richText)).join(' ')
  } catch (error) {
    console.log(error)
  }

  return undefined
}
