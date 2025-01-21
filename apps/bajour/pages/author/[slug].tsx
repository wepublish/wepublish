import {css} from '@mui/material'
import styled from '@emotion/styled'
import {
  ApiV1,
  ArticleListContainer,
  ArticleWrapper,
  AuthorContainer,
  useWebsiteBuilder
} from '@wepublish/website'
import {GetStaticPaths, GetStaticProps} from 'next'
import getConfig from 'next/config'
import {useRouter} from 'next/router'
import {useMemo} from 'react'
import {z} from 'zod'

import {Container} from '../../src/components/layout/container'

const take = 10

const pageSchema = z.object({
  page: z.coerce.number().gte(1).optional(),
  slug: z.string()
})

const uppercase = css`
  text-transform: uppercase;
`

export default function AuthorBySlug() {
  const {
    elements: {Pagination, H5}
  } = useWebsiteBuilder()

  const {query, replace} = useRouter()
  const {page, slug} = pageSchema.parse(query)

  const {data} = ApiV1.useAuthorQuery({
    fetchPolicy: 'cache-only',
    variables: {
      slug
    }
  })

  const variables = useMemo(
    () => ({
      take,
      skip: ((page ?? 1) - 1) * take,
      filter: {
        authors: data?.author?.id ? [data?.author?.id] : []
      }
    }),
    [page, data?.author?.id]
  )

  const {data: articleListData} = ApiV1.useArticleListQuery({
    fetchPolicy: 'cache-only',
    variables
  })

  const pageCount = useMemo(() => {
    if (articleListData?.articles.totalCount && articleListData?.articles.totalCount > take) {
      return Math.ceil(articleListData.articles.totalCount / take)
    }

    return 1
  }, [articleListData?.articles.totalCount])

  return (
    <Container>
      <ArticleWrapper>
        <AuthorContainer slug={slug as string} />

        {data?.author && (
          <>
            <H5 component={'h2'} css={uppercase}>
              Alle Artikel von {data.author.name}
            </H5>

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
        )}
      </ArticleWrapper>
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
  const {slug} = params || {}

  const {publicRuntimeConfig} = getConfig()
  const client = ApiV1.getV1ApiClient(publicRuntimeConfig.env.API_URL!, [])

  await Promise.all([
    client.query({
      query: ApiV1.AuthorDocument,
      variables: {
        slug
      }
    }),
    client.query({
      query: ApiV1.NavigationListDocument
    }),
    client.query({
      query: ApiV1.PeerProfileDocument
    })
  ])

  const props = ApiV1.addClientCacheToV1Props(client, {})

  return {
    props,
    revalidate: 60 // every 60 seconds
  }
}
