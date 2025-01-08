import {useUser} from '@wepublish/authentication/website'
import {
  FullMemberPlanFragment,
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
  BuilderUserFormFields,
  useWebsiteBuilder
} from '@wepublish/website/builder'
import {produce} from 'immer'
import {StripeElement, StripePayment} from '@wepublish/payment/website'
import {useEffect, useMemo, useState} from 'react'

/**
 * If you pass the "deactivateSubscriptionId" prop, this specific subscription will be canceled when
 * a new subscription is purchased. The subscription id is passed to the api that handles the
 * deactivation. This is used for trial subscriptions or to replace legacy subscriptions like
 * Payrexx Subscription. Other use cases are possible.
 */
export type SubscribeContainerProps<
  T extends Exclude<BuilderUserFormFields, 'flair'> = Exclude<BuilderUserFormFields, 'flair'>
> = BuilderContainerProps &
  Pick<
    BuilderSubscribeProps<T>,
    | 'fields'
    | 'schema'
    | 'defaults'
    | 'termsOfServiceUrl'
    | 'donate'
    | 'transactionFee'
    | 'transactionFeeText'
  > & {
    filter?: (memberPlans: FullMemberPlanFragment[]) => FullMemberPlanFragment[]
    deactivateSubscriptionId?: string
  }

export const SubscribeContainer = <T extends Exclude<BuilderUserFormFields, 'flair'>>({
  className,
  defaults,
  fields,
  schema,
  filter,
  deactivateSubscriptionId,
  termsOfServiceUrl,
  donate,
  transactionFee,
  transactionFeeText
}: SubscribeContainerProps<T>) => {
  const {setToken, hasUser} = useUser()
  const {Subscribe} = useWebsiteBuilder()
  const [fetchChallenge, challenge] = useChallengeLazyQuery()

  const [fetchUserSubscriptions, userSubscriptions] = useSubscriptionsLazyQuery()
  const [fetchUserInvoices, userInvoices] = useInvoicesLazyQuery()

  const [stripeClientSecret, setStripeClientSecret] = useState<string>()
  const [stripeMemberPlan, setStripeMemberPlan] = useState<FullMemberPlanFragment>()

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
              if (stripeMemberPlan) {
                window.location.href = success
                  ? stripeMemberPlan.successPage?.url ?? ''
                  : stripeMemberPlan.failPage?.url ?? ''
              }
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
        termsOfServiceUrl={termsOfServiceUrl}
        donate={donate}
        transactionFee={transactionFee}
        transactionFeeText={transactionFeeText}
        onSubscribe={async formData => {
          const selectedMemberplan = filteredMemberPlans.data?.memberPlans.nodes.find(
            mb => mb.id === formData.memberPlanId
          )
          setStripeMemberPlan(selectedMemberplan)

          await subscribe({
            variables: {
              ...formData,
              successURL: selectedMemberplan?.successPage?.url,
              failureURL: selectedMemberplan?.failPage?.url,
              deactivateSubscriptionId
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

          const selectedMemberplan = filteredMemberPlans.data?.memberPlans.nodes.find(
            mb => mb.id === formData.subscribe.memberPlanId
          )
          setStripeMemberPlan(selectedMemberplan)

          await subscribe({
            variables: {
              ...formData.subscribe,
              successURL: selectedMemberplan?.successPage?.url,
              failureURL: selectedMemberplan?.failPage?.url
            }
          })
        }}
        deactivateSubscriptionId={deactivateSubscriptionId}
      />
    </>
  )
}
