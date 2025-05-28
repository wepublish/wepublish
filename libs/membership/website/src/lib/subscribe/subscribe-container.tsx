import {useUser} from '@wepublish/authentication/website'
import {
  FullMemberPlanFragment,
  SubscribeMutation,
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
import {useEffect, useMemo, useState} from 'react'
import {useSubscribe} from './useSubscribe'
import {SubscribeResponseHandler} from './subscribe-response-handler'
import {FetchResult} from '@apollo/client'

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

  const [subscribeResponse, setSubscribeResponse] = useState<
    FetchResult<SubscribeMutation> | undefined
  >()

  const [selectedMemberPlan, setSelectedMemberPlan] = useState<FullMemberPlanFragment | undefined>()

  const memberPlanList = useMemberPlanListQuery({
    variables: {
      take: 50
    }
  })

  const [resubscribe] = useResubscribeMutation({})

  const [subscribe] = useSubscribeMutation()

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
  const {fetchRedirectPages: fetchSuccessAndFailurePages} = useSubscribe()

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
      <SubscribeResponseHandler
        subscribeResponse={subscribeResponse}
        memberPlan={selectedMemberPlan}
        onError={() => {
          fetchUserSubscriptions()
          fetchUserInvoices()
        }}
      />
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
          setSelectedMemberPlan(selectedMemberplan)

          const [successPage, failPage] = await fetchSuccessAndFailurePages({
            successPageId: selectedMemberplan?.successPageId,
            failPageId: selectedMemberplan?.failPageId
          })

          const response = await subscribe({
            variables: {
              ...formData,
              successURL: successPage.data?.page.url,
              failureURL: failPage.data?.page.url,
              deactivateSubscriptionId
            }
          })

          setSubscribeResponse(response)
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

          setSelectedMemberPlan(selectedMemberplan)

          const [successPage, failPage] = await fetchSuccessAndFailurePages({
            successPageId: selectedMemberplan?.successPageId,
            failPageId: selectedMemberPlan?.failPageId
          })

          const response = await subscribe({
            variables: {
              ...formData.subscribe,
              successURL: successPage.data?.page.url,
              failureURL: failPage.data?.page.url
            }
          })

          setSubscribeResponse(response)
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
              window.location.href = page.data?.page.url ?? '/profile'
            }
          })
        }}
        deactivateSubscriptionId={deactivateSubscriptionId}
      />
    </>
  )
}
