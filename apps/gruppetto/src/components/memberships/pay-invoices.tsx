import {Alert, CircularProgress, styled} from '@mui/material'
import {BuilderPayInvoicesProps, useWebsiteBuilder} from '@wepublish/website'
import {memo} from 'react'
import {formatChf} from './format-chf'

const ProgressWrapper = styled('div')`
  display: flex;
  justify-content: center;
`

const TitleWrapper = styled('div')`
  justify-self: flex-start;
`

const PayInvoicesWrapper = styled('div')`
  display: grid;
  gap: ${({theme}) => theme.spacing(2)};
  text-align: center;
`

const CustomPayInvoices = ({invoices, onSubmit, pay}: BuilderPayInvoicesProps) => {
  const {
    elements: {H4, Button}
  } = useWebsiteBuilder()

  if (!invoices) {
    return (
      <ProgressWrapper>
        <CircularProgress />
      </ProgressWrapper>
    )
  }

  if (!invoices.length) {
    return <></>
  }

  return (
    <PayInvoicesWrapper>
      <TitleWrapper>
        <H4 component={'h3'}>Offene Rechnungen</H4>
      </TitleWrapper>

      {pay.error?.message && <Alert severity="error">{pay.error?.message}</Alert>}

      {invoices.map(({invoice, paymentMethod}) => (
        <Button
          key={invoice.id}
          onClick={() =>
            !pay.loading &&
            onSubmit({
              successURL: `${location.origin}/payment/success`,
              failureURL: `${location.origin}/payment/fail`,
              invoiceID: invoice.id,
              paymentMethodID: paymentMethod.id
            })
          }>
          Rechnung für {formatChf(invoice.total / 100)} bezahlen
        </Button>
      ))}
    </PayInvoicesWrapper>
  )
}

export const PayInvoices = memo(CustomPayInvoices)
