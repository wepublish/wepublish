import {gql} from 'graphql-tag'
import PaymentMethods from '~/sdk/wep/models/paymentMethod/PaymentMethods'
import PaymentMethod from '~/sdk/wep/models/paymentMethod/PaymentMethod'

export type PaymentPeriodicity = 'MONTHLY' | 'QUARTERLY' | 'BIANNUAL' | 'YEARLY'

export default class AvailablePaymentMethod {
  public forceAutoRenewal: boolean
  public paymentMethods: PaymentMethods
  public paymentPeriodicities: PaymentPeriodicity[]

  constructor({
    forceAutoRenewal,
    paymentMethods,
    paymentPeriodicities
  }: {
    forceAutoRenewal: boolean
    paymentMethods: PaymentMethod[] | PaymentMethods
    paymentPeriodicities: PaymentPeriodicity[]
  }) {
    this.forceAutoRenewal = forceAutoRenewal
    this.paymentMethods =
      paymentMethods instanceof PaymentMethods
        ? paymentMethods
        : new PaymentMethods().parseApiData(paymentMethods)
    this.paymentPeriodicities = paymentPeriodicities
  }

  public getPaymentMethods(): PaymentMethods {
    return this.paymentMethods
  }

  public static availablePaymentMethodFragment = gql`
    fragment availablePaymentMethod on AvailablePaymentMethod {
      paymentMethods {
        ...paymentMethod
      }
      paymentPeriodicities
      forceAutoRenewal
    }
    ${PaymentMethod.paymentMethodFragment}
  `
}
