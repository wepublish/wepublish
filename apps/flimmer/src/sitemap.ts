import {ApiV1, generateSitemap} from '@wepublish/website/server'
import {NextApiRequest} from 'next'
import getConfig from 'next/config'
import process from 'node:process'

export const getSitemap = async (req: NextApiRequest): Promise<string> => {
  const siteUrl = process.env.WEBSITE_URL || ''

  const generate = generateSitemap({
    siteUrl,
    title: 'Flimmer'
  })

  const {publicRuntimeConfig} = getConfig()
  const client = ApiV1.getV1ApiClient(publicRuntimeConfig.env.API_URL!, [], {
    typePolicies: {}
  })

  const [{data: articleData}, {data: pageData}] = await Promise.all([
    client.query({
      query: ApiV1.ArticleListDocument,
      variables: {
        take: 50,
        sort: ApiV1.ArticleSort.PublishedAt,
        order: ApiV1.SortOrder.Descending
      } as ApiV1.ArticleListQueryVariables
    }),
    client.query({
      query: ApiV1.SitemapPageListDocument,
      variables: {
        take: 100,
        sort: ApiV1.PublishedPageSort.PublishedAt,
        order: ApiV1.SortOrder.Descending
      } as ApiV1.PageListQueryVariables
    })
  ])

  return generate(articleData.articles.nodes ?? [], [
    `${siteUrl}/author`,
    `${siteUrl}/event`,
    `${siteUrl}/login`,
    `${siteUrl}/signup`,
    `${siteUrl}/mitmachen`,
    ...(pageData.pages.nodes ?? []).map((page: ApiV1.Page) => page.url)
  ])
}
