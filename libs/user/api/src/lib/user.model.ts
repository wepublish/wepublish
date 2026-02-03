import {
  ArgsType,
  Field,
  InputType,
  Int,
  InterfaceType,
  ObjectType,
  OmitType,
  PartialType,
  PickType,
  registerEnumType,
} from '@nestjs/graphql';
import { Image } from '@wepublish/image/api';
import { Property, PropertyInput } from '@wepublish/property/api';
import { PaginatedType, SortOrder } from '@wepublish/utils/api';
import { UserRole } from './user-role.model';
import { ChallengeInput } from '@wepublish/challenge/api';

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
  @Field(() => Date)
  createdAt!: Date;
  @Field(() => Date)
  modifiedAt!: Date;

  @Field(() => Date, { nullable: true })
  birthday?: Date;

  @Field()
  email!: string;
  @Field(() => Date, { nullable: true })
  emailVerifiedAt?: Date;

  @Field(() => Date, { nullable: true })
  lastLogin?: Date;

  @Field(() => UserAddress, { nullable: true })
  address?: UserAddress | null;

  @Field({ nullable: true })
  note?: string;

  @Field(() => [String])
  permissions?: string[];

  @Field(() => [PaymentProviderCustomer], { nullable: true })
  paymentProviderCustomers?: PaymentProviderCustomer[];

  @Field(() => [UserRole])
  roles!: UserRole[];
}

@ObjectType()
export class PaginatedSensitiveDataUsers extends PaginatedType(
  SensitiveDataUser
) {}

@InputType()
export class UserFilter {
  @Field(() => String, { nullable: true })
  name?: string;

  @Field(() => String, { nullable: true })
  text?: string;

  @Field(() => [String], { nullable: true })
  userRole?: string[];
}

export enum UserSort {
  CreatedAt = 'CreatedAt',
  ModifiedAt = 'ModifiedAt',
  Name = 'Name',
  FirstName = 'FirstName',
}

registerEnumType(UserSort, {
  name: 'UserSort',
});

@ArgsType()
export class UserListArgs {
  @Field(() => String, { nullable: true, description: 'Cursor for pagination' })
  cursorId?: string;

  @Field(() => Int, {
    defaultValue: 10,
    description: 'Number of items to fetch',
  })
  take?: number;

  @Field(() => Int, { defaultValue: 0, description: 'Number of items to skip' })
  skip?: number;

  @Field(() => UserFilter, { nullable: true, description: 'Filter for users' })
  filter?: UserFilter;

  @Field(() => UserSort, {
    defaultValue: UserSort.CreatedAt,
    description: 'Field to sort by',
  })
  sort?: UserSort;

  @Field(() => SortOrder, {
    defaultValue: SortOrder.Descending,
    description: 'Sort order',
    nullable: true,
  })
  order?: SortOrder;
}

@InputType()
export class UserAddressInput extends OmitType(
  UserAddress,
  [] as const,
  InputType
) {}

@ArgsType()
export class CreateUserInput extends PickType(
  SensitiveDataUser,
  [
    'firstName',
    'name',
    'birthday',
    'email',
    'emailVerifiedAt',
    'userImageID',
    'roleIDs',
    'flair',
    'active',
    'note',
  ] as const,
  ArgsType
) {
  @Field({ nullable: true })
  password?: string;

  @Field(() => UserAddressInput, { nullable: true })
  address?: UserAddressInput;

  @Field(type => [PropertyInput])
  properties!: PropertyInput[];
}

@ArgsType()
export class UpdateUserInput extends PartialType(
  OmitType(CreateUserInput, ['password'] as const, ArgsType),
  ArgsType
) {
  @Field({ nullable: true })
  id?: string;
}

@ArgsType()
export class RegisterUserInput extends OmitType(
  CreateUserInput,
  [
    'active',
    'note',
    'emailVerifiedAt',
    'userImageID',
    'roleIDs',
    'properties',
  ] as const,
  ArgsType
) {
  @Field(() => ChallengeInput)
  challengeAnswer!: ChallengeInput;
}

@ArgsType()
export class UpdateCurrentUserInput extends PartialType(
  RegisterUserInput,
  ArgsType
) {}
