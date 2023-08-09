import {QueryResult} from '@apollo/client'
import {PollBlockProvider} from '@wepublish/block-content/website'
import {ArticleQuery, useArticleQuery} from '@wepublish/website/api'
import {BuilderContainerProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {useEffect} from 'react'

type IdOrSlug = {id: string; slug?: never} | {id?: never; slug: string}

export type ArticleContainerProps = IdOrSlug & {
  onQuery?: (
    queryResult: Pick<QueryResult<ArticleQuery>, 'data' | 'loading' | 'error' | 'refetch'>
  ) => void
} & BuilderContainerProps

export function ArticleContainer({onQuery, id, slug, className}: ArticleContainerProps) {
  const {Article} = useWebsiteBuilder()
  const {data, loading, error, refetch} = useArticleQuery({
    variables: {
      id,
      slug
    }
  })

  useEffect(() => {
    onQuery?.({data, loading, error, refetch})
  }, [data, loading, error, refetch, onQuery])

  return (
    <PollBlockProvider>
      <Article data={data} loading={loading} error={error} className={className} />
    </PollBlockProvider>
  )
}
