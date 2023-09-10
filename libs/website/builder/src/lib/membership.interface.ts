import {Invoice, InvoicesQuery, Subscription} from '@wepublish/website/api'
import {QueryResult} from '@apollo/client'
import {SubscriptionsQuery} from '@wepublish/website/api'

export type BuilderSubscriptionListItemProps = Subscription & {
  className?: string
  pay?: () => Promise<void>
  cancel?: () => Promise<void>
  extend?: () => Promise<void>
}

export type BuilderSubscriptionListProps = Pick<
  QueryResult<SubscriptionsQuery>,
  'data' | 'loading' | 'error'
> & {
  className?: string
  onPay?: (subscriptionId: string) => Promise<void>
  onCancel?: (subscriptionId: string) => Promise<void>
  onExtend?: (subscriptionId: string) => Promise<void>
}

export type BuilderInvoiceListItemProps = Invoice & {
  className?: string
  pay?: () => Promise<void>
}

export type BuilderInvoiceListProps = Pick<
  QueryResult<InvoicesQuery>,
  'data' | 'loading' | 'error'
> & {
  className?: string
  onPay?: (invoiceId: string, paymentMethodId: string) => Promise<void>
}
