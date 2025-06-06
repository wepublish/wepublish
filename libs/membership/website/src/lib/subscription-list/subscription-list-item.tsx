import styled from '@emotion/styled'
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
  const [confirmExtend, setConfirmExtend] = useState<boolean>(false)

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
              Abo kündigen
            </Button>

            {canExtend && (
              <Button onClick={() => setConfirmExtend(true)} disabled={loading}>
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
        submitText={`Abo kündigen`}>
        <H5 id="modal-modal-title" component="h1">
          {name} wirklich kündigen?
        </H5>

        <Paragraph gutterBottom={false}>
          Das Abo wird nicht mehr verlängert, bleibt aber gültig bis zum Ablaufsdatum. Alle offene
          Rechnungen des Abos werden storniert.
        </Paragraph>
      </MembershipModal>

      <MembershipModal
        open={confirmExtend}
        onCancel={() => setConfirmExtend(false)}
        onSubmit={async () => {
          setConfirmExtend(false)
          await callAction(extend)()
        }}
        submitText={'Jetzt Verlängern'}>
        <H5 component="h1">Abo frühzeitig verlängern?</H5>
        <Paragraph gutterBottom={false}>
          Wir freuen uns, dass du dein Abo frühzeitig um ein {subscriptionDuration} verlängern
          willst. Weiterfahren?
        </Paragraph>
      </MembershipModal>
    </SubscriptionListItemWrapper>
  )
}
