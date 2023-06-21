import {MutationResult} from '@apollo/client'
import {Invoice, PaymentMethod, PayMutation, PayMutationVariables} from '@wepublish/website/api'

export type BuilderPayInvoicesProps = {
  invoices:
    | {
        invoice: Invoice
        paymentMethod: PaymentMethod
      }[]
    | null
    | undefined
  pay: Pick<MutationResult<PayMutation>, 'data' | 'loading' | 'error'>
  onSubmit: (
    data: Pick<PayMutationVariables, 'successURL' | 'failureURL' | 'invoiceID' | 'paymentMethodID'>
  ) => void
  className?: string
}
