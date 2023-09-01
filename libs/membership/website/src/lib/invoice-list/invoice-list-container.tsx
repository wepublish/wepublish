import {
  Invoice,
  useCheckInvoiceStatusLazyQuery,
  useInvoicesQuery,
  usePayInvoiceMutation
} from '@wepublish/website/api'
import {BuilderContainerProps, useWebsiteBuilder} from '@wepublish/website/builder'

export type InvoiceListContainerProps = {
  successURL: string
  failureURL: string
  filter?: (invoices: Invoice[]) => Invoice[]
} & BuilderContainerProps

export function InvoiceListContainer({
  filter,
  successURL,
  failureURL,
  className
}: InvoiceListContainerProps) {
  const {InvoiceList} = useWebsiteBuilder()
  const [checkInvoice] = useCheckInvoiceStatusLazyQuery()
  const {data, loading, error} = useInvoicesQuery({
    onCompleted(data) {
      for (const {id, paidAt} of data.invoices) {
        if (paidAt) {
          continue
        }

        checkInvoice({
          variables: {
            id
          }
        })
      }
    }
  })

  const [pay] = usePayInvoiceMutation({
    onCompleted(data) {
      if (data.createPaymentFromInvoice?.intentSecret) {
        window.location.href = data.createPaymentFromInvoice.intentSecret
      }
    }
  })

  return (
    <InvoiceList
      data={
        filter && data?.invoices
          ? {
              ...data,
              invoices: filter(data.invoices)
            }
          : data
      }
      loading={loading}
      error={error}
      className={className}
      onPay={async (invoiceId, paymentMethodId) => {
        await pay({
          variables: {
            invoiceId,
            paymentMethodId,
            failureURL,
            successURL
          }
        })
      }}
    />
  )
}
