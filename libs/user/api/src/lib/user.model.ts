import {Field, InputType, ObjectType, OmitType} from '@nestjs/graphql'
import {Image, UploadImageInput} from '@wepublish/image/api'
import {PublicProperty} from '@wepublish/utils/api'

@ObjectType()
export class OAuth2Account {
  @Field()
  type!: string

  @Field()
  provider!: string

  @Field()
  scope!: string
}

@ObjectType()
export class UserAddress {
  @Field(() => String, {nullable: true})
  company!: string | null

  @Field(() => String, {nullable: true})
  streetAddress!: string | null

  @Field(() => String, {nullable: true})
  streetAddress2!: string | null

  @Field(() => String, {nullable: true})
  zipCode!: string | null

  @Field(() => String, {nullable: true})
  city!: string | null

  @Field(() => String, {nullable: true})
  country!: string | null
}

@ObjectType()
export class PaymentProviderCustomer {
  @Field()
  paymentProviderID!: string

  @Field()
  customerID!: string
}

@ObjectType()
export class User {
  @Field()
  id!: string

  @Field()
  name!: string

  @Field(() => String, {nullable: true})
  firstName!: string | null

  @Field(() => Date, {nullable: true})
  birthday!: Date | null

  @Field()
  email!: string

  active!: boolean

  @Field(() => UserAddress, {nullable: true})
  address?: UserAddress | null

  @Field(() => String, {nullable: true})
  flair!: string | null

  @Field(() => [PaymentProviderCustomer])
  paymentProviderCustomers?: PaymentProviderCustomer[]

  @Field(() => [OAuth2Account])
  oauth2Accounts?: OAuth2Account[]

  userImageID!: string | null

  @Field(() => Image, {nullable: true})
  image?: Image | null

  @Field(() => [PublicProperty])
  properties?: PublicProperty[]

  roleIDs!: string[]

  @Field(() => [String])
  permissions?: string[]
}

@InputType()
export class PaymentProviderCustomerInput {
  @Field()
  paymentProviderID!: string

  @Field()
  customerID!: string
}

@InputType()
export class UserAddressInput extends OmitType(UserAddress, [] as const, InputType) {}

@InputType()
export class UserInput {
  @Field()
  name!: string

  @Field({nullable: true})
  firstName?: string

  @Field()
  email!: string

  @Field(() => UserAddressInput, {nullable: true})
  address?: UserAddressInput

  @Field({nullable: true})
  flair?: string

  @Field(() => Date, {nullable: true})
  birthday?: Date

  @Field(() => UploadImageInput, {nullable: true})
  uploadImageInput?: UploadImageInput
}
