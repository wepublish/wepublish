import moment, {Moment} from 'moment'
import {gql} from 'graphql-tag'
import InvoiceItems from './InvoiceItems'
import InvoiceItem from '~/sdk/wep/models/invoice/InvoiceItem'

interface InvoiceConstructorProps {
  id: string
  subscriptionID: string
  createdAt?: Moment
  canceledAt?: Moment
  mail: string
  description: string
  paidAt?: Moment
  items?: InvoiceItems
  total: number
}

export default class Invoice {
  public id: string
  public subscriptionID: string
  public createdAt?: Moment
  public canceledAt?: Moment
  public mail: string
  public description: string
  public paidAt?: Moment
  public items?: InvoiceItems
  public total: number

  constructor({
    id,
    subscriptionID,
    createdAt,
    mail,
    description,
    paidAt,
    canceledAt,
    items,
    total
  }: InvoiceConstructorProps) {
    this.id = id
    this.subscriptionID = subscriptionID
    this.createdAt = createdAt ? moment(createdAt) : undefined
    this.mail = mail
    this.description = description
    this.paidAt = paidAt ? moment(paidAt) : undefined
    this.canceledAt = canceledAt ? moment(canceledAt) : undefined
    this.items = items
      ? new InvoiceItems().parseApiData(items as unknown as InvoiceItem[])
      : undefined
    this.total = total / 100
  }

  isPaid() {
    return !!this.paidAt
  }

  isCancelled() {
    return !!this.canceledAt
  }

  public static invoiceFragment = gql`
    fragment invoice on Invoice {
      id
      subscriptionID
      createdAt
      canceledAt
      modifiedAt
      mail
      description
      paidAt
      items {
        ...invoiceItem
      }
    }
    ${InvoiceItem.invoiceItemFragment}
  `
}
