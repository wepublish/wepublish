import {useArticleQuery, ArticleQuery} from '@wepublish/website/api'
import {QueryResult} from '@apollo/client'
import {useEffect} from 'react'
import {useWebsiteBuilder} from '@wepublish/website/builder'

type IdOrSlug = {id: string; slug?: never} | {id?: never; slug: string}

export type ArticleContainerProps = IdOrSlug & {
  onQuery?: (
    queryResult: Pick<QueryResult<ArticleQuery>, 'data' | 'loading' | 'error' | 'refetch'>
  ) => void
}

export function ArticleContainer({onQuery, id, slug}: ArticleContainerProps) {
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

  return <Article data={data} loading={loading} error={error} />
}
