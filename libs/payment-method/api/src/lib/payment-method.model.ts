import {ArgsType, Field, InputType, Int, ObjectType, PartialType, PickType} from '@nestjs/graphql'
import {HasImageLc, Image} from '@wepublish/image/api'
import {GraphQLSlug} from '@wepublish/utils/api'

@ObjectType({
  implements: () => [HasImageLc]
})
export class PaymentMethod {
  @Field()
  id!: string

  createdAt!: Date

  modifiedAt!: Date

  @Field()
  name!: string

  @Field(() => GraphQLSlug)
  slug!: string

  @Field()
  description!: string

  @Field()
  paymentProviderID!: string

  active!: boolean

  @Field(() => Int, {nullable: true})
  gracePeriod?: number

  imageId?: string
  image?: Image
}

@InputType()
export class CreatePaymentMethodInput extends PickType(
  PaymentMethod,
  ['name', 'slug', 'description', 'paymentProviderID', 'active', 'gracePeriod'] as const,
  InputType
) {}

@ArgsType()
export class CreatePaymentMethodArgs {
  @Field(() => CreatePaymentMethodInput)
  paymentMethod!: CreatePaymentMethodInput
}

@InputType()
export class UpdatePaymentMethodInput extends PartialType(CreatePaymentMethodInput, InputType) {
  @Field()
  id!: string
}

@ArgsType()
export class UpdatePaymentMethodArgs {
  @Field(() => UpdatePaymentMethodInput)
  paymentMethod!: UpdatePaymentMethodInput
}

@ArgsType()
export class PaymentMethodByIdArgs {
  @Field()
  id!: string
}
