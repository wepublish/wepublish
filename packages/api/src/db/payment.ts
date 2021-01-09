import {ConnectionResult, InputCursor, Limit, SortOrder} from './common'

export enum PaymentState {
  Created = 'created',
  Submitted = 'submitted',
  RequiresUserAction = 'requiresUserAction',
  Processing = 'processing',
  Payed = 'payed',
  Canceled = 'canceled',
  Declined = 'declined'
}

export interface Payment {
  id: string
  createdAt: Date
  modifiedAt: Date
  paymentMethodID: string
  state: PaymentState
  invoiceID: string
  intentID?: string
  intentSecret?: string
  intentData?: string
  paymentData?: string
}

export interface PaymentInput {
  paymentMethodID: string
  state: PaymentState
  invoiceID: string
  intentID?: string
  intentSecret?: string
  intentData?: string
  paymentData?: string
}

export interface CreatePaymentArgs {
  input: PaymentInput
}

export interface UpdatePaymentArgs {
  id: string
  input: PaymentInput
}

export interface DeletePaymentArgs {
  id: string
}

export enum PaymentSort {
  CreatedAt = 'modifiedAt',
  ModifiedAt = 'modifiedAt'
}

export interface PaymentFilter {
  intentID?: string
}

export interface GetPaymentsArgs {
  cursor: InputCursor
  limit: Limit
  filter?: PaymentFilter
  sort: PaymentSort
  order: SortOrder
}

export type OptionalPayment = Payment | null

export interface DBPaymentAdapter {
  createPayment(args: CreatePaymentArgs): Promise<Payment>
  updatePayment(args: UpdatePaymentArgs): Promise<OptionalPayment>
  deletePayment(args: DeletePaymentArgs): Promise<string | null>

  getPaymentsByID(ids: readonly string[]): Promise<OptionalPayment[]>
  getPaymentsByInvoiceID(invoiceID: string): Promise<OptionalPayment[]>
  getPayments(args: GetPaymentsArgs): Promise<ConnectionResult<Payment>>
}
