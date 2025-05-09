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
  invoice.subscription?.paymentMethod.slug !== 'payrexx-subscription' &&
  !invoice.canceledAt &&
  !invoice.paidAt &&
  !isSepa(invoice)

export const isSepa = (invoice: FullInvoiceFragment) =>
  invoice.subscription?.paymentMethod.description === 'sepa'

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
            isSepa={isSepa(invoice)}
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
