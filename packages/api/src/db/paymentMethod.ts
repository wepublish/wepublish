export interface PaymentMethod {
  id: string
  createdAt: Date
  modifiedAt: Date
  name: string
  slug: string
  description: string
  paymentProviderID: string
  active: boolean
}

export type OptionalPaymentMethod = PaymentMethod | null

export interface PaymentMethodInput {
  name: string
  slug: string
  description: string
  paymentProviderID: string
  active: boolean
}

export interface UpdatePaymentMethodArgs {
  id: string
  input: PaymentMethodInput
}

export interface DBPaymentMethodAdapter {
  updatePaymentMethod(args: UpdatePaymentMethodArgs): Promise<OptionalPaymentMethod>
}
