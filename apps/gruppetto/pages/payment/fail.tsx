import styled from '@emotion/styled'
import {Alert, CircularProgress, Typography} from '@mui/material'
import {ApiV1, useUser, useWebsiteBuilder} from '@wepublish/website'
import {useRouter} from 'next/router'
import {useEffect, useMemo, useState} from 'react'

const ProgressWrapper = styled('div')`
  display: flex;
  justify-content: center;
`

const PaymentFailWrapper = styled('article')`
  display: grid;
  grid-template-columns: minmax(auto, 700px);
  gap: ${({theme}) => theme.spacing(5)};
  justify-content: center;
  justify-items: center;
`

const PaymentIcon = styled('svg')`
  width: 100px;
`

const PaymentButtonWrapper = styled('div')`
  display: grid;
  gap: ${({theme}) => theme.spacing(2)};
  justify-self: flex-start;
`

export default function PaymentFail() {
  const router = useRouter()
  const {hasUser} = useUser()
  const [checkedInvoices, setCheckedInvoices] =
    useState<ApiV1.CheckInvoiceStatusQuery['checkInvoiceStatus'][]>()

  const [pay, payResult] = ApiV1.usePayInvoiceMutation({
    onCompleted(data) {
      if (data.createPaymentFromInvoice?.intentSecret) {
        window.location.href = data.createPaymentFromInvoice.intentSecret
      }
    }
  })
  const [getSubscriptions, subscriptionList] = ApiV1.useSubscriptionsLazyQuery()
  const [checkInvoice] = ApiV1.useCheckInvoiceStatusLazyQuery()
  const [getInvoices] = ApiV1.useInvoicesLazyQuery({
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

  const {
    elements: {Button}
  } = useWebsiteBuilder()

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

  useEffect(() => {
    if (invoices && !invoices.length) {
      router.push('/')
    }
  }, [invoices, router])

  useEffect(() => {
    if (hasUser) {
      getInvoices()
      getSubscriptions()
    } else {
      router.push('/')
    }
  }, [hasUser, router, getInvoices, getSubscriptions])

  if (!invoices?.length) {
    return (
      <ProgressWrapper>
        <CircularProgress />
      </ProgressWrapper>
    )
  }

  return (
    <PaymentFailWrapper>
      <PaymentIcon xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill="#F084AD" stroke="#F084AD" stroke-width="10" />
        <path
          stroke="#fff"
          stroke-linecap="round"
          stroke-width="10"
          d="m32 68 35.8889-36M68 68 32 32.1111"
        />
      </PaymentIcon>

      <div>
        <Typography component="h1" variant="h3" marginBottom={3}>
          Ups! Irgendetwas hat nicht richtig funktioniert.
        </Typography>

        <Typography variant="body1">
          Geh nochmals zurück und versuche es nochmals. Keine Angst, es wurde noch nichts belastet.
          Wenn es funktioniert hätte, hättest du eine Bestätigungsmail bekommen.
        </Typography>
      </div>

      {payResult.error?.message && <Alert severity="error">{payResult.error?.message}</Alert>}

      <PaymentButtonWrapper>
        {invoices.map(({invoice, paymentMethod}) => (
          <Button
            key={invoice.id}
            onClick={() =>
              !payResult.loading &&
              pay({
                variables: {
                  successURL: `${location.origin}/payment/success`,
                  failureURL: `${location.origin}/payment/fail`,
                  invoiceId: invoice.id,
                  paymentMethodId: paymentMethod?.id
                }
              })
            }>
            Nochmals versuchen
          </Button>
        ))}
      </PaymentButtonWrapper>
    </PaymentFailWrapper>
  )
}
