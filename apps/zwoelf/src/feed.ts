import {ApiV1, generateFeed} from '@wepublish/website/server'
import {NextApiRequest} from 'next'
import getConfig from 'next/config'
import process from 'node:process'

export const getFeed = async (req: NextApiRequest) => {
  const siteUrl = `https://${process.env.WEBSITE_URL}`

  const generate = await generateFeed({
    id: `${siteUrl + req.url}`,
    link: siteUrl,
    title: 'Zwölf',
    ttl: 10, // in minutes
    copyright: 'Zwölf',
    categories: ['OSS', 'CMS', 'Journalism'],
    updated: new Date(),
    feedLinks: {
      json: `${siteUrl + req.url}/api/json-feed`,
      atom: `${siteUrl + req.url}/api/atom-feed`,
      rss: `${siteUrl + req.url}/api/rss-feed`
    }
  })

  const {publicRuntimeConfig} = getConfig()
  const client = ApiV1.getV1ApiClient(publicRuntimeConfig.env.API_URL!, [], {
    typePolicies: {}
  })

  const {data} = await client.query({
    query: ApiV1.ArticleListDocument,
    variables: {
      take: 50,
      sort: ApiV1.ArticleSort.PublishedAt,
      order: ApiV1.SortOrder.Descending
    } as ApiV1.ArticleListQueryVariables
  })

  return generate(data.articles.nodes ?? [])
}
