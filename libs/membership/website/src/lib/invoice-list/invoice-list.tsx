import {Skeleton, styled} from '@mui/material'
import {BuilderInvoiceListProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {InvoiceListItemContent, InvoiceListItemWrapper} from './invoice-list-item'
import {Invoice} from '@wepublish/website/api'

export const InvoiceListWrapper = styled('article')`
  display: grid;
  gap: ${({theme}) => theme.spacing(2)};
`

export const canPayInvoice = (invoice: Invoice) =>
  // @TODO: Remove when all 'payrexx subscriptions' subscriptions have been migrated
  invoice.subscription?.paymentMethod.slug !== 'payrexx-subscription' &&
  !invoice.canceledAt &&
  !invoice.paidAt

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
            {...invoice}
            canPay={canPayInvoice(invoice)}
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
