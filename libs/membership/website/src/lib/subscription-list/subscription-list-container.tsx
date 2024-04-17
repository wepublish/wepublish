import {
  InvoicesDocument,
  InvoicesQuery,
  Subscription,
  useCancelSubscriptionMutation,
  useExtendSubscriptionMutation,
  useInvoicesQuery,
  usePaySubscriptionMutation,
  useSubscriptionsQuery
} from '@wepublish/website/api'
import {BuilderContainerProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {produce} from 'immer'
import {useMemo} from 'react'

export type SubscriptionListContainerProps = {
  successURL: string
  failureURL: string
  filter?: (subscriptions: Subscription[]) => Subscription[]
} & BuilderContainerProps

export function SubscriptionListContainer({
  filter,
  successURL,
  failureURL,
  className
}: SubscriptionListContainerProps) {
  const {SubscriptionList} = useWebsiteBuilder()
  const {data, loading, error} = useSubscriptionsQuery()
  const invoices = useInvoicesQuery()

  const [pay] = usePaySubscriptionMutation({
    onCompleted(data) {
      if (data.createPaymentFromSubscription?.intentSecret) {
        window.location.href = data.createPaymentFromSubscription.intentSecret
      }
    }
  })
  const [cancel] = useCancelSubscriptionMutationWithCacheUpdate()
  const [extend] = useExtendSubscriptionMutation({
    onCompleted(data) {
      if (data.extendSubscription?.intentSecret) {
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
        await extend({
          variables: {
            subscriptionId,
            failureURL,
            successURL
          }
        })
      }}
      onPay={async subscriptionId => {
        await pay({
          variables: {
            subscriptionId,
            failureURL,
            successURL
          }
        })
      }}
    />
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
