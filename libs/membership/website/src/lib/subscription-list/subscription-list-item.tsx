import {styled} from '@mui/material'
import {SubscriptionDeactivationReason} from '@wepublish/website/api'
import {
  BuilderSubscriptionListItemProps,
  useAsyncAction,
  useWebsiteBuilder
} from '@wepublish/website/builder'
import {useState} from 'react'
import {
  MdAttachMoney,
  MdAutorenew,
  MdCalendarMonth,
  MdCancel,
  MdHistory,
  MdOutlinePayments,
  MdTimelapse
} from 'react-icons/md'
import {formatChf} from '../formatters/format-currency'
import {formatPaymentPeriod, formatPaymentTimeline} from '../formatters/format-payment-period'

export const SubscriptionListItemWrapper = styled('div')`
  display: grid;
  gap: ${({theme}) => theme.spacing(1)};
  border-radius: ${({theme}) => theme.shape.borderRadius}px;
  border: 1px solid ${({theme}) => theme.palette.divider};
  overflow: hidden;
  container-type: inline-size;
`

export const SubscriptionListItemContent = styled('div')`
  display: grid;
  gap: ${({theme}) => theme.spacing(2)};
  padding: ${({theme}) => theme.spacing(2)};
`

export const SubscriptionListItemMeta = styled('ul')`
  list-style: none;
  margin: 0;
  padding: 0;
`

export const SubscriptionListItemMetaItem = styled('li')`
  display: grid;
  grid-auto-flow: column;
  align-items: center;
  justify-content: start;
  gap: ${({theme}) => theme.spacing(1)};
`

export const SubscriptionListItemActions = styled('div')`
  display: grid;
  gap: ${({theme}) => theme.spacing(2)};

  @container (min-width: 45ch) {
    display: flex;
    justify-content: space-between;
  }
`

export function SubscriptionListItem({
  autoRenew,
  startsAt,
  paidUntil,
  paymentPeriodicity,
  monthlyAmount,
  deactivation,
  memberPlan: {image, name},
  url,
  pay,
  cancel,
  extend,
  className
}: BuilderSubscriptionListItemProps) {
  const {
    meta: {locale},
    elements: {Image, H6, Button, Link, Alert},
    date
  } = useWebsiteBuilder()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error>()
  const callAction = useAsyncAction(setLoading, setError)

  const periodicityTimeline = formatPaymentTimeline(paymentPeriodicity)
  const subscriptionDuration = formatPaymentPeriod(paymentPeriodicity)

  return (
    <SubscriptionListItemWrapper className={className}>
      {image && <Image image={image} />}

      <SubscriptionListItemContent>
        <H6>{name}</H6>

        <SubscriptionListItemMeta>
          <SubscriptionListItemMetaItem>
            <MdCalendarMonth />
            <span>
              Abgeschlossen am <time dateTime={startsAt}>{date.format(new Date(startsAt))}</time>
            </span>
          </SubscriptionListItemMetaItem>

          {paidUntil && (
            <SubscriptionListItemMetaItem>
              <MdOutlinePayments />
              <span>
                Bezahlt bis <time dateTime={paidUntil}>{date.format(new Date(paidUntil))}</time>
              </span>
            </SubscriptionListItemMetaItem>
          )}

          {deactivation && (
            <>
              <SubscriptionListItemMetaItem>
                <MdCancel />
                <span>
                  Gekündigt am{' '}
                  <time dateTime={deactivation.date}>
                    {date.format(new Date(deactivation.date))}
                  </time>
                </span>
              </SubscriptionListItemMetaItem>

              {deactivation.reason === SubscriptionDeactivationReason.InvoiceNotPaid && (
                <SubscriptionListItemMetaItem>
                  <MdCancel /> Automatisch gekündigt
                </SubscriptionListItemMetaItem>
              )}

              {deactivation.reason === SubscriptionDeactivationReason.None && (
                <SubscriptionListItemMetaItem>
                  <MdCancel /> Kündigungsgrund ist unbekannt.
                </SubscriptionListItemMetaItem>
              )}
            </>
          )}

          {!paidUntil && (
            <SubscriptionListItemMetaItem>
              <MdOutlinePayments /> Abo ist unbezahlt
            </SubscriptionListItemMetaItem>
          )}

          {autoRenew && (
            <SubscriptionListItemMetaItem>
              <MdAutorenew /> Wird automatisch {periodicityTimeline} erneuert
            </SubscriptionListItemMetaItem>
          )}

          {!autoRenew && (
            <SubscriptionListItemMetaItem>
              <MdTimelapse /> Gültig für {subscriptionDuration}
            </SubscriptionListItemMetaItem>
          )}

          <SubscriptionListItemMetaItem>
            <MdAttachMoney /> Kostet {formatChf(monthlyAmount / 100, locale)} pro Monat
          </SubscriptionListItemMetaItem>

          <SubscriptionListItemMetaItem>
            <MdHistory /> <Link href={url}>Details & Zahlungen</Link>
          </SubscriptionListItemMetaItem>
        </SubscriptionListItemMeta>

        {error && <Alert severity="error">{error.message}</Alert>}

        {!deactivation && (
          <SubscriptionListItemActions>
            <Button
              onClick={callAction(cancel)}
              disabled={loading}
              variant="text"
              color="secondary">
              Abo Kündigen
            </Button>

            {!paidUntil && (
              <Button onClick={callAction(pay)} disabled={loading}>
                Jetzt Bezahlen
              </Button>
            )}

            {paidUntil && (
              <Button onClick={callAction(extend)} disabled={loading}>
                Jetzt Verlängern
              </Button>
            )}
          </SubscriptionListItemActions>
        )}
      </SubscriptionListItemContent>
    </SubscriptionListItemWrapper>
  )
}
