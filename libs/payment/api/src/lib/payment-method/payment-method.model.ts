import {
  ArgsType,
  Field,
  Int,
  ObjectType,
  PartialType,
  PickType,
} from '@nestjs/graphql';
import { HasImageLc } from '@wepublish/image/api';
import { GraphQLSlug } from '@wepublish/utils/api';

@ObjectType()
export class PaymentProvider {
  @Field()
  id!: string;

  @Field()
  name?: string;
}

@ObjectType({
  implements: () => [HasImageLc],
})
export class PaymentMethod extends HasImageLc {
  @Field()
  id!: string;
  @Field()
  createdAt!: Date;
  @Field()
  modifiedAt!: Date;

  @Field()
  name!: string;

  @Field(() => GraphQLSlug)
  slug!: string;

  @Field()
  description!: string;

  @Field()
  paymentProviderID!: string;

  @Field()
  active!: boolean;

  @Field(() => Int)
  gracePeriod!: number;

  @Field(() => PaymentProvider, { nullable: true })
  paymentProvider?: PaymentProvider;
}

@ArgsType()
export class CreatePaymentMethodInput extends PickType(
  PaymentMethod,
  [
    'name',
    'slug',
    'description',
    'paymentProviderID',
    'active',
    'gracePeriod',
    'imageId',
  ] as const,
  ArgsType
) {}

@ArgsType()
export class UpdatePaymentMethodInput extends PartialType(
  CreatePaymentMethodInput,
  ArgsType
) {
  @Field()
  id!: string;
}
