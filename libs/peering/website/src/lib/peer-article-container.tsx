import {QueryResult} from '@apollo/client'
import {ArticleWrapper} from '@wepublish/article/website'
import {PeerArticleQuery, usePeerArticleQuery, usePeerQuery} from '@wepublish/website/api'
import {BuilderContainerProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {useEffect} from 'react'

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
  const {Article, PeerInformation} = useWebsiteBuilder()
  const {data, loading, error, refetch} = usePeerArticleQuery({
    variables: {
      peerId,
      peerSlug,
      articleId
    }
  })

  const peer = usePeerQuery({
    variables: {
      id: peerId,
      slug: peerSlug
    }
  })

  useEffect(() => {
    onQuery?.({data, loading, error, refetch})
  }, [data, loading, error, refetch, onQuery])

  return (
    <ArticleWrapper>
      <PeerInformation
        data={peer.data}
        loading={peer.loading}
        error={peer.error}
        originUrl={data?.peerArticle?.url}
      />

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
    </ArticleWrapper>
  )
}
