import AvailablePaymentMethod from '~/sdk/wep/models/paymentMethod/AvailablePaymentMethod'

export default class AvailablePaymentMethods {
  public availablePaymentMethods: AvailablePaymentMethod[]

  constructor() {
    this.availablePaymentMethods = []
  }

  /**
   * Parse data coming from api
   * @param apiData
   * @return {AvailablePaymentMethods}
   */
  public parseApiData(apiData: AvailablePaymentMethod[]): AvailablePaymentMethods {
    this.availablePaymentMethods = []
    if (!apiData || !apiData.length) {
      return this
    }
    for (const tmpPaymentMethod of apiData) {
      const paymentMethod = new AvailablePaymentMethod(tmpPaymentMethod)
      this.availablePaymentMethods.push(paymentMethod)
    }
    return this
  }

  public getAvailablePaymentMethodBySlug(slug: string): AvailablePaymentMethod | undefined {
    return this.availablePaymentMethods.find(availablePaymentMethod => {
      const paymentMethods = availablePaymentMethod.paymentMethods.paymentMethods
      return paymentMethods.find(paymentMethod => {
        return paymentMethod.slug === slug
      })
    })
  }
}
