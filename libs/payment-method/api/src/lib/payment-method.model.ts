import {ArgsType, Field, ID, InputType, ObjectType} from '@nestjs/graphql'
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

  imageId!: string | null
  image?: Image
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
