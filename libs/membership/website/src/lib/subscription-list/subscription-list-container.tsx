import {StripeElement, StripePayment} from '@wepublish/payment/website'
import {
  InvoicesDocument,
  InvoicesQuery,
  Subscription,
  useCancelSubscriptionMutation,
  useExtendSubscriptionMutation,
  useInvoicesQuery,
  useSubscriptionsQuery,
  ExtendSubscriptionMutation
} from '@wepublish/website/api'
import {
  BuilderContainerProps,
  BuilderSubscriptionListProps,
  useWebsiteBuilder
} from '@wepublish/website/builder'
import {produce} from 'immer'
import {useMemo, useState} from 'react'

export type SubscriptionListContainerProps = {
  successURL: string
  failureURL: string
  filter?: (subscriptions: Subscription[]) => Subscription[]
} & BuilderContainerProps &
  Partial<Pick<BuilderSubscriptionListProps, 'subscribeUrl'>>

export function SubscriptionListContainer({
  filter,
  successURL,
  failureURL,
  className,
  subscribeUrl = '/mitmachen'
}: SubscriptionListContainerProps) {
  const [stripeClientSecret, setStripeClientSecret] = useState<string>()
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
              window.location.href = success ? successURL : failureURL
            }}
          />
        </StripeElement>
      )}

      <SubscriptionList
        data={filteredSubscriptions}
        loading={loading}
        error={error}
        invoices={invoices}
        subscribeUrl={subscribeUrl}
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
