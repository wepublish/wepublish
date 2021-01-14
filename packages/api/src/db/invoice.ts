import {ConnectionResult, InputCursor, Limit, SortOrder} from '..'

export interface InvoiceItem {
  createdAt: Date
  modifiedAt: Date
  name: string
  description?: string
  quantity: number
  amount: number
}

export interface Invoice {
  id: string
  createdAt: Date
  modifiedAt: Date
  mail: string
  userID?: string
  description?: string
  paidAt: Date | null
  canceledAt: Date | null
  items: InvoiceItem[]
}

export type OptionalInvoice = Invoice | null

export interface InvoiceInput {
  mail: string
  userID?: string
  description?: string
  paidAt: Date | null
  canceledAt: Date | null
  items: InvoiceItem[]
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
  PaidAt = 'paidAt'
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
