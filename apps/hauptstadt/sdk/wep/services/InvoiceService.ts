import {gql} from 'graphql-tag'
import Vue from 'vue'
import Service from '~/sdk/wep/services/Service'
import Invoices from '~/sdk/wep/models/invoice/Invoices'
import Invoice from '~/sdk/wep/models/invoice/Invoice'
import SubscriptionService from '~/sdk/wep/services/SubscriptionService'
import {InvoicesAndSubscriptions} from '~/sdk/wep/interfacesAndTypes/Custom'
import PaymentResponse from '~/sdk/wep/models/response/PaymentResponse'

export default class InvoiceService extends Service {
  constructor({vue}: {vue: Vue}) {
    super({vue})
  }

  /**
   * Retrieve my invoices
   * @param apollo
   * @return {Promise<boolean|Invoices>}
   */
  async getInvoices(): Promise<false | Invoices> {
    try {
      const query = gql`
        query getInvoices {
          invoices {
            ...invoice
            total
          }
        }
        ${Invoice.invoiceFragment}
      `
      const response = await this.$apollo.query({query, fetchPolicy: 'no-cache'})
      // parse api data
      return new Invoices().parseApiData(response.data.invoices)
    } catch (error) {
      this.alert({
        title: 'Rechnungen konnten nicht abgerufen werden.',
        type: 'error'
      })
      return false
    }
  }

  /**
   * Pay one of my invoices
   * @param apollo
   * @param successURL
   * @param failureURL
   * @return {Promise<boolean|PaymentResponse>}
   */
  async createPaymentFromInvoiceInput({
    invoiceID,
    paymentMethodID,
    successURL,
    failureURL
  }: {
    invoiceID: string
    paymentMethodID: string
    successURL: string
    failureURL: string
  }): Promise<false | PaymentResponse> {
    if (!invoiceID || !paymentMethodID || !successURL || !failureURL) {
      throw new Error('Missing parameters in createPaymentFromInvoiceInput() function!')
    }
    try {
      const mutation = gql`
        mutation CreatePaymentFromInvoice($input: PaymentFromInvoiceInput!) {
          createPaymentFromInvoice(input: $input) {
            ...paymentResponse
          }
        }
        ${PaymentResponse.paymentResponse}
      `
      const input = {
        invoiceID,
        paymentMethodID,
        successURL,
        failureURL
      }
      const response = await this.$apollo.mutate({
        mutation,
        variables: {
          input
        }
      })
      return new PaymentResponse(response?.data?.createPaymentFromInvoice)
    } catch (error) {
      this.alert({
        title: 'Zahlung aus Rechnung konnte nicht erstellt werden.',
        type: 'error'
      })
      return false
    }
  }

  /**
   * Check open invoices at the payment providers.
   * @param invoices
   */
  async checkUnpaidInvoices({
    invoices,
    subscriptions
  }: InvoicesAndSubscriptions): Promise<InvoicesAndSubscriptions> {
    let hasUpdatedInvoices = false
    const openInvoices = invoices.getUnpaidInvoices()
    for (const invoice of openInvoices) {
      const checkedInvoice = await this.checkInvoiceStatus({invoiceId: invoice.id})
      if (!checkedInvoice) {
        continue
      }
      if (checkedInvoice.isPaid()) {
        hasUpdatedInvoices = true
      }
      invoices.replaceInvoice(checkedInvoice)
    }

    // eventually refresh subscriptions
    if (hasUpdatedInvoices) {
      subscriptions =
        (await new SubscriptionService({vue: this.vue}).getSubscriptions()) || subscriptions
    }
    return {
      invoices,
      subscriptions
    }
  }

  /**
   * Check and update state of a particular invoice
   * @param apollo
   * @param invoiceId
   * @return {Promise<Invoice|boolean>}
   */
  async checkInvoiceStatus({invoiceId}: {invoiceId: string}): Promise<false | Invoice> {
    if (!invoiceId) {
      throw new Error('InvoiceId prop missing in checkInvoiceStatus() function!')
    }
    try {
      const query = gql`
        query CheckInvoiceStatus($checkInvoiceStatusId: ID!) {
          checkInvoiceStatus(id: $checkInvoiceStatusId) {
            ...invoice
            total
          }
        }
        ${Invoice.invoiceFragment}
      `
      const variables = {
        checkInvoiceStatusId: invoiceId
      }
      const response = await this.$apollo.query({query, variables})
      return new Invoice(response.data?.checkInvoiceStatus)
    } catch (error) {
      this.alert({
        title: `Rechnung mit der Id ${invoiceId} konnte nicht aktualisiert werden.`,
        type: 'error'
      })
      return false
    }
  }
}
