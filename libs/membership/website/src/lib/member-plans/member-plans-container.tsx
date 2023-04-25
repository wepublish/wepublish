import {QueryResult} from '@apollo/client'
import {BuilderContainerProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {MemberPlanListQuery, useMemberPlanListQuery} from '@wepublish/website/api'
import {useEffect} from 'react'

export type MemberPlansContainerProps = {
  onQuery?: (
    queryResult: Pick<QueryResult<MemberPlanListQuery>, 'data' | 'loading' | 'error' | 'refetch'>
  ) => void
} & BuilderContainerProps

export const MemberPlansContainer = ({onQuery, className}: MemberPlansContainerProps) => {
  const {MemberPlans} = useWebsiteBuilder()
  const {data, loading, error, refetch} = useMemberPlanListQuery({
    variables: {
      take: 3
    }
  })

  useEffect(() => {
    onQuery?.({data, loading, error, refetch})
  }, [data, loading, error, refetch, onQuery])

  return <MemberPlans data={data} loading={loading} error={error} className={className} />
}
