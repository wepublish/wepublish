import {DateFilter} from './common'

export enum InvoiceSort {
  CreatedAt = 'createdAt',
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
