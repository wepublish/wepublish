import {
  FullTagFragment,
  FullTagFragmentDoc,
  getV1ApiClient,
  Page,
  PageDocument
} from '@wepublish/website/api'
import {GetStaticPaths} from 'next'
import getConfig from 'next/config'

export const getPagePathsBasedOnPage =
  (pageSlug: string, maxPathCount = 20, excludedSlugs?: string[]): GetStaticPaths =>
  async () => {
    const {publicRuntimeConfig} = getConfig()
    const client = getV1ApiClient(publicRuntimeConfig.env.API_URL!, [])

    await client.query({
      query: PageDocument,
      variables: {
        slug: pageSlug
      }
    })

    const cache = Object.values(client.cache.extract())
    const pageSlugs = []

    for (const storeObj of cache) {
      if (storeObj?.__typename === 'Page') {
        const slug = (storeObj as Page).slug

        if (slug && slug !== pageSlug && !excludedSlugs?.includes(slug)) {
          pageSlugs.push(slug)
        }
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
    const client = getV1ApiClient(publicRuntimeConfig.env.API_URL!, [])

    await client.query({
      query: PageDocument,
      variables: {
        slug: pageSlug
      }
    })

    const cache = Object.values(client.cache.extract())
    const articleSlugs = [] as {slug: string; tag?: string}[]

    for (const storeObj of cache) {
      if (storeObj?.__typename === 'Article') {
        const article = storeObj as {slug?: string; tags: {__ref: string}[]}
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
          slug: article.slug ?? '',
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
