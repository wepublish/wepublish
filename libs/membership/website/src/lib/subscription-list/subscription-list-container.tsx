import {StripeElement, StripePayment} from '@wepublish/payment/website'
import {
  InvoicesDocument,
  InvoicesQuery,
  useCancelSubscriptionMutation,
  useExtendSubscriptionMutation,
  useInvoicesQuery,
  useSubscriptionsQuery,
  ExtendSubscriptionMutation,
  FullMemberPlanFragment,
  FullSubscriptionFragment
} from '@wepublish/website/api'
import {BuilderContainerProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {produce} from 'immer'
import {useMemo, useState} from 'react'

export type SubscriptionListContainerProps = {
  filter?: (subscriptions: FullSubscriptionFragment[]) => FullSubscriptionFragment[]
} & BuilderContainerProps

export function SubscriptionListContainer({filter, className}: SubscriptionListContainerProps) {
  const [stripeClientSecret, setStripeClientSecret] = useState<string>()
  const [stripeMemberPlan, setStripeMemberPlan] = useState<FullMemberPlanFragment>()
  const {SubscriptionList} = useWebsiteBuilder()
  const {data, loading, error} = useSubscriptionsQuery()
  const invoices = useInvoicesQuery()

  const [cancel] = useCancelSubscriptionMutationWithCacheUpdate()
  const [extend] = useExtendSubscriptionMutation({
    onCompleted(data: ExtendSubscriptionMutation) {
      if (!data.extendSubscription?.intentSecret) {
        invoices.refetch()
        return
      }

      if (data.extendSubscription.paymentMethod.paymentProviderID === 'stripe') {
        setStripeClientSecret(data.extendSubscription.intentSecret)
      }

      if (data.extendSubscription.intentSecret.startsWith('http')) {
        window.location.href = data.extendSubscription.intentSecret
      }
    }
  })

  const filteredSubscriptions = useMemo(
    () =>
      produce(data, draftData => {
        if (filter && draftData?.subscriptions) {
          draftData.subscriptions = filter(draftData.subscriptions)
        }
      }),
    [data, filter]
  )

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

      <SubscriptionList
        data={filteredSubscriptions}
        loading={loading}
        error={error}
        invoices={invoices}
        className={className}
        onCancel={async subscriptionId => {
          await cancel({
            variables: {
              subscriptionId
            }
          })
        }}
        onExtend={async subscriptionId => {
          const memberPlan = filteredSubscriptions?.subscriptions?.find(
            subscription => subscription.id === subscriptionId
          )?.memberPlan
          setStripeMemberPlan(memberPlan)

          await extend({
            variables: {
              subscriptionId,
              failureURL: memberPlan?.failPage?.url,
              successURL: memberPlan?.successPage?.url
            }
          })
        }}
      />
    </>
  )
}

const useCancelSubscriptionMutationWithCacheUpdate = (
  ...params: Parameters<typeof useCancelSubscriptionMutation>
) =>
  useCancelSubscriptionMutation({
    ...params[0],
    update: (cache, {data}, options) => {
      const newSubscription = data?.cancelUserSubscription

      if (newSubscription) {
        cache.updateQuery<InvoicesQuery>({query: InvoicesDocument}, data => ({
          invoices:
            data?.invoices.map(invoice => {
              if (
                invoice.subscriptionID === newSubscription.id &&
                !invoice.paidAt &&
                !invoice.canceledAt
              ) {
                return {
                  ...invoice,
                  subscription: newSubscription,
                  canceledAt: new Date().toISOString()
                }
              }

              return invoice
            }) ?? []
        }))
      }
    }
  })
