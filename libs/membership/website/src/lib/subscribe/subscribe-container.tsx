import {useUser} from '@wepublish/authentication/website'
import {
  MemberPlan,
  RegisterMutationVariables,
  useChallengeLazyQuery,
  useMemberPlanListQuery,
  useRegisterMutation,
  useSubscribeMutation
} from '@wepublish/website/api'
import {
  BuilderContainerProps,
  BuilderSubscribeProps,
  useWebsiteBuilder
} from '@wepublish/website/builder'
import {produce} from 'immer'
import {useEffect, useMemo} from 'react'
import {OptionalKeysOf} from 'type-fest'

export type SubscribeContainerProps<
  T extends OptionalKeysOf<RegisterMutationVariables> = OptionalKeysOf<RegisterMutationVariables>
> = BuilderContainerProps &
  Pick<BuilderSubscribeProps<T>, 'fields' | 'schema'> & {
    successURL: string
    failureURL: string
    filter?: (memberPlans: MemberPlan[]) => MemberPlan[]
  }

export const SubscribeContainer = <T extends OptionalKeysOf<RegisterMutationVariables>>({
  className,
  failureURL,
  successURL,
  fields,
  schema,
  filter
}: SubscribeContainerProps<T>) => {
  const {setToken, hasUser} = useUser()
  const {Subscribe} = useWebsiteBuilder()
  const [fetchChallenge, challenge] = useChallengeLazyQuery()
  const memberPlanList = useMemberPlanListQuery({
    variables: {
      take: 50
    }
  })

  const [subscribe] = useSubscribeMutation({
    onCompleted(data) {
      if (data.createSubscription?.intentSecret) {
        window.location.href = data.createSubscription.intentSecret
      }
    }
  })

  const [register] = useRegisterMutation({
    onError: () => challenge.refetch(),
    onCompleted(data) {
      if (data.registerMember.session) {
        setToken(data.registerMember.session)
      }
    }
  })

  useEffect(() => {
    if (!hasUser) {
      fetchChallenge()
    }
  }, [hasUser, fetchChallenge])

  const filteredMemberPlans = useMemo(() => {
    return produce(memberPlanList, draftList => {
      if (filter && draftList.data?.memberPlans) {
        draftList.data.memberPlans.nodes = filter(draftList.data.memberPlans.nodes)
      }
    })
  }, [memberPlanList, filter])

  return (
    <Subscribe
      className={className}
      fields={fields}
      schema={schema}
      challenge={challenge}
      memberPlans={filteredMemberPlans}
      onSubscribe={async formData => {
        await subscribe({
          variables: {
            ...formData,
            successURL,
            failureURL
          }
        })
      }}
      onSubscribeWithRegister={async formData => {
        const {errors: registerErrors} = await register({
          variables: formData.register
        })

        if (registerErrors) {
          throw registerErrors
        }

        await subscribe({
          variables: {
            ...formData.subscribe,
            successURL,
            failureURL
          }
        })
      }}
    />
  )
}
