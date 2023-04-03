import {MutationResult, QueryResult} from '@apollo/client'
import {useUser} from '@wepublish/authentication/website'
import {useWebsiteBuilder} from '@wepublish/website/builder'
import {
  ChallengeQuery,
  MemberPlanListQuery,
  SubscribeMutation,
  useChallengeQuery,
  useMemberPlanListQuery,
  useSubscribeMutation
} from '@wepublish/website/api'
import {useEffect} from 'react'

export type SubscribeContainerProps = {
  onSubscribeMutation?: (
    mutationResult: Pick<MutationResult<SubscribeMutation>, 'data' | 'loading' | 'error'>
  ) => void

  onChallengeQuery?: (
    queryResult: Pick<QueryResult<ChallengeQuery>, 'data' | 'loading' | 'error' | 'refetch'>
  ) => void

  onMemberPlansQuery?: (
    queryResult: Pick<QueryResult<MemberPlanListQuery>, 'data' | 'loading' | 'error' | 'refetch'>
  ) => void
}

export const SubscribeContainer = ({
  onChallengeQuery,
  onMemberPlansQuery,
  onSubscribeMutation
}: SubscribeContainerProps) => {
  const {hasUser, setToken} = useUser()
  const {Subscribe} = useWebsiteBuilder()

  const challenge = useChallengeQuery()
  const memberPlanList = useMemberPlanListQuery({
    variables: {
      take: 50
    }
  })

  const [subscribe, result] = useSubscribeMutation({
    onError: () => challenge.refetch(),
    onCompleted(data) {
      if (data.registerMemberAndReceivePayment.session) {
        setToken(data.registerMemberAndReceivePayment.session)
      }

      if (data.registerMemberAndReceivePayment.payment.intentSecret) {
        window.location.href = data.registerMemberAndReceivePayment.payment.intentSecret
      }
    }
  })

  useEffect(() => {
    onChallengeQuery?.(challenge)
  }, [challenge, onChallengeQuery])

  useEffect(() => {
    onMemberPlansQuery?.(memberPlanList)
  }, [memberPlanList, onMemberPlansQuery])

  useEffect(() => {
    onSubscribeMutation?.(result)
  }, [result, onSubscribeMutation])

  if (hasUser) {
    return null
  }

  return (
    <Subscribe
      challenge={challenge}
      memberPlans={memberPlanList}
      subscribe={result}
      onSubmit={formData =>
        subscribe({
          variables: {
            ...formData
          }
        })
      }
    />
  )
}
