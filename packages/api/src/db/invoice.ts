import {ConnectionResult, InputCursor, Limit, RichTextNode, SortOrder} from '..'

export interface InvoiceItems {
  createdAt: Date
  modifiedAt: Date
  name: string
  description?: RichTextNode[]
  amountInCents: number
}

export interface InvoiceHistory {
  createdAt: Date
  successful: boolean
  paymentMethodID: string
  paymentTransaction: string
}

export interface Invoice {
  id: string
  createdAt: Date
  modifiedAt: Date
  mail: string
  userID?: string
  description?: RichTextNode[]
  payedAt: Date | null
  history: InvoiceHistory[]
  items: InvoiceItems[]
}

export type OptionalInvoice = Invoice | null

export interface InvoiceInput {
  mail: string
  userID?: string
  description?: RichTextNode[]
  payedAt: Date | null
  history: InvoiceHistory[]
  items: InvoiceItems[]
}

export interface CreateInvoiceArgs {
  input: InvoiceInput
}

export interface UpdateInvoiceArgs {
  id: string
  input: InvoiceInput
}

export interface DeleteInvoiceArgs {
  id: string
}

export enum InvoiceSort {
  CreatedAt = 'modifiedAt',
  ModifiedAt = 'modifiedAt',
  PayedAt = 'payedAt'
}

export interface InvoiceFilter {
  mail?: string
}

export interface GetInvoicesArgs {
  cursor: InputCursor
  limit: Limit
  filter?: InvoiceFilter
  sort: InvoiceSort
  order: SortOrder
}

export interface DBInvoiceAdapter {
  createInvoice(args: CreateInvoiceArgs): Promise<Invoice>
  updateInvoice(args: UpdateInvoiceArgs): Promise<OptionalInvoice>
  deleteInvoice(args: DeleteInvoiceArgs): Promise<string | null>

  getInvoicesByID(ids: readonly string[]): Promise<OptionalInvoice[]>
  getInvoices(args: GetInvoicesArgs): Promise<ConnectionResult<Invoice>>
}
