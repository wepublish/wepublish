import {PollBlockProvider} from '@wepublish/block-content/website'
import {BannerDocumentType, useArticleQuery} from '@wepublish/website/api'
import {BuilderContainerProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {BannerContainer} from '@wepublish/banner/website'
import {PropsWithChildren} from 'react'

type IdSlugOrToken =
  | {id: string; token?: never; slug?: never}
  | {id?: never; token?: never; slug: string}
  | {id?: never; token: string; slug?: never}

export type ArticleContainerProps = PropsWithChildren<IdSlugOrToken & BuilderContainerProps>

export function ArticleContainer({id, slug, token, className, children}: ArticleContainerProps) {
  const {Article} = useWebsiteBuilder()
  const {data, loading, error} = useArticleQuery({
    variables: {
      id,
      slug,
      token
    }
  })

  return (
    <PollBlockProvider>
      <BannerContainer documentId={data?.article?.id} documentType={BannerDocumentType.Article} />
      <Article data={data} loading={loading} error={error} className={className}>
        {children}
      </Article>
    </PollBlockProvider>
  )
}
