import {
  InvoicesDocument,
  InvoicesQuery,
  Subscription,
  useCancelSubscriptionMutation,
  useExtendSubscriptionMutation,
  usePaySubscriptionMutation,
  useSubscriptionsQuery
} from '@wepublish/website/api'
import {BuilderContainerProps, useWebsiteBuilder} from '@wepublish/website/builder'

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

  return (
    <SubscriptionList
      data={
        filter && data?.subscriptions
          ? {
              ...data,
              subscriptions: filter(data.subscriptions)
            }
          : data
      }
      loading={loading}
      error={error}
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
