export interface PaymentMethod {
  id: string
  createdAt: Date
  modifiedAt: Date
  name: string
  slug: string
  description: string
  paymentProviderID: string
  active: boolean
  // usable(): boolean
}

export type OptionalPaymentMethod = PaymentMethod | null

export interface PaymentMethodInput {
  name: string
  slug: string
  description: string
  paymentProviderID: string
  active: boolean
}

export interface CreatePaymentMethodArgs {
  input: PaymentMethodInput
}

export interface UpdatePaymentMethodArgs {
  id: string
  input: PaymentMethodInput
}

export interface DBPaymentMethodAdapter {
  createPaymentMethod(args: CreatePaymentMethodArgs): Promise<PaymentMethod>
  updatePaymentMethod(args: UpdatePaymentMethodArgs): Promise<OptionalPaymentMethod>
  deletePaymentMethod(id: string): Promise<string | null>
}
