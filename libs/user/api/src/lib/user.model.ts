import {
  Field,
  InputType,
  InterfaceType,
  ObjectType,
  OmitType,
} from '@nestjs/graphql';
import { Image } from '@wepublish/image/api';
import { Property } from '@wepublish/property/api';

@ObjectType()
export class UserAddress {
  @Field(() => String, { nullable: true })
  company?: string | null;

  @Field(() => String, { nullable: true })
  streetAddress?: string | null;

  @Field(() => String, { nullable: true })
  streetAddressNumber?: string | null;

  @Field(() => String, { nullable: true })
  streetAddress2?: string | null;

  @Field(() => String, { nullable: true })
  streetAddress2Number?: string | null;

  @Field(() => String, { nullable: true })
  zipCode?: string | null;

  @Field(() => String, { nullable: true })
  city?: string | null;

  @Field(() => String, { nullable: true })
  country?: string | null;
}

@ObjectType()
export class PaymentProviderCustomer {
  @Field()
  paymentProviderID!: string;

  @Field()
  customerID!: string;
}

@InterfaceType()
export abstract class BaseUser {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field(() => String, { nullable: true })
  firstName!: string | null;

  @Field(() => String, { nullable: true })
  flair!: string | null;

  @Field(() => String, { nullable: true })
  userImageID?: string | null;

  @Field(() => Image, { nullable: true })
  image?: Image | null;

  @Field(() => [String])
  roleIDs!: string[];

  @Field(() => [Property])
  properties?: Property[];

  @Field()
  active!: boolean;
}

@ObjectType({
  implements: [BaseUser],
})
export class User extends BaseUser {}

@ObjectType({
  implements: [BaseUser],
})
export class SensitiveDataUser extends BaseUser {
  @Field(() => Date, { nullable: true })
  birthday!: Date | null;

  @Field()
  email!: string;

  @Field(() => UserAddress, { nullable: true })
  address?: UserAddress | null;

  @Field(() => [String])
  permissions?: string[];

  @Field(() => [PaymentProviderCustomer], { nullable: true })
  paymentProviderCustomers?: PaymentProviderCustomer[];
}

@InputType()
export class PaymentProviderCustomerInput {
  @Field()
  paymentProviderID!: string;

  @Field()
  customerID!: string;
}

@InputType()
export class UserAddressInput extends OmitType(
  UserAddress,
  [] as const,
  InputType
) {}

@InputType()
export class UserInput {
  @Field()
  name!: string;

  @Field({ nullable: true })
  firstName?: string;

  @Field()
  email!: string;

  @Field(() => UserAddressInput, { nullable: true })
  address?: UserAddressInput;

  @Field({ nullable: true })
  flair?: string;

  @Field(() => Date, { nullable: true })
  birthday?: Date;
}
