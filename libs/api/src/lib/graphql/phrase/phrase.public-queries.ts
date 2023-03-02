import {PrismaClient} from '@prisma/client'
import {articleWithRevisionsToPublicArticle} from '../../db/article'
import {pageWithRevisionsToPublicPage} from '../../db/page'
import {Context} from '../../context'

export const queryPhrase = async (
  query: string,
  prisma: PrismaClient,
  publicArticlesLoader: Context['loaders']['publicArticles'],
  publicPagesLoader: Context['loaders']['publicPagesByID']
) => {
  const [articleRevisions, pageRevisions] = await Promise.all([
    prisma.$queryRaw<{id: string}[]>`
        SELECT id FROM "articles.revisions"
        WHERE jsonb_to_tsvector(
            'english',
            jsonb_path_query_array(blocks, 'strict $.**.text'),
            '["string"]'
        )@@ to_tsquery('english', ${query})
    `,
    prisma.$queryRaw<{id: string}[]>`
        SELECT id FROM "pages.revisions"
        WHERE jsonb_to_tsvector(
            'english',
            jsonb_path_query_array(blocks, 'strict $.**.text'),
            '["string"]'
        )@@ to_tsquery('english', ${query})
    `
  ])

  const articleRevisionIds = articleRevisions.map(({id}) => id)
  const pageRevisionIds = pageRevisions.map(({id}) => id)

  // If we do not wan't to search for a specific word it should not exist in title and blocks
  // but if we are looking for a word it should be in either the title or blocks
  const comparator = query.includes('!') ? 'AND' : 'OR'

  const [articles, pages] = await Promise.all([
    prisma.article.findMany({
      where: {
        [comparator]: [
          {
            publishedId: {
              in: articleRevisionIds
            }
          },
          {
            published: {
              title: {
                search: query
              }
            }
          }
        ]
      },
      include: {
        published: {
          include: {
            properties: true,
            authors: true,
            socialMediaAuthors: true
          }
        }
      }
    }),
    prisma.page.findMany({
      where: {
        [comparator]: [
          {
            publishedId: {
              in: pageRevisionIds
            }
          },
          {
            published: {
              title: {
                search: query
              }
            }
          }
        ]
      },
      include: {
        published: {
          include: {
            properties: true
          }
        }
      }
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
