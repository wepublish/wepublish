import {PrismaClient} from '@prisma/client'
import {ArticleSort, articleWithRevisionsToPublicArticle} from '../../db/article'
import {PageSort, pageWithRevisionsToPublicPage} from '../../db/page'
import {Context} from '../../context'
import {createPageOrder} from '../page/page.queries'
import {getSortOrder} from '../queries/sort'
import {createArticleOrder} from '../article/article.queries'

export enum PhraseSort {
  CreatedAt = 'CreatedAt',
  ModifiedAt = 'ModifiedAt'
}

export const queryPhrase = async (
  query: string,
  prisma: PrismaClient,
  publicArticlesLoader: Context['loaders']['publicArticles'],
  publicPagesLoader: Context['loaders']['publicPagesByID'],
  take: number,
  skip: number,
  pageSort: PageSort,
  articleSort: ArticleSort,
  order: 1 | -1
) => {
  // Default add & if no specific query is given to prevent search to fail!
  query = query.replace(' ', '&')

  const [articleRevisions, pageRevisions] = await Promise.all([
    prisma.$queryRaw<{id: string}[]>`
      SELECT a.id FROM articles a 
      JOIN public."articles.revisions" ar on a."publishedId" = ar.id
      WHERE to_tsvector('german', ar.title) ||  jsonb_to_tsvector(
         'german',
         jsonb_path_query_array(ar.blocks, 'strict $.**.text'),
         '["string"]'
         )@@ to_tsquery('german', ${query})
      LIMIT ${take}
      OFFSET ${skip};
    `,
    prisma.$queryRaw<{id: string}[]>`
      SELECT p.id FROM pages p
      JOIN public."pages.revisions" pr on p."publishedId" = pr.id
      WHERE to_tsvector('german', pr.title) ||  jsonb_to_tsvector(
         'german',
         jsonb_path_query_array(blocks, 'strict $.**.text'),
         '["string"]'
         )@@ to_tsquery('german', ${query})
      LIMIT ${take}
      OFFSET ${skip};
    `
  ])

  const articleRevisionIds = articleRevisions.map(({id}) => id)
  const pageRevisionIds = pageRevisions.map(({id}) => id)

  const [articles, pages] = await Promise.all([
    prisma.article.findMany({
      where: {
        id: {
          in: articleRevisionIds
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
      orderBy: createArticleOrder(articleSort, getSortOrder(order))
    }),

    prisma.page.findMany({
      where: {
        id: {
          in: pageRevisionIds
        }
      },
      include: {
        published: {
          include: {
            properties: true
          }
        }
      },
      orderBy: createPageOrder(pageSort, getSortOrder(order))
    })
  ])

  const publicArticles = articles.map(articleWithRevisionsToPublicArticle)
  publicArticles.forEach(article => publicArticlesLoader.prime(article.id, article))

  const publicPages = pages.map(pageWithRevisionsToPublicPage)
  publicPages.forEach(page => publicPagesLoader.prime(page.id, page))

  return {
    articles: publicArticles,
    pages: publicPages
  }
}
