import {styled} from '@mui/material'
import {BuilderInvoiceListProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {InvoiceListItemContent, InvoiceListItemWrapper} from './invoice-list-item'

export const InvoiceListWrapper = styled('article')`
  display: grid;
  gap: ${({theme}) => theme.spacing(2)};
`

export const InvoiceList = ({data, loading, error, onPay, className}: BuilderInvoiceListProps) => {
  const {
    InvoiceListItem,
    elements: {Alert}
  } = useWebsiteBuilder()

  return (
    <InvoiceListWrapper className={className}>
      {!loading && !error && !data?.invoices?.length && (
        <InvoiceListItemWrapper>
          <InvoiceListItemContent>
            <strong>Keine offenen Rechnungen</strong>
          </InvoiceListItemContent>
        </InvoiceListItemWrapper>
      )}

      {error && <Alert severity="error">{error.message}</Alert>}

      {data?.invoices?.map(invoice => (
        <InvoiceListItem
          key={invoice.id}
          {...invoice}
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
