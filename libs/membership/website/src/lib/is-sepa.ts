import {Invoice, Subscription} from '@wepublish/website/api'

export const isSepaInvoice = (invoice: Invoice) =>
  invoice.subscription?.paymentMethod.description === 'sepa'

export const isSepaSubscription = (subscription: Subscription) =>
  subscription.paymentMethod.description === 'sepa'
