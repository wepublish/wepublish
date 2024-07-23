import {PollBlockProvider} from '@wepublish/block-content/website'
import {useArticleQuery} from '@wepublish/website/api'
import {BuilderContainerProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {PropsWithChildren} from 'react'

type IdSlugOrToken =
  | {id: string; token?: never; slug?: never}
  | {id?: never; token?: never; slug: string}
  | {id?: never; token: string; slug?: never}

export type ArticleContainerProps = PropsWithChildren<IdSlugOrToken & BuilderContainerProps> & {
  hideAuthors?: boolean
  hideTags?: boolean
}

export function ArticleContainer({
  id,
  slug,
  token,
  className,
  children,
  hideAuthors,
  hideTags
}: ArticleContainerProps) {
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
      <Article
        data={data}
        loading={loading}
        error={error}
        className={className}
        hideAuthors={hideAuthors}
        hideTags={hideTags}>
        {children}
      </Article>
    </PollBlockProvider>
  )
}
