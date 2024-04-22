import {gql} from 'graphql-tag'
import {PaymentState} from '~/sdk/wep/interfacesAndTypes/WePublish'
import PaymentMethod from '~/sdk/wep/models/paymentMethod/PaymentMethod'
import InvoiceItem from '~/sdk/wep/models/invoice/InvoiceItem'

export interface PaymentResponseProps {
  id: string
  intentSecret: string
  state: PaymentState
  paymentMethod?: PaymentMethod
}

export default class PaymentResponse {
  public id: string
  public intentSecret: string
  public state: PaymentState
  public paymentMethod?: PaymentMethod

  constructor({id, intentSecret, state, paymentMethod}: PaymentResponseProps) {
    this.id = id
    this.intentSecret = intentSecret
    this.state = state
    this.paymentMethod = paymentMethod ? new PaymentMethod(paymentMethod) : undefined
  }

  getRedirectUrl() {
    return this.intentSecret
  }

  public static paymentResponse = gql`
    fragment paymentResponse on Payment {
      id
      intentSecret
      state
      paymentMethod {
        ...paymentMethod
      }
    }
    ${PaymentMethod.paymentMethodFragment}
  `
}
