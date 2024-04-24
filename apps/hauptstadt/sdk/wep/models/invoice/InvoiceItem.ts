import {gql} from 'graphql-tag'

export default class InvoiceItem {
  public name: string
  public description: string
  public quantity: number
  public amount: number
  public total: number

  constructor({
    name,
    description,
    quantity,
    amount,
    total
  }: {
    name: string
    description: string
    quantity: number
    amount: number
    total: number
  }) {
    this.name = name
    this.description = description
    this.quantity = quantity
    this.amount = amount
    this.total = total / 100
  }

  public static invoiceItemFragment = gql`
    fragment invoiceItem on InvoiceItem {
      createdAt
      modifiedAt
      name
      description
      quantity
      amount
      total
    }
  `
}
