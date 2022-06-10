import {DateFilter} from './common'

export interface InvoiceItem {
  createdAt: Date
  modifiedAt: Date
  name: string
  description?: string | null
  quantity: number
  amount: number
}

export interface Invoice {
  id: string
  createdAt: Date
  modifiedAt: Date
  mail: string
  dueAt: Date
  subscriptionID: string
  description?: string | null
  paidAt: Date | null
  canceledAt: Date | null
  sentReminderAt?: Date | null
  items: InvoiceItem[]
  manuallySetAsPaidByUserId?: string | null
  userID?: string | null
}

export type OptionalInvoice = Invoice | null

export interface InvoiceInput {
  mail: string
  dueAt: Date
  subscriptionID: string
  description?: string | null
  paidAt: Date | null
  canceledAt: Date | null
  manuallySetAsPaidByUserId?: string | null
  sentReminderAt?: Date | null
  items: InvoiceItem[]
}

export interface CreateInvoiceArgs {
  input: InvoiceInput
}

export interface UpdateInvoiceArgs {
  id: string
  input: InvoiceInput
}

export enum InvoiceSort {
  CreatedAt = 'modifiedAt',
  ModifiedAt = 'modifiedAt',
  PaidAt = 'paidAt'
}

export interface InvoiceFilter {
  mail?: string
  paidAt?: DateFilter
  canceledAt?: DateFilter
  userID?: string
  subscriptionID?: string
}

export interface DBInvoiceAdapter {
  createInvoice(args: CreateInvoiceArgs): Promise<Invoice>
  updateInvoice(args: UpdateInvoiceArgs): Promise<OptionalInvoice>
}
