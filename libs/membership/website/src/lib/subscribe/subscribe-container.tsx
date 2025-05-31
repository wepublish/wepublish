import {useUser} from '@wepublish/authentication/website'
import {
  FullMemberPlanFragment,
  useChallengeLazyQuery,
  useInvoicesLazyQuery,
  useMemberPlanListQuery,
  usePageLazyQuery,
  useRegisterMutation,
  useResubscribeMutation,
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
    | 'returningUserId'
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
  transactionFeeText,
  returningUserId
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

  const [resubscribe] = useResubscribeMutation({})

  const [subscribe] = useSubscribeMutation({
    onError() {
      fetchUserSubscriptions()
      fetchUserInvoices()
    },
    onCompleted(data) {
      if (data.createSubscription?.intentSecret == null) {
        return
      }

      if (data.createSubscription.intentSecret === '') {
        window.location.href = '/profile'
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

  // @TODO: Replace with objects on Memberplan when Memberplan has been migrated to V2
  // Pages are currently in V2 and Memberplan are in V1, so we have no access to page objects.
  const [fetchPage] = usePageLazyQuery()

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
            onClose={async success => {
              if (stripeMemberPlan) {
                const page = await fetchPage({
                  variables: {
                    id: success ? stripeMemberPlan.successPageId : stripeMemberPlan.failPageId
                  }
                })

                window.location.href = page.data?.page.url ?? ''

                // window.location.href = success
                //   ? stripeMemberPlan.successPage?.url ?? ''
                //   : stripeMemberPlan.failPage?.url ?? ''
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
        returningUserId={returningUserId}
        onSubscribe={async formData => {
          const selectedMemberplan = filteredMemberPlans.data?.memberPlans.nodes.find(
            mb => mb.id === formData.memberPlanId
          )
          setStripeMemberPlan(selectedMemberplan)

          const [successPage, failPage] = await Promise.all([
            fetchPage({
              variables: {
                id: selectedMemberplan?.successPageId
              }
            }),
            fetchPage({
              variables: {
                id: selectedMemberplan?.successPageId
              }
            })
          ])

          const result = await subscribe({
            variables: {
              ...formData,
              successURL: successPage.data?.page.url,
              failureURL: failPage.data?.page.url,
              // successURL: selectedMemberplan?.successPage?.url,
              // failureURL: selectedMemberplan?.failPage?.url,
              deactivateSubscriptionId
            }
          })

          if (result.errors) {
            throw result.errors
          }
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

          const [successPage, failPage] = await Promise.all([
            fetchPage({
              variables: {
                id: selectedMemberplan?.successPageId
              }
            }),
            fetchPage({
              variables: {
                id: selectedMemberplan?.successPageId
              }
            })
          ])

          const result = await subscribe({
            variables: {
              ...formData.subscribe,
              successURL: successPage.data?.page.url,
              failureURL: failPage.data?.page.url
              // successURL: selectedMemberplan?.successPage?.url,
              // failureURL: selectedMemberplan?.failPage?.url
            }
          })

          if (result.errors) {
            throw result.errors
          }
        }}
        onResubscribe={async formData => {
          const selectedMemberplan = filteredMemberPlans.data?.memberPlans.nodes.find(
            mb => mb.id === formData.memberPlanId
          )
          const page = await fetchPage({
            variables: {
              id: selectedMemberplan?.confirmationPageId
            }
          })

          await resubscribe({
            variables: formData,
            async onCompleted() {
              window.location.href = page.data?.page.url ?? ''
              // window.location.href = selectedMemberplan?.confirmationPage?.url ?? ''
            }
          })
        }}
        deactivateSubscriptionId={deactivateSubscriptionId}
      />
    </>
  )
}
