import Invoice from './Invoice'
import Subscriptions from '~/sdk/wep/models/subscription/Subscriptions'

export default class Invoices {
  public invoices: Invoice[]

  constructor() {
    // Type: Invoice
    this.invoices = []
  }

  parseApiData(apiData: Invoice[]): Invoices {
    this.invoices = []
    if (!apiData || !apiData.length) {
      return this
    }
    for (const tmpInvoice of apiData) {
      const invoice = new Invoice(tmpInvoice)
      this.invoices.push(invoice)
    }
    return this
  }

  public getInvoices() {
    return this.invoices
  }

  public getInvoiceById(id: string) {
    return this.invoices.find(invoice => invoice.id === id)
  }

  public getUnpaidInvoices(): Invoice[] {
    return this.invoices.filter(invoice => !invoice.paidAt && !invoice.canceledAt)
  }

  public indicateOpenInvoices(
    autoChargingPaymentMethods: string[],
    relatedSubscriptions?: Subscriptions
  ): boolean {
    if (!relatedSubscriptions) {
      return false
    }
    const openInvoices = this.getUnpaidInvoices()
    if (!openInvoices) {
      return false
    }
    // check any invoice, if not payrexx subscription, not auto charging invoice and before due date
    for (const openInvoice of openInvoices) {
      const relatedSubscription = relatedSubscriptions.getSubscriptionById(
        openInvoice.subscriptionID
      )
      if (!relatedSubscription) {
        continue
      }
      // every non auto charged subscription hits
      if (!relatedSubscription.willBeAutoCharged(autoChargingPaymentMethods)) {
        return true
      }
    }
    return false
  }

  public getOpenInvoicesBySubscriptionId(subscriptionId: string): Invoice[] {
    return this.getUnpaidInvoices().filter(invoice => invoice.subscriptionID === subscriptionId)
  }

  public findOpenInvoiceBySubscriptionId(subscriptionId: string): undefined | Invoice {
    return this.getUnpaidInvoices().find(invoice => invoice.subscriptionID === subscriptionId)
  }

  public replaceInvoice(invoice: Invoice): Invoices {
    const invoiceIndex = this.invoices.findIndex(findInvoice => findInvoice.id === invoice.id)
    if (invoiceIndex >= 0) {
      this.invoices[invoiceIndex] = invoice
    }
    return this
  }
}
