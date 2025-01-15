import {PrismaClient} from '@prisma/client'
import {ArticleSort, articleWithRevisionsToPublicArticle} from '../../db/article'
import {PageSort, pageWithRevisionsToPublicPage} from '../../db/page'
import {Context} from '../../context'
import {createPageOrder} from '../page/page.queries'
import {createArticleOrder} from '../article/article.queries'
import {SortOrder, getMaxTake} from '@wepublish/utils/api'

export const queryPhrase = async (
  query: string,
  prisma: PrismaClient,
  publicArticlesLoader: Context['loaders']['publicArticles'],
  publicPagesLoader: Context['loaders']['publicPagesByID'],
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
      WHERE to_tsvector('english', ar.title) ||  jsonb_to_tsvector(
         'english',
         jsonb_path_query_array(ar.blocks, 'strict $.**.text'),
         '["string"]'
         )@@ to_tsquery('english', ${query});
    `,
    prisma.$queryRaw<{id: string}[]>`
      SELECT p.id FROM pages p
      JOIN public."pages.revisions" pr on p."publishedId" = pr.id
      WHERE to_tsvector('english', pr.title) ||  jsonb_to_tsvector(
         'english',
         jsonb_path_query_array(blocks, 'strict $.**.text'),
         '["string"]'
         )@@ to_tsquery('english', ${query});
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
      include: {
        published: {
          include: {
            properties: true,
            authors: true,
            socialMediaAuthors: true
          }
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

  const publicArticles = articles.map(articleWithRevisionsToPublicArticle)
  publicArticles.forEach(article => publicArticlesLoader.prime(article.id, article))

  const firstArticle = publicArticles[0]
  const lastArticle = publicArticles[publicArticles.length - 1]
  const articlesHasNextPage = articleIds.length > skip + publicArticles.length

  const publicPages = pages.map(pageWithRevisionsToPublicPage)
  publicPages.forEach(page => publicPagesLoader.prime(page.id, page))

  const firstPage = publicPages[0]
  const lastPage = publicPages[publicPages.length - 1]
  const pagesHasNextPage = pageIds.length > skip + publicPages.length

  return {
    articles: {
      nodes: publicArticles,
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
