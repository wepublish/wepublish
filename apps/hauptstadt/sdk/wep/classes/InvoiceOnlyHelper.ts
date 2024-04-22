import {PaymentMethodId} from '~/sdk/wep/interfacesAndTypes/WePublish'
import Invoice from '~/sdk/wep/models/invoice/Invoice'
import Subscription from '~/sdk/wep/models/subscription/Subscription'

export function isInvoiceOnly({
  invoice,
  subscription,
  payrexxInvoiceOnlySlug
}: {
  invoice?: Invoice
  subscription: Subscription | undefined
  payrexxInvoiceOnlySlug: string
}): boolean {
  if (invoice?.isPaid()) {
    return false
  }
  if (!subscription) {
    return false
  }
  const paymentMethodSlug = subscription.getPaymentMethod()?.getSlug()

  // DEPRECATED check: payrexx invoice only
  if (paymentMethodSlug === payrexxInvoiceOnlySlug) {
    return true
  }

  // check Bexio
  const bexioType: PaymentMethodId = 'bexio'
  return paymentMethodSlug === bexioType
}
