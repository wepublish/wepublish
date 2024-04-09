import {generateSitemap} from '@wepublish/website'
import {ApiV1} from '@wepublish/website'
import {NextApiRequest} from 'next'
import getConfig from 'next/config'

export const getSitemap = async (req: NextApiRequest): Promise<string> => {
  const siteUrl = `https://${req.headers['host']}`

  const generate = generateSitemap({
    siteUrl,
    title: 'Gruppetto'
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
    `${siteUrl}/login`,
    `${siteUrl}/signup`,
    `${siteUrl}/abo`,
    ...(pageData.pages.nodes ?? []).map((page: ApiV1.Page) => page.url)
  ])
}
