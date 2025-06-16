import {ApolloQueryResult} from '@apollo/client'
import {StripeElement, StripePayment} from '@wepublish/payment/website'
import {
  Exact,
  FullInvoiceFragment,
  FullMemberPlanFragment,
  InvoicesQuery,
  useCheckInvoiceStatusLazyQuery,
  useInvoicesQuery,
  usePageLazyQuery,
  usePayInvoiceMutation
} from '@wepublish/website/api'
import {BuilderContainerProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {produce} from 'immer'
import {createContext, useMemo, useState} from 'react'

export type InvoiceListContainerProps = {
  filter?: (invoices: FullInvoiceFragment[]) => FullInvoiceFragment[]
} & BuilderContainerProps

type RefetchFunction = (
  variables?:
    | Partial<
        Exact<{
          [key: string]: never
        }>
      >
    | undefined
) => Promise<ApolloQueryResult<InvoicesQuery>>

export const InvoiceListConext = createContext<{refetch: RefetchFunction | undefined}>({
  refetch: undefined
})

export function InvoiceListContainer({filter, className}: InvoiceListContainerProps) {
  const [stripeClientSecret, setStripeClientSecret] = useState<string>()
  const [stripeMemberPlan, setStripeMemberPlan] = useState<FullMemberPlanFragment>()
  const {InvoiceList} = useWebsiteBuilder()
  const [checkInvoice, {loading: loadingCheckInvoice}] = useCheckInvoiceStatusLazyQuery()
  const {
    data,
    loading: loadingInvoices,
    error,
    refetch
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

  // @TODO: Replace with objects on Memberplan when Memberplan has been migrated to V2
  // Pages are currently in V2 and Memberplan are in V1, so we have no access to page objects.
  const [fetchPage] = usePageLazyQuery()

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
            onClose={async success => {
              if (stripeMemberPlan) {
                const page = await fetchPage({
                  variables: {
                    id: success ? stripeMemberPlan.successPageId : stripeMemberPlan.failPageId
                  }
                })

                window.location.href = page.data?.page.url ?? ''
              }
            }}
          />
        </StripeElement>
      )}

      <InvoiceListConext.Provider value={{refetch}}>
        <InvoiceList
          data={filteredInvoices}
          loading={loading}
          error={error}
          className={className}
          onPay={async (invoiceId, paymentMethodId) => {
            const memberPlan = filteredInvoices?.invoices?.find(invoice => invoice.id === invoiceId)
              ?.subscription?.memberPlan
            setStripeMemberPlan(memberPlan)

            const [successPage, failPage] = await Promise.all([
              fetchPage({
                variables: {
                  id: memberPlan?.successPageId
                }
              }),
              fetchPage({
                variables: {
                  id: memberPlan?.successPageId
                }
              })
            ])

            await pay({
              variables: {
                invoiceId,
                paymentMethodId,
                successURL: successPage.data?.page.url,
                failureURL: failPage.data?.page.url
                // failureURL: memberPlan?.failPage?.url,
                // successURL: memberPlan?.successPage?.url
              }
            })
          }}
        />
      </InvoiceListConext.Provider>
    </>
  )
}
