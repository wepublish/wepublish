import {Skeleton} from '@mui/material'
import styled from '@emotion/styled'
import {BuilderInvoiceListProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {InvoiceListItemContent, InvoiceListItemWrapper} from './invoice-list-item'
import {FullInvoiceFragment} from '@wepublish/website/api'

export const InvoiceListWrapper = styled('article')`
  display: grid;
  gap: ${({theme}) => theme.spacing(2)};
`

export const canPayInvoice = (invoice: FullInvoiceFragment) =>
  // @TODO: Remove when all 'payrexx subscriptions' subscriptions have been migrated
  !isPayrexxSubscription(invoice) &&
  !isBexio(invoice) &&
  !isSepa(invoice) &&
  isInvoiceActive(invoice)

export const isSepa = (invoice: FullInvoiceFragment) =>
  invoice.subscription?.paymentMethod.description === 'sepa'

export const isBexio = (invoice: FullInvoiceFragment) =>
  invoice.subscription?.paymentMethod.slug === 'bexio'

export const isPayrexxSubscription = (invoice: FullInvoiceFragment) =>
  invoice.subscription?.paymentMethod.slug === 'payrexx-subscription'

export const isInvoiceActive = (invoice: FullInvoiceFragment) =>
  !invoice.canceledAt && !invoice.paidAt

export const InvoiceList = ({data, loading, error, onPay, className}: BuilderInvoiceListProps) => {
  const {
    InvoiceListItem,
    elements: {Alert}
  } = useWebsiteBuilder()

  return (
    <InvoiceListWrapper className={className}>
      {loading && <Skeleton variant={'rectangular'} />}

      {!loading && !error && !data?.invoices?.length && (
        <InvoiceListItemWrapper>
          <InvoiceListItemContent>
            <strong>Keine offenen Rechnungen</strong>
          </InvoiceListItemContent>
        </InvoiceListItemWrapper>
      )}

      {error && <Alert severity="error">{error.message}</Alert>}

      {!loading &&
        data?.invoices?.map(invoice => (
          <InvoiceListItem
            key={invoice.id}
            invoice={invoice}
            pay={async () => {
              if (invoice?.subscription) {
                return await onPay?.(invoice.id, invoice.subscription.paymentMethod.id)
              }
            }}
          />
        ))}
    </InvoiceListWrapper>
  )
}
