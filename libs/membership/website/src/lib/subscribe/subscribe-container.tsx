import {MutationResult, QueryResult} from '@apollo/client'
import {useUser} from '@wepublish/authentication/website'
import {useWebsiteBuilder} from '@wepublish/website/builder'
import {
  ChallengeQuery,
  MemberPlanListQuery,
  RegisterMutation,
  SubscribeMutation,
  SubscribeMutationVariables,
  useChallengeQuery,
  useMemberPlanListQuery,
  useRegisterMutation,
  useSubscribeMutation
} from '@wepublish/website/api'
import {useEffect, useRef} from 'react'

export type SubscribeContainerProps = {
  onSubscribeMutation?: (
    mutationResult: Pick<MutationResult<SubscribeMutation>, 'data' | 'loading' | 'error'>
  ) => void

  onRegisterMutation?: (
    mutationResult: Pick<MutationResult<RegisterMutation>, 'data' | 'loading' | 'error'>
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
  onSubscribeMutation,
  onRegisterMutation
}: SubscribeContainerProps) => {
  const {setToken, hasUser} = useUser()
  const {Subscribe} = useWebsiteBuilder()
  const memberToScribe = useRef<SubscribeMutationVariables>()

  const challenge = useChallengeQuery()
  const memberPlanList = useMemberPlanListQuery({
    variables: {
      take: 50
    }
  })

  const [subscribe, subscribeResult] = useSubscribeMutation({
    onCompleted(data) {
      if (data.createSubscription.intentSecret) {
        window.location.href = data.createSubscription.intentSecret
      }
    }
  })

  const [register, registerResult] = useRegisterMutation({
    onError: () => challenge.refetch(),
    onCompleted(data) {
      if (data.registerMember.session) {
        setToken(data.registerMember.session)
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
    onSubscribeMutation?.(subscribeResult)
  }, [subscribeResult, onSubscribeMutation])

  useEffect(() => {
    onRegisterMutation?.(registerResult)
  }, [registerResult, onRegisterMutation])

  useEffect(() => {
    if (hasUser && memberToScribe.current) {
      subscribe({
        variables: memberToScribe.current
      })
    }

    memberToScribe.current = undefined
  }, [hasUser, subscribe])

  return (
    <Subscribe
      challenge={challenge}
      memberPlans={memberPlanList}
      subscribe={subscribeResult}
      onSubscribe={formData =>
        subscribe({
          variables: {
            ...formData
          }
        })
      }
      register={registerResult}
      onSubscribeWithRegister={async formData => {
        memberToScribe.current = formData.subscribe

        await register({
          variables: formData.register
        })
      }}
    />
  )
}
