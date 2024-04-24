import Vue from 'vue'
import {gql} from 'graphql-tag'
import {FetchPolicy} from 'apollo-client'
import Service from '~/sdk/wep/services/Service'
import Page from '~/sdk/wep/models/wepPublication/page/Page'
import ReducedPage from '~/sdk/wep/models/wepPublication/page/ReducedPage'
import {CacheIdentification} from '~/sdk/wep/store/cacheGuard'

export default class PageService extends Service {
  constructor({vue}: {vue: Vue}) {
    super({vue})
  }

  /**
   * Fetch single page by id, slug or token from wep api.
   * @param id
   * @param slug
   * @param token
   */
  async getPage({
    id = undefined,
    slug = undefined,
    token = undefined,
    reduced
  }: {
    id?: string
    slug?: string
    token?: string
    reduced?: boolean
  }): Promise<Page | false> {
    if (!(id || slug || token)) {
      throw new Error(
        'Neither id, slug or token provided in getPage() method within PageService class.'
      )
    }
    this.vue.$nextTick(() => {
      this.loadingStart()
    })
    try {
      let query
      if (reduced) {
        query = gql`
          query getPage($slug: Slug, $pageId: ID, $token: String) {
            page(slug: $slug, id: $pageId, token: $token) {
              ...reducedPage
            }
          }
          ${ReducedPage.reducedPageFragment}
        `
      } else {
        query = gql`
          query getPage($slug: Slug, $pageId: ID, $token: String) {
            page(slug: $slug, id: $pageId, token: $token) {
              ...page
            }
          }
          ${Page.pageFragment}
        `
      }

      const fetchPolicy: FetchPolicy = await this.vue.$store.dispatch('cacheGuard/getFetchPolicy', {
        id: id || slug,
        type: 'Page'
      } as CacheIdentification)
      const response = await this.$apollo.query({
        query,
        variables: {
          id,
          slug,
          token
        },
        errorPolicy: 'all',
        fetchPolicy
      })
      const page = new Page(response?.data?.page)
      this.loadingFinish()
      return page
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
