import PaymentMethod from '~/sdk/wep/models/paymentMethod/PaymentMethod'

export default class PaymentMethods {
  public paymentMethods: PaymentMethod[]

  constructor() {
    this.paymentMethods = []
  }

  /**
   * Parse raw data from api into models
   * @param apiData
   * @return {PaymentMethods}
   */
  public parseApiData(apiData: PaymentMethod[] = []): PaymentMethods {
    this.paymentMethods = []
    if (!apiData || !apiData.length) {
      return this
    }
    for (const tmpPaymentMethod of apiData) {
      const paymentMethod = new PaymentMethod(tmpPaymentMethod)
      this.paymentMethods.push(paymentMethod)
    }
    return this
  }

  public getFirstPaymentMethod(): PaymentMethod | undefined {
    if (!this.paymentMethods.length) {
      return undefined
    }
    return this.paymentMethods[0]
  }
}
