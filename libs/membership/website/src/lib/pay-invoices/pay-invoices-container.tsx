import {useUser} from '@wepublish/authentication/website'
import {useWebsiteBuilder} from '@wepublish/website/builder'
import {
  CheckInvoiceStatusQuery,
  useCheckInvoiceStatusLazyQuery,
  useInvoicesLazyQuery,
  usePayMutation,
  useSubscriptionsLazyQuery
} from '@wepublish/website/api'
import {useEffect, useMemo, useState} from 'react'

export type PayInvoicesContainerProps = {}

export const PayInvoicesContainer = (props: PayInvoicesContainerProps) => {
  const {user} = useUser()
  const [checkedInvoices, setCheckedInvoices] =
    useState<CheckInvoiceStatusQuery['checkInvoiceStatus'][]>()

  const [pay, result] = usePayMutation({
    onCompleted(data) {
      if (data.createPaymentFromInvoice?.intentSecret) {
        window.location.href = data.createPaymentFromInvoice.intentSecret
      }
    }
  })
  const [getSubscriptions, subscriptionList] = useSubscriptionsLazyQuery()
  const [checkInvoice] = useCheckInvoiceStatusLazyQuery()
  const [getInvoices] = useInvoicesLazyQuery({
    onCompleted: async data => {
      const invoices = await Promise.all(
        data?.invoices.map(async ({id}) => {
          const {data: checked} = await checkInvoice({variables: {id}})

          if (checked?.checkInvoiceStatus?.paidAt || checked?.checkInvoiceStatus?.canceledAt) {
            return null
          }

          return checked?.checkInvoiceStatus ?? null
        })
      )

      setCheckedInvoices(invoices)
    }
  })

  const {PayInvoices} = useWebsiteBuilder()

  useEffect(() => {
    if (user) {
      getInvoices()
      getSubscriptions()
    }
  }, [user, getInvoices, getSubscriptions])

  const invoices = useMemo(() => {
    return checkedInvoices
      ?.filter(function <T>(value: T): value is NonNullable<T> {
        return value != null
      })
      .map(invoice => {
        const subscription = subscriptionList.data?.subscriptions.find(
          sub => sub.id === invoice.subscriptionID
        )

        return {
          invoice,
          paymentMethod: subscription?.paymentMethod
        }
      })
  }, [checkedInvoices, subscriptionList])

  if (!user) {
    return null
  }

  return (
    <PayInvoices
      invoices={invoices as any}
      pay={result}
      onSubmit={data =>
        pay({
          variables: {
            ...data
          }
        })
      }
    />
  )
}
