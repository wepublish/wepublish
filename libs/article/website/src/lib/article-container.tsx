import {QueryResult} from '@apollo/client'
import {PollBlockContext} from '@wepublish/block-content/website'
import {
  ArticleQuery,
  useArticleQuery,
  usePollVoteMutation,
  useUserPollVoteLazyQuery
} from '@wepublish/website/api'
import {BuilderContainerProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {PropsWithChildren, useEffect} from 'react'

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

function PollBlockProvider({children}: PropsWithChildren) {
  const [fetchUserVote] = useUserPollVoteLazyQuery()
  const [vote] = usePollVoteMutation()

  return (
    <PollBlockContext.Provider
      value={{
        fetchUserVote,
        vote
      }}>
      {children}
    </PollBlockContext.Provider>
  )
}
