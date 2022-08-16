import {Invoice, InvoiceItem} from '@prisma/client'
import {DateFilter} from './common'

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

export type InvoiceWithItems = Invoice & {
  items: InvoiceItem[]
}
