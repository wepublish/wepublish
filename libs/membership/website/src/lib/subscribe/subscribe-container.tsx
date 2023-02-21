import {QueryResult} from '@apollo/client'
import {useWebsiteBuilder} from '@wepublish/website-builder'
import {
  ChallengeQuery,
  useChallengeQuery,
  useMemberPlanListQuery,
  MemberPlanListQuery,
  useSubscribeMutation
} from '@wepublish/website/api'
import {useEffect} from 'react'

export type SubscribeContainerProps = {
  onChallengeQuery?: (
    queryResult: Pick<QueryResult<ChallengeQuery>, 'data' | 'loading' | 'error' | 'refetch'>
  ) => void

  onMemberPlansQuery?: (
    queryResult: Pick<QueryResult<MemberPlanListQuery>, 'data' | 'loading' | 'error' | 'refetch'>
  ) => void
}

export const SubscribeContainer = ({
  onChallengeQuery,
  onMemberPlansQuery
}: SubscribeContainerProps) => {
  const {Subscribe} = useWebsiteBuilder()
  const challenge = useChallengeQuery()
  const memberPlanList = useMemberPlanListQuery({
    variables: {
      take: 50
    }
  })

  const [subscribe, result] = useSubscribeMutation({
    onError: () => challenge.refetch()
  })

  useEffect(() => {
    onChallengeQuery?.(challenge)
  }, [challenge, onChallengeQuery])

  useEffect(() => {
    onMemberPlansQuery?.(memberPlanList)
  }, [memberPlanList, onMemberPlansQuery])

  return (
    <Subscribe
      challenge={challenge}
      memberPlans={memberPlanList}
      onSubmit={formData =>
        subscribe({
          variables: {
            ...formData,
            autoRenew: false
          }
        })
      }
    />
  )
}
