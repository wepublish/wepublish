import {Article, ArticleQuery, ArticleQueryVariables} from '../../api/public'
import {publicClient} from '../api/clients'

export async function getArticleBySlug(slug: string) {
  return (
    await publicClient.request<ArticleQuery, ArticleQueryVariables>(Article, {
      slug
    })
  ).article
}
