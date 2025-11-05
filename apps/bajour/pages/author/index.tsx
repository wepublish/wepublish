import {AuthorListContainer} from '@wepublish/author/website'
import {
  addClientCacheToV1Props,
  AuthorListDocument,
  AuthorSort,
  getV1ApiClient,
  NavigationListDocument,
  PeerProfileDocument,
  SortOrder,
  useAuthorListQuery
} from '@wepublish/website/api'
import {useWebsiteBuilder} from '@wepublish/website/builder'
import {GetStaticProps} from 'next'
import getConfig from 'next/config'
import {useRouter} from 'next/router'
import {useMemo} from 'react'
import {z} from 'zod'

import {Container} from '../../src/components/layout/container'
import {randomIntFromInterval} from '../../src/random-interval'

const take = 25

const pageSchema = z.object({
  page: z.coerce.number().gte(1).optional()
})

export default function AuthorList() {
  const {
    elements: {Pagination}
  } = useWebsiteBuilder()

  const {query, replace} = useRouter()
  const {page} = pageSchema.parse(query)

  const variables = useMemo(
    () => ({
      sort: AuthorSort.Name,
      order: SortOrder.Ascending,
      take,
      skip: ((page ?? 1) - 1) * take
    }),
    [page]
  )

  const {data} = useAuthorListQuery({
    fetchPolicy: 'cache-only',
    variables
  })

  const pageCount = useMemo(() => {
    if (data?.authors.totalCount && data?.authors.totalCount > take) {
      return Math.ceil(data.authors.totalCount / take)
    }

    return 1
  }, [data?.authors.totalCount])

  return (
    <Container>
      <AuthorListContainer variables={variables} />

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
    </Container>
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
      query: AuthorListDocument,
      variables: {
        take,
        skip: 0,
        sort: AuthorSort.Name,
        order: SortOrder.Ascending
      }
    }),
    client.query({
      query: NavigationListDocument
    }),
    client.query({
      query: PeerProfileDocument
    })
  ])

  const props = addClientCacheToV1Props(client, {})

  return {
    props,
    revalidate: randomIntFromInterval(60, 120)
  }
}
