import {styled} from '@mui/material'
import {BuilderSubscriptionListProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {SubscriptionListItemContent, SubscriptionListItemWrapper} from './subscription-list-item'
import {Invoice, Subscription} from '@wepublish/website/api'

export const SubscriptionListWrapper = styled('article')`
  display: grid;
  gap: ${({theme}) => theme.spacing(2)};
`

export const canExtendSubscription = (subscription: Subscription, invoices: Invoice[]) =>
  subscription.memberPlan.extendable &&
  // @TODO: Remove when all 'payrexx subscriptions' subscriptions have been migrated
  subscription.paymentMethod.slug !== 'payrexx-subscription' &&
  invoices
    .filter(({subscriptionID}) => subscriptionID === subscription.id)
    .every(invoice => invoice.canceledAt || invoice.paidAt)

export const SubscriptionList = ({
  data,
  loading,
  error,
  invoices,
  onCancel,
  onExtend,
  className
}: BuilderSubscriptionListProps) => {
  const {
    SubscriptionListItem,
    elements: {Alert}
  } = useWebsiteBuilder()

  return (
    <SubscriptionListWrapper className={className}>
      {!loading && !error && !data?.subscriptions?.length && (
        <SubscriptionListItemWrapper>
          <SubscriptionListItemContent>
            <strong>Kein aktives Abo</strong>
          </SubscriptionListItemContent>
        </SubscriptionListItemWrapper>
      )}

      {error && <Alert severity="error">{error.message}</Alert>}

      {data?.subscriptions?.map(subscription => (
        <SubscriptionListItem
          key={subscription.id}
          {...subscription}
          canExtend={canExtendSubscription(subscription, invoices.data?.invoices ?? [])}
          extend={async () => await onExtend?.(subscription.id)}
          cancel={async () => await onCancel?.(subscription.id)}
        />
      ))}
    </SubscriptionListWrapper>
  )
}
