import {PaymentForm, usePayInvoice} from '@wepublish/payment/website'
import {
  FullInvoiceFragment,
  useCheckInvoiceStatusLazyQuery,
  useInvoicesQuery
} from '@wepublish/website/api'
import {BuilderContainerProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {produce} from 'immer'
import {useMemo} from 'react'

export type InvoiceListContainerProps = {
  filter?: (invoices: FullInvoiceFragment[]) => FullInvoiceFragment[]
} & BuilderContainerProps

export function InvoiceListContainer({filter, className}: InvoiceListContainerProps) {
  const {InvoiceList} = useWebsiteBuilder()
  const [checkInvoice, {loading: loadingCheckInvoice}] = useCheckInvoiceStatusLazyQuery()
  const {
    data,
    loading: loadingInvoices,
    error
  } = useInvoicesQuery({
    onCompleted(data) {
      for (const {id, paidAt, canceledAt} of data.invoices) {
        if (paidAt || canceledAt) {
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

  const [pay, redirectPages, stripeClientSecret] = usePayInvoice()

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
      <PaymentForm stripeClientSecret={stripeClientSecret} redirectPages={redirectPages} />

      <InvoiceList
        data={filteredInvoices}
        loading={loading}
        error={error}
        className={className}
        onPay={async (invoiceId, paymentMethodId) => {
          const memberPlan = filteredInvoices?.invoices?.find(invoice => invoice.id === invoiceId)
            ?.subscription?.memberPlan

          await pay(memberPlan, {
            variables: {
              invoiceId,
              paymentMethodId
            }
          })
        }}
      />
    </>
  )
}
