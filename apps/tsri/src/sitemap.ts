import {ApiV1, generateSitemap} from '@wepublish/website/server'
import {NextApiRequest} from 'next'
import getConfig from 'next/config'
import process from 'node:process'
import {groupBy} from 'ramda'

export const getSitemap = async (req: NextApiRequest): Promise<string> => {
  const siteUrl = process.env.WEBSITE_URL || ''

  const generate = generateSitemap({
    siteUrl,
    title: 'Bajour'
  })

  const {publicRuntimeConfig} = getConfig()
  const client = ApiV1.getV1ApiClient(publicRuntimeConfig.env.API_URL!, [], {
    typePolicies: {}
  })

  const articleAmount = 2100
  const articleAPICalls = []
  let articleIndex = 0

  while (articleAmount > articleIndex) {
    articleAPICalls.push(
      client.query({
        query: ApiV1.ArticleListDocument,
        variables: {
          skip: articleIndex,
          take: 100,
          sort: ApiV1.ArticleSort.PublishedAt,
          order: ApiV1.SortOrder.Descending
        } as ApiV1.ArticleListQueryVariables
      })
    )

    articleIndex += 100
  }

  const grouped = groupBy(
    (a: ApiV1.Article) => a.slug,
    (await Promise.all(articleAPICalls)).flatMap(({data}) => data.articles.nodes)
  )
  const filtered = Object.keys(grouped)
    .filter(key => {
      console.log(grouped[key].length)

      return grouped[key].length > 1
    })
    .reduce((obj, key) => {
      obj[key] = grouped[key].map(({id}) => id)

      return obj
    }, {} as Record<string, any[]>)

  console.log(filtered)

  const [{data: pageData}, ...articleData] = await Promise.all([
    client.query({
      query: ApiV1.SitemapPageListDocument,
      variables: {
        take: 100,
        sort: ApiV1.PublishedPageSort.PublishedAt,
        order: ApiV1.SortOrder.Descending
      } as ApiV1.PageListQueryVariables
    }),
    ...articleAPICalls
  ])

  return generate(articleData.flatMap(({data}) => data.articles.nodes) ?? [], [
    `${siteUrl}/author`,
    `${siteUrl}/event`,
    `${siteUrl}/login`,
    `${siteUrl}/signup`,
    `${siteUrl}/mitmachen`,
    ...(pageData.pages.nodes ?? []).map((page: ApiV1.Page) => page.url)
  ])
}
