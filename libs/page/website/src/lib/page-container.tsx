import {PollBlockProvider} from '@wepublish/block-content/website'
import {usePageQuery} from '@wepublish/website/api'
import {BuilderContainerProps, useWebsiteBuilder} from '@wepublish/website/builder'

type IdOrSlug = {id: string; slug?: never} | {id?: never; slug: string}

export type PageContainerProps = IdOrSlug & BuilderContainerProps

export function PageContainer({id, slug, className}: PageContainerProps) {
  const {Page} = useWebsiteBuilder()
  const {data, loading, error} = usePageQuery({
    variables: {
      id,
      slug
    }
  })

  return (
    <PollBlockProvider>
      <Page data={data} loading={loading} error={error} className={className} />
    </PollBlockProvider>
  )
}
