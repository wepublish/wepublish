import {ApiV1, ArticleListContainer, useWebsiteBuilder} from '@wepublish/website'
import {GetStaticProps} from 'next'
import getConfig from 'next/config'
import {useRouter} from 'next/router'
import {useMemo} from 'react'
import {z} from 'zod'

const take = 25

const pageSchema = z.object({
  page: z.coerce.number().gte(1).optional()
})

export default function ArticleList() {
  const {
    elements: {Pagination}
  } = useWebsiteBuilder()

  const {query, replace} = useRouter()
  const {page} = pageSchema.parse(query)

  const variables = useMemo(
    () => ({
      take,
      skip: ((page ?? 1) - 1) * take
    }),
    [page]
  )

  const {data} = ApiV1.useArticleListQuery({
    fetchPolicy: 'cache-only',
    variables
  })

  const pageCount = useMemo(() => {
    if (data?.articles.totalCount && data?.articles.totalCount > take) {
      return Math.ceil(data.articles.totalCount / take)
    }

    return 1
  }, [data?.articles.totalCount])

  return (
    <>
      <ArticleListContainer variables={variables} />

      {pageCount > 1 && (
        <Pagination
          page={page ?? 1}
          count={pageCount}
          onChange={(_, value) =>
            replace(
              {
                query: {...query, page: value}
              },
              undefined,
              {shallow: true, scroll: true}
            )
          }
        />
      )}
    </>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const {publicRuntimeConfig} = getConfig()

  if (!publicRuntimeConfig.env.API_URL) {
    return {props: {}, revalidate: 1}
  }

  const client = ApiV1.getV1ApiClient(publicRuntimeConfig.env.API_URL, [])
  await Promise.all([
    client.query({
      query: ApiV1.NavigationListDocument
    }),
    client.query({
      query: ApiV1.PeerProfileDocument
    }),
    client.query({
      query: ApiV1.ArticleListDocument,
      variables: {
        take,
        skip: 0
      }
    })
  ])

  const props = ApiV1.addClientCacheToV1Props(client, {})

  return {
    props,
    revalidate: 60 // every 60 seconds
  }
}
