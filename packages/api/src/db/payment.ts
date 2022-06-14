export enum PaymentState {
  Created = 'created',
  Submitted = 'submitted',
  RequiresUserAction = 'requiresUserAction',
  Processing = 'processing',
  Paid = 'paid',
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
  intentID?: string | null
  intentSecret?: string | null
  intentData?: string | null
  paymentData?: string | null
}

export interface PaymentInput {
  paymentMethodID: string
  state: PaymentState
  invoiceID: string
  intentID?: string | null
  intentSecret?: string | null
  intentData?: string | null
  paymentData?: string | null
}

export interface UpdatePaymentArgs {
  id: string
  input: PaymentInput
}

export enum PaymentSort {
  CreatedAt = 'modifiedAt',
  ModifiedAt = 'modifiedAt'
}

export interface PaymentFilter {
  intentID?: string
}

export type OptionalPayment = Payment | null

export interface DBPaymentAdapter {
  updatePayment(args: UpdatePaymentArgs): Promise<OptionalPayment>
}
