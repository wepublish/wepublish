import styled from '@emotion/styled'
import {Pagination as MuiPagination} from '@mui/material'
import {ApiV1, ArticleListContainer} from '@wepublish/website'
import {GetStaticProps} from 'next'
import getConfig from 'next/config'
import {useEffect, useMemo, useState} from 'react'
import {Reducer, useReducer} from 'react'

export const Pagination = styled(MuiPagination)`
  grid-column: 1 / 5;
  display: grid;
  justify-content: center;
`

export default function ArticleList() {
  const [page, setPage] = useState(1)
  const limit = 2

  const [variables, onVariablesChange] = useReducer<
    Reducer<Partial<ApiV1.ArticleListQueryVariables>, Partial<ApiV1.ArticleListQueryVariables>>
  >(
    (state, newVariables) => ({
      ...state,
      ...newVariables
    }),
    {
      sort: ApiV1.ArticleSort.PublishedAt,
      order: ApiV1.SortOrder.Descending,
      skip: 0,
      take: limit
    } as Partial<ApiV1.ArticleListQueryVariables>
  )

  const {data} = ApiV1.useArticleListQuery({
    fetchPolicy: 'cache-only',
    variables
  })

  const paginationCount = useMemo(() => {
    if (data?.articles.totalCount && data?.articles.totalCount > limit) {
      return Math.ceil(data.articles.totalCount / limit)
    }
    return 1
  }, [data?.articles.totalCount, limit])

  useEffect(() => {
    onVariablesChange({
      skip: (page - 1) * limit
    })
  }, [page])

  return (
    <>
      <ArticleListContainer variables={variables} onVariablesChange={onVariablesChange} />
      {paginationCount > 1 && (
        <Pagination page={page} count={paginationCount} onChange={(_, value) => setPage(value)} />
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
      query: ApiV1.ArticleListDocument
    }),
    client.query({
      query: ApiV1.NavigationListDocument
    }),
    client.query({
      query: ApiV1.PeerProfileDocument
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
