import {usePeerArticleQuery, usePeerQuery} from '@wepublish/website/api'
import {BuilderContainerProps, useWebsiteBuilder} from '@wepublish/website/builder'

type PeerIdOrSlug =
  | {articleId: string; peerId?: string; peerSlug?: never}
  | {articleId: string; peerId?: never; peerSlug: string}

export type PeerArticleContainerProps = PeerIdOrSlug & BuilderContainerProps

export function PeerArticleContainer({
  peerId,
  peerSlug,
  articleId,
  className
}: PeerArticleContainerProps) {
  const {Article, PeerInformation} = useWebsiteBuilder()
  const {data, loading, error} = usePeerArticleQuery({
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

  return (
    <>
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
    </>
  )
}
