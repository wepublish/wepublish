import {ArticleListContainer} from '@wepublish/article/website'
import {
  addClientCacheToV1Props,
  ArticleListDocument,
  getV1ApiClient,
  NavigationListDocument,
  PeerProfileDocument,
  useArticleListQuery
} from '@wepublish/website/api'
import {useWebsiteBuilder} from '@wepublish/website/builder'
import {GetStaticProps} from 'next'
import getConfig from 'next/config'
import Head from 'next/head'
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

  const {data} = useArticleListQuery({
    fetchPolicy: 'cache-only',
    variables
  })

  const pageCount = useMemo(() => {
    if (data?.articles.totalCount && data?.articles.totalCount > take) {
      return Math.ceil(data.articles.totalCount / take)
    }

    return 1
  }, [data?.articles.totalCount])

  const canonicalUrl = '/a'

  return (
    <>
      <ArticleListContainer variables={variables} />

      {pageCount > 1 && (
        <>
          <Head>
            <link rel="canonical" href={canonicalUrl} />
          </Head>
          <Pagination
            page={page ?? 1}
            count={pageCount}
            onChange={(_, value) =>
              replace(
                {
                  query: value > 1 ? {...query, page: value} : (delete query.page, {...query})
                },
                undefined,
                {shallow: true, scroll: true}
              )
            }
          />
        </>
      )}
    </>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const {publicRuntimeConfig} = getConfig()

  if (!publicRuntimeConfig.env.API_URL) {
    return {props: {}, revalidate: 1}
  }

  const client = getV1ApiClient(publicRuntimeConfig.env.API_URL, [])
  await Promise.all([
    client.query({
      query: NavigationListDocument
    }),
    client.query({
      query: PeerProfileDocument
    }),
    client.query({
      query: ArticleListDocument,
      variables: {
        take,
        skip: 0
      }
    })
  ])

  const props = addClientCacheToV1Props(client, {})

  return {
    props,
    revalidate: 60 // every 60 seconds
  }
}
