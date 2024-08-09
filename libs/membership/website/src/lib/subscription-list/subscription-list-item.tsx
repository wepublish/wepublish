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
import {formatCurrency} from '../formatters/format-currency'
import {formatPaymentPeriod, formatPaymentTimeline} from '../formatters/format-payment-period'
import {MembershipModal} from '../membership-modal/membership-modal'

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
  memberPlan: {image, name, currency},
  url,
  canPay,
  pay,
  cancel,
  canExtend,
  extend,
  className
}: BuilderSubscriptionListItemProps) {
  const {
    meta: {locale},
    elements: {Image, H6, Button, Link, Alert, H5, Paragraph},
    date
  } = useWebsiteBuilder()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error>()
  const callAction = useAsyncAction(setLoading, setError)

  const periodicityTimeline = formatPaymentTimeline(paymentPeriodicity)
  const subscriptionDuration = formatPaymentPeriod(paymentPeriodicity)

  const [confirmCancel, setConfirmCancel] = useState(false)

  return (
    <SubscriptionListItemWrapper className={className}>
      {image && <Image image={image} />}

      <SubscriptionListItemContent>
        <H6>{name}</H6>

        <SubscriptionListItemMeta>
          <SubscriptionListItemMetaItem>
            <MdCalendarMonth />
            <span>
              Abgeschlossen am{' '}
              <time suppressHydrationWarning dateTime={startsAt}>
                {date.format(new Date(startsAt))}
              </time>
            </span>
          </SubscriptionListItemMetaItem>

          {paidUntil && (
            <SubscriptionListItemMetaItem>
              <MdOutlinePayments />
              <span>
                Bezahlt bis{' '}
                <time suppressHydrationWarning dateTime={paidUntil}>
                  {date.format(new Date(paidUntil))}
                </time>
              </span>
            </SubscriptionListItemMetaItem>
          )}

          {deactivation && (
            <>
              <SubscriptionListItemMetaItem>
                <MdCancel />
                <span>
                  Gekündigt am{' '}
                  <time suppressHydrationWarning dateTime={deactivation.date}>
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
            <MdAttachMoney /> Kostet {formatCurrency(monthlyAmount / 100, currency, locale)} pro
            Monat
          </SubscriptionListItemMetaItem>

          <SubscriptionListItemMetaItem>
            <MdHistory /> <Link href={url}>Details & Zahlungen</Link>
          </SubscriptionListItemMetaItem>
        </SubscriptionListItemMeta>

        {error && <Alert severity="error">{error.message}</Alert>}

        {!deactivation && (
          <SubscriptionListItemActions>
            <Button
              onClick={() => setConfirmCancel(true)}
              disabled={loading}
              variant="text"
              color="secondary">
              Abo Künden
            </Button>

            {canPay && (
              <Button onClick={callAction(pay)} disabled={loading}>
                Jetzt Bezahlen
              </Button>
            )}

            {canExtend && (
              <Button onClick={callAction(extend)} disabled={loading}>
                Jetzt Verlängern
              </Button>
            )}
          </SubscriptionListItemActions>
        )}
      </SubscriptionListItemContent>

      <MembershipModal
        open={!!confirmCancel}
        onSubmit={async () => {
          setConfirmCancel(false)
          await callAction(cancel)()
        }}
        onCancel={() => setConfirmCancel(false)}
        submitText={`Abo Künden`}>
        <H5 id="modal-modal-title" component="h1">
          {name} wirklich künden?
        </H5>

        <Paragraph gutterBottom={false}>
          Das Abo wird nicht mehr verlängert, bleibt aber gültig bis zum Ablaufsdatum. Alle offene
          Rechnungen des Abos werden storniert.
        </Paragraph>
      </MembershipModal>
    </SubscriptionListItemWrapper>
  )
}
