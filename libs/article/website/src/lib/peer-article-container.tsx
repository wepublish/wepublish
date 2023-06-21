import {usePeerArticleQuery, PeerArticleQuery} from '@wepublish/website/api'
import {QueryResult} from '@apollo/client'
import {useEffect} from 'react'
import {BuilderContainerProps, useWebsiteBuilder} from '@wepublish/website/builder'

type PeerIdOrSlug =
  | {articleId: string; peerId?: string; peerSlug?: never}
  | {articleId: string; peerId?: never; peerSlug: string}

export type PeerArticleContainerProps = PeerIdOrSlug & {
  onQuery?: (
    queryResult: Pick<QueryResult<PeerArticleQuery>, 'data' | 'loading' | 'error' | 'refetch'>
  ) => void
} & BuilderContainerProps

export function PeerArticleContainer({
  onQuery,
  peerId,
  peerSlug,
  articleId,
  className
}: PeerArticleContainerProps) {
  const {Article} = useWebsiteBuilder()
  const {data, loading, error, refetch} = usePeerArticleQuery({
    variables: {
      peerId,
      peerSlug,
      articleId
    }
  })

  useEffect(() => {
    onQuery?.({data, loading, error, refetch})
  }, [data, loading, error, refetch, onQuery])

  return (
    <Article
      data={
        data
          ? {
              article: data.peerArticle,
              __typename: data.__typename
            }
          : data
      }
      loading={loading}
      error={error}
      className={className}
    />
  )
}
