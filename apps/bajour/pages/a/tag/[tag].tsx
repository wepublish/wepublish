import {capitalize, css} from '@mui/material'
import {ArticleListContainer} from '@wepublish/article/website'
import {
  addClientCacheToV1Props,
  ArticleListDocument,
  getV1ApiClient,
  NavigationListDocument,
  PeerProfileDocument,
  TagDocument,
  TagType,
  useArticleListQuery
} from '@wepublish/website/api'
import {useWebsiteBuilder} from '@wepublish/website/builder'
import {GetStaticPaths, GetStaticProps} from 'next'
import getConfig from 'next/config'
import Head from 'next/head'
import {useRouter} from 'next/router'
import {useMemo} from 'react'
import {z} from 'zod'

import {Container} from '../../../src/components/layout/container'

const take = 25

const pageSchema = z.object({
  page: z.coerce.number().gte(1).optional(),
  tag: z.string()
})

const uppercase = css`
  text-transform: uppercase;
`

type ArticleListByTagProps = {
  tagId: string
}

export default function ArticleListByTag({tagId}: ArticleListByTagProps) {
  const {
    elements: {H5, Alert, Pagination}
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

  const canonicalUrl = useMemo(() => {
    return `/a/tag/${tag}`
  }, [tag])

  return (
    <Container>
      <H5 component={'h1'} css={uppercase}>
        {capitalize(tag)}
      </H5>

      {data && !data.articles.nodes.length && (
        <Alert severity="info">Keine Artikel vorhanden</Alert>
      )}

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
    </Container>
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
  const client = getV1ApiClient(publicRuntimeConfig.env.API_URL!, [])

  const tagResult = await client.query({
    query: TagDocument,
    variables: {
      tag,
      type: TagType.Article
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
      query: ArticleListDocument,
      variables: {
        take,
        skip: 0,
        filter: {
          tags: [tagId]
        }
      }
    }),
    client.query({
      query: NavigationListDocument
    }),
    client.query({
      query: PeerProfileDocument
    })
  ])

  const props = addClientCacheToV1Props(client, {
    tagId
  })

  return {
    props,
    revalidate: 60 // every 60 seconds
  }
}
