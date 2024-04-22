import Vue from 'vue'
import {gql} from 'graphql-tag'
import {FetchPolicy} from 'apollo-client'
import Service from '~/sdk/wep/services/Service'
import Article from '~/sdk/wep/models/wepPublication/article/Article'
import ReducedArticle from '~/sdk/wep/models/wepPublication/article/ReducedArticle'
import {ArticleFilter, ArticleSort, SortOrder} from '~/sdk/wep/interfacesAndTypes/WePublish'
import Articles from '~/sdk/wep/models/wepPublication/article/Articles'
import PageInfo from '~/sdk/wep/models/wepPublication/page/PageInfo'
import {CacheIdentification} from '~/sdk/wep/store/cacheGuard'

export default class ArticleService extends Service {
  constructor({vue}: {vue: Vue}) {
    super({vue})
  }

  /**
   * Fetch single article by id, slug or token from wep api.
   * @param id
   * @param slug
   * @param token
   */
  public async getArticle({
    id = undefined,
    slug = undefined,
    token = undefined,
    reduced
  }: {
    id?: string
    slug?: string
    token?: string
    reduced?: boolean
  }): Promise<Article | false> {
    if (!(id || slug || token)) {
      throw new Error(
        'Neither id, slug or token provided in getArticle() method within ArticleService class.'
      )
    }
    this.vue.$nextTick(() => {
      this.loadingStart()
    })
    try {
      let query
      if (reduced) {
        query = gql`
          query getArticle($id: ID, $slug: Slug, $token: String) {
            article(id: $id, slug: $slug, token: $token) {
              ...reducedArticle
            }
          }
          ${ReducedArticle.reducedArticleFragment}
        `
      } else {
        query = gql`
          query getArticle($id: ID, $slug: Slug, $token: String) {
            article(id: $id, slug: $slug, token: $token) {
              ...article
            }
          }
          ${Article.articleFragment}
        `
      }
      const fetchPolicy: FetchPolicy = await this.vue.$store.dispatch('cacheGuard/getFetchPolicy', {
        type: 'Article',
        id: id || slug
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
      const article = new Article(response?.data?.article)
      this.loadingFinish()
      return article
    } catch (e) {
      this.loadingFinish()
      this.alert({
        title: 'Artikel konnte nicht abgerufen werden.',
        type: 'error'
      })
    }
    return false
  }

  /**
   * Fetch multiple articles
   * @param after
   * @param before
   * @param first
   * @param last
   * @param filter
   * @param sort
   * @param order
   */
  public async getArticles({
    cursor,
    take,
    skip,
    filter,
    sort,
    order,
    reduced
  }: {
    cursor?: string
    take?: number
    skip?: number
    filter?: ArticleFilter
    sort?: ArticleSort
    order?: SortOrder
    reduced?: boolean
  }): Promise<Articles | false> {
    this.vue.$nextTick(() => {
      this.loadingStart()
    })
    try {
      let query
      if (reduced) {
        query = gql`
          query getArticles(
            $cursor: ID
            $take: Int
            $skip: Int
            $filter: ArticleFilter
            $sort: ArticleSort
            $order: SortOrder
          ) {
            articles(
              cursor: $cursor
              take: $take
              skip: $skip
              filter: $filter
              sort: $sort
              order: $order
            ) {
              nodes {
                ...reducedArticle
              }
              pageInfo {
                ...pageInfo
              }
              totalCount
            }
          }
          ${ReducedArticle.reducedArticleFragment}
          ${PageInfo.pageInfoFragment}
        `
      } else {
        query = gql`
          query getArticles(
            $cursor: ID
            $take: Int
            $skip: Int
            $filter: ArticleFilter
            $sort: ArticleSort
            $order: SortOrder
          ) {
            articles(
              cursor: $cursor
              take: $take
              skip: $skip
              filter: $filter
              sort: $sort
              order: $order
            ) {
              nodes {
                ...article
              }
              pageInfo {
                ...pageInfo
              }
              totalCount
            }
          }
          ${Article.articleFragment}
          ${PageInfo.pageInfoFragment}
        `
      }
      const response = await this.$apollo.query({
        query,
        variables: {
          cursor,
          take,
          skip,
          filter,
          sort,
          order
        },
        errorPolicy: 'all'
      })
      const articles = new Articles(response?.data?.articles, reduced)
      this.loadingFinish()
      return articles
    } catch (e) {
      this.loadingFinish()
      this.alert({
        title: 'Artikel konnten nicht abgerufen werden.',
        type: 'error'
      })
    }
    return false
  }
}
