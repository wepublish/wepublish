import {PollBlockProvider} from '@wepublish/block-content/website'
import {useArticleQuery} from '@wepublish/website/api'
import {BuilderContainerProps, useWebsiteBuilder} from '@wepublish/website/builder'

type IdOrSlug = {id: string; slug?: never} | {id?: never; slug: string}

export type ArticleContainerProps = IdOrSlug & BuilderContainerProps

export function ArticleContainer({id, slug, className}: ArticleContainerProps) {
  const {Article} = useWebsiteBuilder()
  const {data, loading, error} = useArticleQuery({
    variables: {
      id,
      slug
    }
  })

  return (
    <PollBlockProvider>
      <Article data={data} loading={loading} error={error} className={className} />
    </PollBlockProvider>
  )
}
