import {ApiV1} from '@wepublish/website'
import {GetStaticPaths} from 'next'
import getConfig from 'next/config'

export const getPagePathsBasedOnPage =
  (pageSlug: string, maxPathCount = 20): GetStaticPaths =>
  async () => {
    const {publicRuntimeConfig} = getConfig()
    const client = ApiV1.getV1ApiClient(publicRuntimeConfig.env.API_URL!, [])

    await client.query({
      query: ApiV1.PageDocument,
      variables: {
        slug: pageSlug
      }
    })

    const cache = Object.values(client.cache.extract())
    const pageSlugs = []

    for (const storeObj of cache) {
      if (storeObj?.__typename === 'Page' && (storeObj as ApiV1.Page).slug !== pageSlug) {
        pageSlugs.push((storeObj as ApiV1.Page).slug)
      }

      if (pageSlugs.length >= maxPathCount) {
        break
      }
    }

    return {
      paths: pageSlugs.map(slug => ({
        params: {
          slug
        }
      })),
      fallback: 'blocking'
    }
  }

export const getArticlePathsBasedOnPage =
  (pageSlug: string, maxPathCount = 20): GetStaticPaths =>
  async () => {
    const {publicRuntimeConfig} = getConfig()
    const client = ApiV1.getV1ApiClient(publicRuntimeConfig.env.API_URL!, [])

    await client.query({
      query: ApiV1.PageDocument,
      variables: {
        slug: pageSlug
      }
    })

    const cache = Object.values(client.cache.extract())
    const articleSlugs = [] as {slug: string; tag?: string}[]

    for (const storeObj of cache) {
      if (storeObj?.__typename === 'Article' && !(storeObj as ApiV1.Article).peeredArticleURL) {
        const article = storeObj as ApiV1.Article

        articleSlugs.push({
          slug: article.slug,
          tag: article.tags.find(tag => tag.main)?.tag ?? undefined
        })
      }

      if (articleSlugs.length >= maxPathCount) {
        break
      }
    }

    return {
      paths: articleSlugs.map(({slug, tag}) => ({
        params: {
          slug,
          tag
        }
      })),
      fallback: 'blocking'
    }
  }
