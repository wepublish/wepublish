import {PollBlockProvider} from '@wepublish/block-content/website'
import {BannerDocumentType, useArticleQuery} from '@wepublish/website/api'
import {BuilderContainerProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {BannerContainer} from '@wepublish/banner/website'
import {PropsWithChildren} from 'react'

type IdOrSlug = {id: string; slug?: never} | {id?: never; slug: string}

export type ArticleContainerProps = PropsWithChildren<IdOrSlug & BuilderContainerProps>

export function ArticleContainer({id, slug, className, children}: ArticleContainerProps) {
  const {Article, PeerInformation} = useWebsiteBuilder()
  const {data, loading, error} = useArticleQuery({
    variables: {
      id,
      slug
    }
  })

  return (
    <PollBlockProvider>
      <BannerContainer documentId={data?.article?.id} documentType={BannerDocumentType.Article} />

      {data?.article?.peer && (
        <PeerInformation
          {...data.article.peer}
          originUrl={data.article.latest.canonicalUrl ?? undefined}
        />
      )}

      <Article data={data} loading={loading} error={error} className={className}>
        {children}
      </Article>
    </PollBlockProvider>
  )
}
