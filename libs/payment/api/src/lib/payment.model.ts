import {
  InputType,
  ObjectType,
  Field,
  ID,
  ArgsType,
  registerEnumType,
  Directive
} from '@nestjs/graphql'
import {PaymentState} from '@prisma/client'
import {ListingArgsType, PaginatedType} from '@wepublish/utils/api'

registerEnumType(PaymentState, {name: 'PaymentState'})

@ObjectType()
@Directive('@key(fields: "id")')
export class Payment {
  @Field(() => ID)
  id!: string

  @Field(() => Date)
  createdAt!: Date

  @Field(() => Date)
  modifiedAt!: Date

  @Field(() => String, {nullable: true})
  intentID?: string

  @Field(() => String, {nullable: true})
  intentSecret?: string

  @Field(() => String, {nullable: true})
  intentData?: string

  @Field(() => String, {nullable: true})
  paymentData?: string

  @Field(() => PaymentState)
  state!: PaymentState

  @Field(() => ID)
  invoiceID!: string

  @Field(() => ID)
  paymentMethodID!: string
}

@ObjectType()
export class PaymentsResult extends PaginatedType(Payment) {}

@ArgsType()
export class PaymentByIdArgs {
  @Field(() => ID)
  id!: string
}

export enum PaymentSort {
  CreatedAt = 'createdAt',
  ModifiedAt = 'modifiedAt'
}

registerEnumType(PaymentSort, {name: 'PaymentSort'})

@InputType()
export class PaymentFilter {
  @Field(() => String, {nullable: true})
  intentID?: string
}

@ArgsType()
export class GetPaymentsArgs extends ListingArgsType {
  @Field(() => PaymentFilter, {nullable: true})
  filter?: PaymentFilter

  @Field(() => PaymentSort, {nullable: true})
  sort?: PaymentSort
}

@InputType()
export class PaymentFromInvoiceInput {
  @Field(() => ID)
  invoiceID!: string

  @Field(() => ID)
  paymentMethodID!: string

  @Field(() => String)
  successURL!: string

  @Field(() => String)
  failureURL!: string
}

@ArgsType()
export class PaymentFromInvoiceArgs {
  @Field(() => PaymentFromInvoiceInput)
  input!: PaymentFromInvoiceInput
}
