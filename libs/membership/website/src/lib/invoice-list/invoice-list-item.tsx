import {styled} from '@mui/material'
import {BuilderInvoiceListItemProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {useCallback, useState} from 'react'
import {MdAttachMoney, MdCalendarMonth, MdOutlineInfo, MdOutlineWarning} from 'react-icons/md'
import {formatChf} from '../formatters/format-currency'

export const InvoiceListItemWrapper = styled('div')`
  display: grid;
  gap: ${({theme}) => theme.spacing(1)};
  border-radius: ${({theme}) => theme.shape.borderRadius}px;
  border: 1px solid ${({theme}) => theme.palette.divider};
  overflow: hidden;
  container-type: inline-size;
`

export const InvoiceListItemContent = styled('div')`
  display: grid;
  gap: ${({theme}) => theme.spacing(2)};
  padding: ${({theme}) => theme.spacing(2)};
`

export const InvoiceListItemMeta = styled('ul')`
  list-style: none;
  margin: 0;
  padding: 0;
`

export const InvoiceListItemMetaItem = styled('li')`
  display: grid;
  grid-auto-flow: column;
  align-items: center;
  justify-content: start;
  gap: ${({theme}) => theme.spacing(1)};
`

export const InvoiceListItemActions = styled('div')`
  display: grid;
  gap: ${({theme}) => theme.spacing(2)};

  @container (min-width: 45ch) {
    display: flex;
    justify-content: center;
  }
`

export function InvoiceListItem({
  id,
  total,
  paidAt,
  createdAt,
  canceledAt,
  dueAt,
  subscription,
  pay,
  className
}: BuilderInvoiceListItemProps) {
  const {
    locale,
    elements: {H6, Button, Alert},
    date
  } = useWebsiteBuilder()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error>()
  const callAction = useCallback(async (action: () => Promise<void>) => {
    try {
      setError(undefined)
      setLoading(true)
      await action()
    } catch (e) {
      if (e instanceof Error) {
        setError(e)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  return (
    <InvoiceListItemWrapper className={className}>
      <InvoiceListItemContent>
        {!paidAt && !canceledAt && (
          <H6>Offene Rechnung {subscription && <>für {subscription.memberPlan.name}</>}</H6>
        )}

        {paidAt && (
          <H6>Bezahlte Rechnung {subscription && <>für {subscription.memberPlan.name}</>}</H6>
        )}

        {canceledAt && (
          <H6>Stornierte Rechnung {subscription && <>für {subscription.memberPlan.name}</>}</H6>
        )}

        <InvoiceListItemMeta>
          <InvoiceListItemMetaItem>
            <MdOutlineInfo /> Rechnungs-Nr: {id}
          </InvoiceListItemMetaItem>

          <InvoiceListItemMetaItem>
            <MdCalendarMonth />
            <span>
              Abgeschlossen am <time dateTime={createdAt}>{date.format(new Date(createdAt))}</time>
            </span>
          </InvoiceListItemMetaItem>

          <InvoiceListItemMetaItem>
            <MdOutlineWarning />
            <span>
              Fällig am <time dateTime={dueAt}>{date.format(new Date(dueAt))}</time>
            </span>
          </InvoiceListItemMetaItem>

          <InvoiceListItemMetaItem>
            <MdAttachMoney /> Betrag von {formatChf(total / 100, locale)}
          </InvoiceListItemMetaItem>
        </InvoiceListItemMeta>

        {paidAt && (
          <strong>
            Bezahlt am <time dateTime={paidAt}>{date.format(new Date(paidAt))}</time>
          </strong>
        )}

        {canceledAt && (
          <strong>
            Storniert am <time dateTime={canceledAt}>{date.format(new Date(canceledAt))}</time>
          </strong>
        )}

        {error && <Alert severity="error">{error.message}</Alert>}

        {!paidAt && !canceledAt && (
          <InvoiceListItemActions>
            <Button onClick={() => pay && callAction(pay)} disabled={loading}>
              Jetzt Bezahlen
            </Button>
          </InvoiceListItemActions>
        )}
      </InvoiceListItemContent>
    </InvoiceListItemWrapper>
  )
}
