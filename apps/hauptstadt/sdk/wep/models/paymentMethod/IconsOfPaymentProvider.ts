import {PaymentProviderSlug} from '~/sdk/wep/interfacesAndTypes/WePublish'
export type PaymentProviderIconName =
  | 'invoice'
  | 'mastercard'
  | 'twint'
  | 'visa'
  | 'paypal'
  | 'postfinance'

export default class IconsOfPaymentProvider {
  public paymentProviderSlug: PaymentProviderSlug
  public iconNames: PaymentProviderIconName[]

  constructor({
    paymentProviderSlug,
    iconNames
  }: {
    paymentProviderSlug: PaymentProviderSlug
    iconNames: PaymentProviderIconName[]
  }) {
    this.paymentProviderSlug = paymentProviderSlug
    this.iconNames = iconNames
  }
}
