import {useUser} from '@wepublish/authentication/website'
import {
  MemberPlan,
  RegisterMutationVariables,
  useChallengeLazyQuery,
  useInvoicesLazyQuery,
  useMemberPlanListQuery,
  useRegisterMutation,
  useSubscribeMutation,
  useSubscriptionsLazyQuery
} from '@wepublish/website/api'
import {
  BuilderContainerProps,
  BuilderSubscribeProps,
  useWebsiteBuilder
} from '@wepublish/website/builder'
import {produce} from 'immer'
import {StripeElement, StripePayment} from '@wepublish/payment/website'
import {useEffect, useMemo, useState} from 'react'
import {OptionalKeysOf} from 'type-fest'
import {useRouter} from 'next/router'

export type SubscribeContainerProps<
  T extends OptionalKeysOf<RegisterMutationVariables> = OptionalKeysOf<RegisterMutationVariables>
> = BuilderContainerProps &
  Pick<BuilderSubscribeProps<T>, 'fields' | 'schema' | 'defaults'> & {
    successURL: string
    failureURL: string
    filter?: (memberPlans: MemberPlan[]) => MemberPlan[]
  }

export const SubscribeContainer = <T extends OptionalKeysOf<RegisterMutationVariables>>({
  className,
  failureURL,
  successURL,
  defaults,
  fields,
  schema,
  filter
}: SubscribeContainerProps<T>) => {
  const {setToken, hasUser} = useUser()
  const {Subscribe} = useWebsiteBuilder()
  const [fetchChallenge, challenge] = useChallengeLazyQuery()
  const router = useRouter()

  const [fetchUserSubscriptions, userSubscriptions] = useSubscriptionsLazyQuery()
  const [fetchUserInvoices, userInvoices] = useInvoicesLazyQuery()

  const [stripeClientSecret, setStripeClientSecret] = useState<string>()

  const {cancelSubscriptionId} = router.query

  const memberPlanList = useMemberPlanListQuery({
    variables: {
      take: 50
    }
  })

  const [subscribe] = useSubscribeMutation({
    onCompleted(data) {
      if (!data.createSubscription?.intentSecret) {
        return
      }

      if (data.createSubscription.paymentMethod.paymentProviderID === 'stripe') {
        setStripeClientSecret(data.createSubscription.intentSecret)
      }

      if (data.createSubscription.intentSecret.startsWith('http')) {
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

    if (hasUser) {
      fetchUserSubscriptions()
      fetchUserInvoices()
    }
  }, [hasUser, fetchChallenge, fetchUserSubscriptions, fetchUserInvoices])

  const filteredMemberPlans = useMemo(() => {
    return produce(memberPlanList, draftList => {
      if (filter && draftList.data?.memberPlans) {
        draftList.data.memberPlans.nodes = filter(draftList.data.memberPlans.nodes)
      }
    })
  }, [memberPlanList, filter])

  return (
    <>
      {stripeClientSecret && (
        <StripeElement clientSecret={stripeClientSecret}>
          <StripePayment
            onClose={success => {
              window.location.href = success ? successURL : failureURL
            }}
          />
        </StripeElement>
      )}

      <Subscribe
        className={className}
        defaults={defaults}
        fields={fields}
        schema={schema}
        challenge={challenge}
        userSubscriptions={userSubscriptions}
        userInvoices={userInvoices}
        memberPlans={filteredMemberPlans}
        onSubscribe={async formData => {
          await subscribe({
            variables: {
              ...formData,
              successURL,
              failureURL,
              deactivateSubscriptionId: (cancelSubscriptionId as string | undefined) || undefined
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
        cancelSubscriptionId={cancelSubscriptionId as string | undefined}
      />
    </>
  )
}
