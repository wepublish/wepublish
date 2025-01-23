import {PrismaClient} from '@prisma/client'
import {ArticleSort, articleWithRevisionsToPublicArticle} from '../../db/article'
import {PageSort, pageWithRevisionsToPublicPage} from '../../db/page'
import {Context} from '../../context'
import {createPageOrder} from '../page/page.queries'
import {createArticleOrder} from '../article/article.queries'
import {SortOrder, getMaxTake} from '@wepublish/utils/api'
import {Search} from '../search/search'

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
  const startTime = Date.now()

  const [articleIds, pageIds] = await Promise.all([
    Search.searchArticles(prisma, query),
    Search.searchPages(prisma, query)
  ])

  const endTime = Date.now()
  console.log(`Query execution time: ${endTime - startTime} ms`)

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
