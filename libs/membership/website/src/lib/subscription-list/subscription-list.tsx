import {styled} from '@mui/material'
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
  onCancel,
  onExtend,
  onPay,
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
          pay={async () => await onPay?.(subscription.id)}
          extend={async () => await onExtend?.(subscription.id)}
          cancel={async () => await onCancel?.(subscription.id)}
        />
      ))}
    </SubscriptionListWrapper>
  )
}
