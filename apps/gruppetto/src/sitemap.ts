import {
  ArticleListDocument,
  ArticleListQueryVariables,
  ArticleSort,
  getV1ApiClient,
  Page,
  PageListQueryVariables,
  PageSort,
  SitemapPageListDocument,
  SortOrder
} from '@wepublish/website/api'
import {generateSitemap} from '@wepublish/website/server'
import {NextApiRequest} from 'next'
import getConfig from 'next/config'
import process from 'node:process'

export const getSitemap = async (req: NextApiRequest): Promise<string> => {
  const siteUrl = process.env.WEBSITE_URL || ''

  const generate = generateSitemap({
    siteUrl,
    title: 'Gruppetto'
  })

  const {publicRuntimeConfig} = getConfig()
  const client = getV1ApiClient(publicRuntimeConfig.env.API_URL!, [], {
    typePolicies: {}
  })

  const [{data: articleData}, {data: pageData}] = await Promise.all([
    client.query({
      query: ArticleListDocument,
      variables: {
        take: 50,
        sort: ArticleSort.PublishedAt,
        order: SortOrder.Descending
      } as ArticleListQueryVariables
    }),
    client.query({
      query: SitemapPageListDocument,
      variables: {
        take: 100,
        sort: PageSort.PublishedAt,
        order: SortOrder.Descending
      } as PageListQueryVariables
    })
  ])

  return generate(articleData.articles.nodes ?? [], [
    `${siteUrl}/author`,
    `${siteUrl}/login`,
    `${siteUrl}/signup`,
    `${siteUrl}/abo`,
    ...(pageData.pages.nodes ?? []).map((page: Page) => page.url)
  ])
}
