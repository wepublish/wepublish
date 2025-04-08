import styled from '@emotion/styled'
import {BuilderSubscriptionListProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {SubscriptionListItemContent, SubscriptionListItemWrapper} from './subscription-list-item'

export const SubscriptionListWrapper = styled('article')`
  display: grid;
  gap: ${({theme}) => theme.spacing(2)};
`

export const SubscriptionList = ({
  data,
  loading,
  error,
  invoices,
  onCancel,
  onExtend,
  className,
  subscribeUrl
}: BuilderSubscriptionListProps) => {
  const {
    SubscriptionListItem,
    elements: {Alert, Link}
  } = useWebsiteBuilder()

  return (
    <SubscriptionListWrapper className={className}>
      {!loading && !error && !data?.subscriptions?.length && (
        <SubscriptionListItemWrapper>
          <SubscriptionListItemContent>
            <strong>
              Sie haben noch keine aktive Zahlung.{' '}
              <Link href={subscribeUrl}>Jetzt unterstützen.</Link>
            </strong>
          </SubscriptionListItemContent>
        </SubscriptionListItemWrapper>
      )}

      {error && <Alert severity="error">{error.message}</Alert>}

      {data?.subscriptions?.map(subscription => (
        <SubscriptionListItem
          key={subscription.id}
          {...subscription}
          extend={async () => await onExtend?.(subscription.id)}
          cancel={async () => await onCancel?.(subscription.id)}
        />
      ))}
    </SubscriptionListWrapper>
  )
}
