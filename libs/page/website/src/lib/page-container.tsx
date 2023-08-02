import {
  usePageQuery,
  PageQuery,
  useUserPollVoteLazyQuery,
  usePollVoteMutation
} from '@wepublish/website/api'
import {QueryResult} from '@apollo/client'
import {useEffect, PropsWithChildren} from 'react'
import {BuilderContainerProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {PollBlockContext} from '@wepublish/block-content/website'

type IdOrSlug = {id: string; slug?: never} | {id?: never; slug: string}

export type PageContainerProps = IdOrSlug & {
  onQuery?: (
    queryResult: Pick<QueryResult<PageQuery>, 'data' | 'loading' | 'error' | 'refetch'>
  ) => void
} & BuilderContainerProps

export function PageContainer({onQuery, id, slug, className}: PageContainerProps) {
  const {Page} = useWebsiteBuilder()
  const {data, loading, error, refetch} = usePageQuery({
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
      <Page data={data} loading={loading} error={error} className={className} />
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
