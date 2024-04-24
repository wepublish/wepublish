import Vue from 'vue'
import {gql} from 'graphql-tag'
import {FetchPolicy} from 'apollo-client'
import Service from '~/sdk/wep/services/Service'
import Article from '~/sdk/wep/models/wepPublication/article/Article'
import ReducedArticle from '~/sdk/wep/models/wepPublication/article/ReducedArticle'
import {CacheIdentification} from '~/sdk/wep/store/cacheGuard'

export default class PeerArticleService extends Service {
  constructor({vue}: {vue: Vue}) {
    super({vue})
  }

  /**
   * Fetch single article by id, slug or token from wep api.
   * @param id
   * @param slug
   * @param token
   */
  async getPeerArticle({
    peerArticleId,
    peerSlug,
    reduced
  }: {
    peerArticleId: string
    peerSlug: string
    reduced?: boolean
  }): Promise<Article | false> {
    if (!peerArticleId) {
      throw new Error(
        'peerArticleId is not provided on getPeerArticle() method within PeerArticle class.'
      )
    }
    if (!peerSlug) {
      throw new Error(
        'peerSlug is not provided on getPeerArticle() method within PeerArticle class.'
      )
    }
    this.vue.$nextTick(() => {
      this.loadingStart()
    })
    try {
      let query
      if (reduced) {
        query = gql`
          query PeerArticle($peerArticleId: ID!, $peerSlug: Slug) {
            peerArticle(id: $peerArticleId, peerSlug: $peerSlug) {
              ...reducedArticle
            }
          }
          ${ReducedArticle.reducedArticleFragment}
        `
      } else {
        query = gql`
          query PeerArticle($peerArticleId: ID!, $peerSlug: Slug) {
            peerArticle(id: $peerArticleId, peerSlug: $peerSlug) {
              ...article
            }
          }
          ${Article.peerArticleFragment}
        `
      }
      const fetchPolicy: FetchPolicy = await this.vue.$store.dispatch('cacheGuard/getFetchPolicy', {
        id: peerArticleId || peerArticleId,
        type: 'PeerArticle'
      } as CacheIdentification)
      const response = await this.$apollo.query({
        query,
        variables: {
          peerArticleId,
          peerSlug
        },
        errorPolicy: 'all',
        fetchPolicy
      })
      const article = new Article(response?.data?.peerArticle)
      this.loadingFinish()
      return article
    } catch (e) {
      this.loadingFinish()
      this.alert({
        title: 'Peer Artikel konnte nicht abgerufen werden.',
        type: 'error'
      })
    }
    return false
  }
}
