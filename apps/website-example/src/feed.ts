import {generateFeed} from '@wepublish/website'
import {ApiV1} from '@wepublish/website'
import {NextApiRequest} from 'next'
import getConfig from 'next/config'

export const getFeed = async (req: NextApiRequest) => {
  const siteUrl = `https://${req.headers['host']}`

  const generate = generateFeed({
    id: `${siteUrl + req.url}`,
    link: `${siteUrl + req.url}`,
    title: 'We.Publish',
    ttl: 10, // in minutes
    copyright: 'We.Publish',
    categories: ['OSS', 'CMS', 'Journalism'],
    updated: new Date(),
    feedLinks: {
      json: `${siteUrl + req.url}/api/json-feed`,
      atom: `${siteUrl + req.url}/api/atom-feed`,
      rss: `${siteUrl + req.url}/api/rss-feed`
    }
  })

  const {publicRuntimeConfig} = getConfig()
  const client = ApiV1.getV1ApiClient(publicRuntimeConfig.env.API_URL!, [])

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
