import {Prisma, PrismaClient} from '@prisma/client'
import {ArticleFilter, ArticleSort, ArticleWithRevisions} from '../../db/article'
import {ConnectionResult, MaxResultsPerPage} from '../../db/common'
import {getSortOrder, SortOrder} from '../queries/sort'

export const createArticleOrder = (
  field: ArticleSort,
  sortOrder: SortOrder
): Prisma.ArticleFindManyArgs['orderBy'] => {
  switch (field) {
    case ArticleSort.CreatedAt:
      return {
        createdAt: sortOrder
      }

    case ArticleSort.ModifiedAt:
      return {
        modifiedAt: sortOrder
      }

    case ArticleSort.PublishedAt:
      return {
        published: {
          publishedAt: sortOrder
        }
      }

    case ArticleSort.UpdatedAt:
      return {
        published: {
          updatedAt: sortOrder
        }
      }

    case ArticleSort.PublishAt:
      return {
        pending: {
          publishAt: sortOrder
        }
      }
  }
}

const createTitleFilter = (filter: Partial<ArticleFilter>): Prisma.ArticleWhereInput => {
  if (filter?.title) {
    const containsTitle: Prisma.ArticleRevisionWhereInput = {
      title: {
        contains: filter.title,
        mode: 'insensitive'
      }
    }

    return {
      OR: [{draft: containsTitle}, {pending: containsTitle}, {published: containsTitle}]
    }
  }

  return {}
}

const createPublishedFilter = (filter: Partial<ArticleFilter>): Prisma.ArticleWhereInput => {
  if (filter?.published != null) {
    return {
      published: filter.published
        ? {
            isNot: null
          }
        : null
    }
  }

  return {}
}

const createDraftFilter = (filter: Partial<ArticleFilter>): Prisma.ArticleWhereInput => {
  if (filter?.draft != null) {
    return {
      draft: filter.draft
        ? {
            isNot: null
          }
        : null
    }
  }

  return {}
}

const createPendingFilter = (filter: Partial<ArticleFilter>): Prisma.ArticleWhereInput => {
  if (filter?.pending != null) {
    return {
      pending: filter.pending
        ? {
            isNot: null
          }
        : null
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
  if (filter?.tags) {
    const hasTags = {
      is: {
        tags: {hasSome: filter.tags}
      }
    }

    return {
      OR: [{draft: hasTags}, {pending: hasTags}, {published: hasTags}]
    }
  }

  return {}
}

const createAuthorFilter = (filter: Partial<ArticleFilter>): Prisma.ArticleWhereInput => {
  if (filter?.authors) {
    const hasAuthors = {
      is: {
        authorIDs: {hasSome: filter.authors}
      }
    }

    return {
      OR: [{draft: hasAuthors}, {pending: hasAuthors}, {published: hasAuthors}]
    }
  }

  return {}
}

export const createArticleFilter = (filter: Partial<ArticleFilter>): Prisma.ArticleWhereInput => ({
  AND: [
    createTitleFilter(filter),
    createPublishedFilter(filter),
    createDraftFilter(filter),
    createPendingFilter(filter),
    createSharedFilter(filter),
    createTagsFilter(filter),
    createAuthorFilter(filter)
  ]
})

export const getArticles = async (
  filter: Partial<ArticleFilter>,
  sortedField: ArticleSort,
  order: 1 | -1,
  cursorId: string | null,
  skip: number,
  take: number,
  article: PrismaClient['article']
): Promise<ConnectionResult<ArticleWithRevisions>> => {
  const orderBy = createArticleOrder(sortedField, getSortOrder(order))
  const where = createArticleFilter(filter)

  const [totalCount, articles] = await Promise.all([
    article.count({
      where: where,
      orderBy: orderBy
    }),
    article.findMany({
      where: where,
      skip: skip,
      take: Math.min(take, MaxResultsPerPage) + 1,
      orderBy: orderBy,
      cursor: cursorId ? {id: cursorId} : undefined,
      include: {
        draft: {
          include: {
            properties: true
          }
        },
        pending: {
          include: {
            properties: true
          }
        },
        published: {
          include: {
            properties: true
          }
        }
      }
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
