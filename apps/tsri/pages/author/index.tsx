import {ApiV1, AuthorListContainer, useWebsiteBuilder} from '@wepublish/website'
import {GetStaticProps} from 'next'
import getConfig from 'next/config'
import {useRouter} from 'next/router'
import {useMemo} from 'react'
import {z} from 'zod'

const take = 25

const pageSchema = z.object({
  page: z.coerce.number().gte(1).optional()
})

type AuthorListProps = {
  tagId: string | undefined
}

export default function AuthorList({tagId}: AuthorListProps) {
  const {
    elements: {Pagination}
  } = useWebsiteBuilder()

  const {query, replace} = useRouter()
  const {page} = pageSchema.parse(query)

  const variables = useMemo(
    () =>
      ({
        sort: ApiV1.AuthorSort.Name,
        order: ApiV1.SortOrder.Ascending,
        take,
        skip: ((page ?? 1) - 1) * take,
        filter: {
          tagIds: tagId ? [tagId] : []
        }
      } satisfies ApiV1.AuthorListQueryVariables),
    [page, tagId]
  )

  const {data} = ApiV1.useAuthorListQuery({
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
    <>
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
    </>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const {publicRuntimeConfig} = getConfig()

  if (!publicRuntimeConfig.env.API_URL) {
    return {props: {}, revalidate: 1}
  }

  const client = ApiV1.getV1ApiClient(publicRuntimeConfig.env.API_URL, [])
  const tagResult = await client.query({
    query: ApiV1.TagDocument,
    variables: {
      tag: 'show-on-website',
      type: ApiV1.TagType.Author
    }
  })

  const tagId = tagResult.data?.tags?.nodes?.[0]?.id ?? null

  await Promise.all([
    client.query({
      query: ApiV1.AuthorListDocument,
      variables: {
        take,
        skip: 0,
        sort: ApiV1.AuthorSort.Name,
        order: ApiV1.SortOrder.Ascending,
        filter: {
          tagIds: tagId ? [tagId] : []
        }
      } satisfies ApiV1.AuthorListQueryVariables
    }),
    client.query({
      query: ApiV1.NavigationListDocument
    }),
    client.query({
      query: ApiV1.PeerProfileDocument
    })
  ])

  const props = ApiV1.addClientCacheToV1Props(client, {
    tagId
  })

  return {
    props,
    revalidate: 60 // every 60 seconds
  }
}
