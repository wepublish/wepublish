import {capitalize} from '@mui/material'
import {ApiV1, ArticleListContainer, useWebsiteBuilder} from '@wepublish/website'
import {GetStaticPaths, GetStaticProps} from 'next'
import getConfig from 'next/config'
import {useRouter} from 'next/router'
import {useMemo} from 'react'
import {z} from 'zod'

const take = 25

const pageSchema = z.object({
  page: z.coerce.number().gte(1).optional(),
  tag: z.string()
})

type ArticleListByTagProps = {
  tagId: string
}

export default function ArticleListByTag({tagId}: ArticleListByTagProps) {
  const {
    elements: {H3, Alert, Pagination}
  } = useWebsiteBuilder()

  const {query, replace} = useRouter()
  const {page, tag} = pageSchema.parse(query)

  const variables = useMemo(
    () => ({
      take,
      skip: ((page ?? 1) - 1) * take,
      filter: {
        tags: [tagId]
      }
    }),
    [page, tagId]
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
      <H3 component="h1">{capitalize(tag)}</H3>

      {data && !data.articles.nodes.length && (
        <Alert severity="info">Keine Artikel vorhanden</Alert>
      )}

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

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [],
    fallback: 'blocking'
  }
}
export const getStaticProps: GetStaticProps = async ({params}) => {
  const {tag} = params || {}

  const {publicRuntimeConfig} = getConfig()
  const client = ApiV1.getV1ApiClient(publicRuntimeConfig.env.API_URL!, [])

  const tagResult = await client.query({
    query: ApiV1.TagDocument,
    variables: {
      tag,
      type: ApiV1.TagType.Article
    }
  })

  if (!tagResult.error && !tagResult.data.tags.nodes.length) {
    return {
      notFound: true
    }
  }

  const tagId = tagResult.data.tags.nodes[0].id

  await Promise.all([
    client.query({
      query: ApiV1.ArticleListDocument,
      variables: {
        take,
        skip: 0,
        filter: {
          tags: [tagId]
        }
      }
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
