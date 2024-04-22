import Vue from 'vue'
import {gql} from 'graphql-tag'
import Service from '~/sdk/wep/services/Service'
import Article from '~/sdk/wep/models/wepPublication/article/Article'
import Articles from '../models/wepPublication/article/Articles'
import PageInfo from '../models/wepPublication/page/PageInfo'
import ReducedArticle from '../models/wepPublication/article/ReducedArticle'

export default class PhraseService extends Service {
  constructor({vue}: {vue: Vue}) {
    super({vue})
  }

  /**
   * Fetch articles and pages by search term from wep api.
   * @param searchQuery
   */
  async searchPhrase({searchQuery}: {searchQuery: String}): Promise<Articles | false> {
    if (!searchQuery) {
      throw new Error('No query provided in searchPhrase() method within PhraseService class.')
    }
    this.vue.$nextTick(() => {
      this.loadingStart()
    })
    try {
      const query = gql`
        query Phrase($query: String!) {
          phrase(query: $query) {
            articles {
              ...reducedArticle
            }
          }
        }
        ${ReducedArticle.reducedArticleFragment}
      `

      const response = await this.$apollo.query({
        query,
        variables: {
          query: searchQuery
        },
        errorPolicy: 'all'
      })
      if (response.data.phrase.articles.length === 0) {
        return false
      }

      const articles = new Articles(
        {
          nodes: response.data.phrase.articles as Article[],
          pageInfo: new PageInfo({
            startCursor: '',
            endCursor: '',
            hasNextPage: false,
            hasPreviousPage: false
          }),
          totalCount: response.data.phrase.articles.length
        },
        true
      )
      this.loadingFinish()
      return articles
    } catch (e) {
      this.loadingFinish()
      this.alert({
        title: 'Seite konnte nicht abgerufen werden.',
        type: 'error'
      })
    }
    return false
  }
}
