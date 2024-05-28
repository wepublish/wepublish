import {Field, ID, InputType, ObjectType, ArgsType} from '@nestjs/graphql'

@ObjectType()
export class PaymentMethod {
  @Field(() => ID)
  id!: string

  @Field()
  createdAt!: Date

  @Field()
  modifiedAt!: Date

  @Field()
  name!: string

  @Field()
  slug!: string

  @Field()
  description!: string

  @Field()
  paymentProviderID!: string

  @Field()
  active!: boolean
}

@InputType()
export class CreatePaymentMethodInput {
  @Field()
  name!: string

  @Field()
  slug!: string

  @Field()
  description!: string

  @Field()
  paymentProviderID!: string

  @Field()
  active!: boolean
}

@ArgsType()
export class CreatePaymentMethodArgs {
  @Field(() => CreatePaymentMethodInput)
  paymentMethod!: CreatePaymentMethodInput
}

@InputType()
export class UpdatePaymentMethodInput {
  @Field(() => ID)
  id?: string

  @Field({nullable: true})
  name?: string

  @Field({nullable: true})
  slug?: string

  @Field({nullable: true})
  description?: string

  @Field({nullable: true})
  paymentProviderID?: string

  @Field({nullable: true})
  active?: boolean
}

@ArgsType()
export class UpdatePaymentMethodArgs {
  @Field(() => UpdatePaymentMethodInput)
  paymentMethod!: UpdatePaymentMethodInput
}

@ArgsType()
export class PaymentMethodByIdArgs {
  @Field(() => ID)
  id!: string
}
