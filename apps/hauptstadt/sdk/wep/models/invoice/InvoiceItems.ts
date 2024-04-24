import InvoiceItem from './InvoiceItem'

export default class InvoiceItems {
  public invoiceItems: InvoiceItem[]

  constructor() {
    this.invoiceItems = []
  }

  public parseApiData(apiData: InvoiceItem[]): InvoiceItems {
    this.invoiceItems = []
    if (!apiData || !apiData.length) {
      return this
    }
    for (const tmpInvoiceItem of apiData) {
      const invoiceItem = new InvoiceItem(tmpInvoiceItem)
      this.invoiceItems.push(invoiceItem)
    }
    return this
  }
}
