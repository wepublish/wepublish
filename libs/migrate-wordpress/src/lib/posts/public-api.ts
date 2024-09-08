import {Article, ArticleQuery, ArticleQueryVariables} from '../../api/public'
import {GraphQLClient} from 'graphql-request'

const publicGraphqlEndpoint = process.env['WEPUBLISH_API_URL'] + '/v1'
export const publicClient = new GraphQLClient(publicGraphqlEndpoint, {
  headers: {
    'Content-Type': 'application/json'
  }
})

export async function getArticleBySlug(slug: string) {
  return (
    await publicClient.request<ArticleQuery, ArticleQueryVariables>(Article, {
      slug
    })
  ).article
}
