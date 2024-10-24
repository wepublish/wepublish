import {StripeElement, StripePayment} from '@wepublish/payment/website'
import {
  Invoice,
  useCheckInvoiceStatusLazyQuery,
  useInvoicesQuery,
  usePayInvoiceMutation
} from '@wepublish/website/api'
import {BuilderContainerProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {produce} from 'immer'
import {useMemo, useState} from 'react'

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
  const [stripeClientSecret, setStripeClientSecret] = useState<string>()
  const {InvoiceList} = useWebsiteBuilder()
  const [checkInvoice, {loading: loadingCheckInvoice}] = useCheckInvoiceStatusLazyQuery()
  const {
    data,
    loading: loadingInvoices,
    error
  } = useInvoicesQuery({
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
      if (!data.createPaymentFromInvoice?.intentSecret) {
        return
      }

      if (data.createPaymentFromInvoice.paymentMethod.paymentProviderID === 'stripe') {
        setStripeClientSecret(data.createPaymentFromInvoice.intentSecret)
      }

      if (data.createPaymentFromInvoice.intentSecret.startsWith('http')) {
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

  const loading = useMemo(
    () => loadingInvoices || loadingCheckInvoice,
    [loadingInvoices, loadingCheckInvoice]
  )

  return (
    <>
      {stripeClientSecret && (
        <StripeElement clientSecret={stripeClientSecret}>
          <StripePayment
            onClose={success => {
              window.location.href = success ? successURL : failureURL
            }}
          />
        </StripeElement>
      )}

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
    </>
  )
}
