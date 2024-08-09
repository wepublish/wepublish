import {Prisma, PrismaClient} from '@prisma/client'
import {SortOrder, graphQLSortOrderToPrisma, getMaxTake} from '@wepublish/utils/api'
import {ArticleFilter, ArticleSort, ArticleWithRevisions} from '../../db/article'
import {ConnectionResult} from '../../db/common'
import {mapDateFilterToPrisma} from '../utils'

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
        published: {
          publishedAt: graphQLSortOrderToPrisma(sortOrder)
        }
      }

    case ArticleSort.UpdatedAt:
      return {
        published: {
          updatedAt: graphQLSortOrderToPrisma(sortOrder)
        }
      }

    case ArticleSort.PublishAt:
      return {
        pending: {
          publishAt: graphQLSortOrderToPrisma(sortOrder)
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

const createPreTitleFilter = (filter: Partial<ArticleFilter>): Prisma.ArticleWhereInput => {
  if (filter?.preTitle) {
    const containsPreTitle: Prisma.ArticleRevisionWhereInput = {
      preTitle: {
        contains: filter.preTitle,
        mode: 'insensitive'
      }
    }

    return {
      OR: [{draft: containsPreTitle}, {pending: containsPreTitle}, {published: containsPreTitle}]
    }
  }

  return {}
}

const createLeadFilter = (filter: Partial<ArticleFilter>): Prisma.ArticleWhereInput => {
  if (filter?.lead) {
    const containsLead: Prisma.ArticleRevisionWhereInput = {
      lead: {
        contains: filter.lead,
        mode: 'insensitive'
      }
    }

    return {
      OR: [{draft: containsLead}, {pending: containsLead}, {published: containsLead}]
    }
  }

  return {}
}

const createPublicationDateFromFilter = (
  filter: Partial<ArticleFilter>
): Prisma.ArticleWhereInput => {
  if (filter?.publicationDateFrom) {
    const {comparison, date} = filter.publicationDateFrom
    const compare = mapDateFilterToPrisma(comparison)

    const filterBy: Prisma.ArticleRevisionWhereInput = {
      publishedAt: {
        [compare]: date
      }
    }
    return {
      AND: [{published: filterBy}]
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

    const filterBy: Prisma.ArticleRevisionWhereInput = {
      publishedAt: {
        [compare]: date
      }
    }
    return {
      AND: [{published: filterBy}]
    }
  }

  return {}
}

const createPublishedFilter = (filter: Partial<ArticleFilter>): Prisma.ArticleWhereInput => {
  if (filter?.published != null) {
    return {
      publishedId: filter.published
        ? {
            not: null
          }
        : null
    }
  }

  return {}
}

const createDraftFilter = (filter: Partial<ArticleFilter>): Prisma.ArticleWhereInput => {
  if (filter?.draft != null) {
    return {
      draftId: filter.draft
        ? {
            not: null
          }
        : null
    }
  }

  return {}
}

const createPendingFilter = (filter: Partial<ArticleFilter>): Prisma.ArticleWhereInput => {
  if (filter?.pending != null) {
    return {
      pendingId: filter.pending
        ? {
            not: null
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
  const tagIds = filter?.tags?.ids
  let hasTags = undefined satisfies Prisma.TaggedArticlesListRelationFilter

  // filter by tag ids
  if (tagIds?.length) {
    hasTags = {
      some: {
        tag: {
          id: {
            in: tagIds
          }
        }
      }
    }
  }

  // filter by tag names
  const tagNames = filter?.tags?.tags
  if (tagNames?.length) {
    hasTags = {
      some: {
        tag: {
          tag: {
            in: tagNames
          }
        }
      }
    }
  }

  // return filter
  if (hasTags) {
    return {
      OR: [
        {
          tags: hasTags
        }
      ]
    }
  }

  // no filter
  return {}
}

const createAuthorFilter = (filter: Partial<ArticleFilter>): Prisma.ArticleWhereInput => {
  if (filter?.authors) {
    const hasAuthors: Prisma.ArticleRevisionRelationFilter = {
      is: {
        authors: {
          some: {
            authorId: {
              in: filter.authors
            }
          }
        }
      }
    }

    return {
      OR: [{draft: hasAuthors}, {pending: hasAuthors}, {published: hasAuthors}]
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

export const createArticleFilter = (filter: Partial<ArticleFilter>): Prisma.ArticleWhereInput => ({
  AND: [
    createTitleFilter(filter),
    createPreTitleFilter(filter),
    createPublicationDateFromFilter(filter),
    createPublicationDateToFilter(filter),
    createLeadFilter(filter),
    createSharedFilter(filter),
    createTagsFilter(filter),
    createAuthorFilter(filter),
    createHiddenFilter(filter),
    {
      OR: [createPublishedFilter(filter), createDraftFilter(filter), createPendingFilter(filter)]
    }
  ]
})

export const getArticles = async (
  filter: Partial<ArticleFilter>,
  sortedField: ArticleSort,
  order: SortOrder,
  cursorId: string | null,
  skip: number,
  take: number,
  article: PrismaClient['article']
): Promise<ConnectionResult<ArticleWithRevisions>> => {
  const orderBy = createArticleOrder(sortedField, order)
  const where = createArticleFilter(filter)

  const [totalCount, articles] = await Promise.all([
    article.count({
      where,
      orderBy
    }),
    article.findMany({
      where,
      skip,
      take: getMaxTake(take) + 1,
      orderBy,
      cursor: cursorId ? {id: cursorId} : undefined,
      include: {
        draft: {
          include: {
            properties: true,
            authors: true,
            socialMediaAuthors: true
          }
        },
        pending: {
          include: {
            properties: true,
            authors: true,
            socialMediaAuthors: true
          }
        },
        published: {
          include: {
            properties: true,
            authors: true,
            socialMediaAuthors: true
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
