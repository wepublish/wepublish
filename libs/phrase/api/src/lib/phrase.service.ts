import {Injectable} from '@nestjs/common'
import {PrismaClient} from '@prisma/client'
import {getMaxTake, SortOrder} from '@wepublish/utils/api'
import {ArticleSort, createArticleOrder} from '@wepublish/article/api'
import {createPageOrder, PageSort} from '@wepublish/page/api'
import {PhraseQueryArgs} from './phrase.model'

@Injectable()
export class PhraseService {
  constructor(private prisma: PrismaClient) {}

  async queryPhrase({
    query,
    take = 10,
    skip = 0,
    pageSort = PageSort.PublishedAt,
    articleSort = ArticleSort.PublishedAt,
    order = SortOrder.Descending
  }: PhraseQueryArgs) {
    // Default add & if no specific query is given to prevent search to fail!
    query = query.replace(/\s+/g, '&')

    const [foundArticleIds, foundPageIds] = await Promise.all([
      this.prisma.$queryRaw<{id: string}[]>`
      SELECT a.id FROM articles a
      JOIN public."articles.revisions" ar on a."id" = ar."articleId" AND ar."publishedAt" IS NOT NULL
      WHERE to_tsvector('german', ar.title) ||  to_tsvector('german', ar.lead)@@ to_tsquery('german', ${query});
    `,
      this.prisma.$queryRaw<{id: string}[]>`
      SELECT p.id FROM pages p
      JOIN public."pages.revisions" pr on p."id" = pr."pageId" AND pr."publishedAt" IS NOT NULL
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
      this.prisma.article.findMany({
        where: {
          id: {
            in: articleIds
          }
        },
        orderBy: createArticleOrder(articleSort, order),
        skip,
        take: getMaxTake(take)
      }),

      this.prisma.page.findMany({
        where: {
          id: {
            in: pageIds
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

    const firstPage = pages[0]
    const lastPage = pages[pages.length - 1]
    const pagesHasNextPage = pageIds.length > skip + pages.length

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
        nodes: pages,
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
}
