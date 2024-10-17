import {PrismaClient} from '@prisma/client'
import {PageSort, pageWithRevisionsToPublicPage} from '../../db/page'
import {createPageOrder} from '../page/page.queries'
import {SortOrder, getMaxTake} from '@wepublish/utils/api'
import {ArticleSort, createArticleOrder} from '@wepublish/article/api'

export const queryPhrase = async (
  query: string,
  prisma: PrismaClient,
  take: number,
  skip: number,
  pageSort: PageSort,
  articleSort: ArticleSort,
  order: SortOrder
) => {
  // Default add & if no specific query is given to prevent search to fail!
  query = query.replace(/\s+/g, '&')

  const [foundArticleIds, foundPageIds] = await Promise.all([
    prisma.$queryRaw<{id: string}[]>`
      SELECT a.id FROM articles a
      JOIN public."articles.revisions" ar on a."publishedId" = ar.id
      WHERE to_tsvector('german', ar.title) ||  to_tsvector('german', ar.lead)@@ to_tsquery('german', ${query});
    `,
    prisma.$queryRaw<{id: string}[]>`
      SELECT p.id FROM pages p
      JOIN public."pages.revisions" pr on p."publishedId" = pr.id
      WHERE to_tsvector('german', pr.title) ||  jsonb_to_tsvector(
         'german',
         jsonb_path_query_array(blocks, 'strict $.**.text'),
         '["string"]'
         )@@ to_tsquery('german', ${query});
    `
  ])

  const articleIds = foundArticleIds.map(({id}) => id)
  const pageIds = foundPageIds.map(({id}) => id)

  const [articles, pages] = await Promise.all([
    prisma.article.findMany({
      where: {
        id: {
          in: articleIds
        }
      },
      orderBy: createArticleOrder(articleSort, order),
      skip,
      take: getMaxTake(take)
    }),

    prisma.page.findMany({
      where: {
        id: {
          in: pageIds
        }
      },
      include: {
        published: {
          include: {
            properties: true
          }
        }
      },
      orderBy: createPageOrder(pageSort, order),
      skip,
      take: getMaxTake(take)
    })
  ])

  const firstArticle = articles[0]
  const lastArticle = articles[articles.length - 1]
  const articlesHasNextPage = articleIds.length > skip + articles.length

  const publicPages = pages.map(pageWithRevisionsToPublicPage)

  const firstPage = publicPages[0]
  const lastPage = publicPages[publicPages.length - 1]
  const pagesHasNextPage = pageIds.length > skip + publicPages.length

  return {
    articles: {
      nodes: articles,
      totalCount: articleIds.length,
      pageInfo: {
        hasPreviousPage: Boolean(skip),
        hasNextPage: articlesHasNextPage,
        startCursor: firstArticle?.id,
        endCursor: lastArticle?.id
      }
    },
    pages: {
      nodes: publicPages,
      totalCount: pageIds.length,
      pageInfo: {
        hasPreviousPage: Boolean(skip),
        hasNextPage: pagesHasNextPage,
        startCursor: firstPage?.id,
        endCursor: lastPage?.id
      }
    }
  }
}
