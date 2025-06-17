import {useUser} from '@wepublish/authentication/website'
import {
  FullMemberPlanFragment,
  RegisterMutationVariables,
  SubscribeMutationVariables,
  useChallengeLazyQuery,
  useInvoicesLazyQuery,
  useMemberPlanListQuery,
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
import {SubscribeResponseHandler} from './subscribe-response-handler'
import {useSubscribe} from './useSubscribe'
import styled from '@emotion/styled'

const SubscribeContainerStyled = styled('div')`
  display: grid;
  gap: ${({theme}) => theme.spacing(2)};
`

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
    | 'trial'
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
  trial,
  transactionFee,
  transactionFeeText,
  returningUserId
}: SubscribeContainerProps<T>) => {
  const {setToken, hasUser} = useUser()
  const {Subscribe} = useWebsiteBuilder()
  const [fetchChallenge, challenge] = useChallengeLazyQuery()

  const [fetchUserSubscriptions, userSubscriptions] = useSubscriptionsLazyQuery()
  const [fetchUserInvoices, userInvoices] = useInvoicesLazyQuery()
  const {fetchRedirectPageUrls, handleSubscribeResponse} = useSubscribe()

  const [selectedMemberPlan, setSelectedMemberPlan] = useState<FullMemberPlanFragment | undefined>()
  const [errors, setErrors] = useState<string[] | undefined>(undefined)
  const [stripeIntent, setStripeIntent] = useState<string | undefined>(undefined)

  const memberPlanList = useMemberPlanListQuery({
    variables: {
      take: 50
    }
  })

  // @todo > handle error & completed
  const [resubscribe] = useResubscribeMutation({})

  const [subscribe] = useSubscribeMutation({
    onError: async errors => {
      setErrors([errors.message])
      fetchUserSubscriptions()
      fetchUserInvoices()
    },
    onCompleted: async data => {
      await handleSubscribeResponse({
        subscribeResponse: data,
        memberPlan: selectedMemberPlan,
        onStripeIntent: intentSecret => setStripeIntent(intentSecret),
        onError: errors => setErrors(errors)
      })
    }
  })

  // @todo > handle error & completed properly
  const [register] = useRegisterMutation({
    onError: () => challenge.refetch(),
    onCompleted(data) {
      if (data.registerMember.session) {
        setToken(data.registerMember.session)
      }
    }
  })

  // todo > can we move it into useSubscribeResponse ?
  async function onSubscribe(
    formData: Omit<SubscribeMutationVariables, 'failureURL' | 'successURL'>
  ) {
    const selectedMemberplan = filteredMemberPlans.data?.memberPlans.nodes.find(
      mb => mb.id === formData.memberPlanId
    )
    setSelectedMemberPlan(selectedMemberplan)

    const {successURL, failureURL} = await fetchRedirectPageUrls({
      successPageId: selectedMemberplan?.successPageId,
      failPageId: selectedMemberplan?.failPageId
    })

    await subscribe({
      variables: {
        ...formData,
        successURL,
        failureURL,
        deactivateSubscriptionId
      }
    })
  }

  async function onSubscribeWithRegister(formData: {
    subscribe: Omit<SubscribeMutationVariables, 'failureURL' | 'successURL'>
    register: RegisterMutationVariables
  }) {
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

    const {successURL, failureURL} = await fetchRedirectPageUrls({
      successPageId: selectedMemberplan?.successPageId,
      failPageId: selectedMemberPlan?.failPageId
    })

    await subscribe({
      variables: {
        ...formData.subscribe,
        successURL,
        failureURL
      }
    })
  }

  async function onResubscribe(
    formData: Omit<SubscribeMutationVariables, 'failureURL' | 'successURL'>
  ) {
    const selectedMemberplan = filteredMemberPlans.data?.memberPlans.nodes.find(
      mb => mb.id === formData.memberPlanId
    )

    const {confirmationURL} = await fetchRedirectPageUrls({
      confirmationPageId: selectedMemberplan?.confirmationPageId
    })

    await resubscribe({
      variables: formData,
      async onCompleted() {
        window.location.href = confirmationURL
      }
    })
  }

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
    <SubscribeContainerStyled>
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
        trial={trial}
        transactionFee={transactionFee}
        transactionFeeText={transactionFeeText}
        returningUserId={returningUserId}
        onSubscribe={async formData => await onSubscribe(formData)}
        onSubscribeWithRegister={async formData => await onSubscribeWithRegister(formData)}
        onResubscribe={async formData => await onResubscribe(formData)}
        deactivateSubscriptionId={deactivateSubscriptionId}
      />
      <SubscribeResponseHandler
        errors={errors}
        memberPlan={selectedMemberPlan}
        stripeClientSecret={stripeIntent}
      />
    </SubscribeContainerStyled>
  )
}
