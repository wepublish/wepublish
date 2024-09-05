import {PollBlockProvider} from '@wepublish/block-content/website'
import {usePageQuery} from '@wepublish/website/api'
import {BuilderContainerProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {PropsWithChildren} from 'react'

type IdSlugOrToken =
  | {id: string; token?: never; slug?: never}
  | {id?: never; token?: never; slug: string}
  | {id?: never; token: string; slug?: never}

export type PageContainerProps = PropsWithChildren<IdSlugOrToken & BuilderContainerProps>

export function PageContainer({id, slug, token, className, children}: PageContainerProps) {
  const {Page} = useWebsiteBuilder()
  const {data, loading, error} = usePageQuery({
    variables: {
      id,
      slug,
      token
    }
  })

  return (
    <PollBlockProvider>
      <Page data={data} loading={loading} error={error} className={className}>
        {children}
      </Page>
    </PollBlockProvider>
  )
}
