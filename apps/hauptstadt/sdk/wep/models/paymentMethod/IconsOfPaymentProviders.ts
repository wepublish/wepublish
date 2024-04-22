import IconsOfPaymentProvider from '~/sdk/wep/models/paymentMethod/IconsOfPaymentProvider'

export default class IconsOfPaymentProviders {
  public iconsOfPaymentProviders: IconsOfPaymentProvider[]

  constructor() {
    this.iconsOfPaymentProviders = []
  }

  public getPaymentProviderIconBySlug(
    paymentProviderSlug: string
  ): undefined | IconsOfPaymentProvider {
    return this.iconsOfPaymentProviders.find(
      (iconsOfPaymentProvider: IconsOfPaymentProvider) =>
        iconsOfPaymentProvider.paymentProviderSlug === paymentProviderSlug
    )
  }
}
