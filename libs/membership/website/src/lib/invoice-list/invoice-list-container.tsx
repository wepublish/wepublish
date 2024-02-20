import {
  Invoice,
  useCheckInvoiceStatusLazyQuery,
  useInvoicesQuery,
  usePayInvoiceMutation
} from '@wepublish/website/api'
import {BuilderContainerProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {produce} from 'immer'
import {useMemo} from 'react'

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

  const filteredInvoices = useMemo(
    () =>
      produce(data, draftData => {
        if (filter && draftData?.invoices) {
          draftData.invoices = filter(draftData.invoices)
        }
      }),
    [data, filter]
  )

  return (
    <InvoiceList
      data={filteredInvoices}
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
