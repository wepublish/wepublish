import {ApiV1} from '@wepublish/website'
import {FullTagFragment, FullTagFragmentDoc} from '@wepublish/website/api'
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
        const article = storeObj as {slug: string; tags: {__ref: string}[]}
        let tag: string | undefined

        for (const {__ref} of article.tags) {
          const tagObj = client.readFragment({
            id: __ref,
            fragment: FullTagFragmentDoc
          }) as FullTagFragment

          if (tagObj.main && tagObj.tag) {
            tag = tagObj.tag.toLowerCase()
            break
          }
        }

        articleSlugs.push({
          slug: article.slug,
          tag
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
