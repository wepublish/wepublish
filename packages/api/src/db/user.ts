import {MetadataProperty} from './common'
import {TempUser} from './tempUser'

export interface CreateUserArgs {
  readonly input: UserInput
  readonly password: string
}

export interface UpdateUserArgs {
  readonly id: string
  readonly input: UserInput
}

export interface DeleteUserArgs {
  readonly id: string
}

export interface ResetUserPasswordArgs {
  readonly id: string
  readonly password: string
}

export interface GetUserForCredentialsArgs {
  readonly email: string
  readonly password: string
}

export interface GetUserByOAuth2AccountArgs {
  readonly provider: string
  readonly providerAccountId: string
}

export enum UserSort {
  CreatedAt = 'createdAt',
  ModifiedAt = 'modifiedAt',
  Name = 'name',
  FirstName = 'firstName'
}

export interface UserFilter {
  readonly name?: string
  readonly text?: string
}

export interface PaymentProviderCustomer {
  readonly paymentProviderID: string
  readonly customerID: string
}

export interface UserAddress {
  readonly company?: string | null
  readonly streetAddress: string
  readonly streetAddress2?: string | null
  readonly zipCode: string
  readonly city: string
  readonly country: string
}

export interface UserOAuth2Account {
  readonly type: string
  readonly provider: string
  readonly providerAccountId: string
  readonly refreshToken?: string | null
  readonly accessToken: string
  readonly expiresAt: number
  readonly tokenType: string
  readonly scope: string
  readonly idToken: string
  readonly oauthTokenSecret?: string | null
  readonly oauthToken?: string | null
  readonly sessionState?: string | null
}

export interface UserOAuth2AccountArgs {
  readonly userID: string
  readonly oauth2Account: UserOAuth2Account
}

export interface DeleteUserOAuth2AccountArgs {
  readonly userID: string
  readonly provider: string
  readonly providerAccountId: string
}

export interface User {
  readonly id: string
  readonly createdAt: Date
  readonly modifiedAt: Date
  readonly name: string
  readonly firstName?: string | null
  readonly preferredName?: string | null
  readonly email: string
  readonly emailVerifiedAt: Date | null

  readonly address?: UserAddress | null

  readonly active: boolean
  readonly lastLogin: Date | null
  readonly oauth2Accounts: UserOAuth2Account[]

  readonly properties: MetadataProperty[]

  readonly roleIDs: string[]

  readonly paymentProviderCustomers: PaymentProviderCustomer[]
}

export interface UserInput {
  readonly name: string
  readonly firstName?: string | null
  readonly preferredName?: string | null
  readonly email: string
  readonly emailVerifiedAt: Date | null

  readonly address?: UserAddress | null

  readonly active: boolean

  readonly properties: MetadataProperty[]
  readonly roleIDs: string[]
  readonly paymentProviderCustomers?: PaymentProviderCustomer[] | null
}

export interface UpdatePaymentProviderCustomerArgs {
  readonly userID: string
  readonly paymentProviderCustomers: PaymentProviderCustomer[]
}

export type OptionalUser = User | null

export interface DBUserAdapter {
  createUser(args: CreateUserArgs): Promise<OptionalUser>
  createUserFromTempUser(tempUser: TempUser): Promise<OptionalUser>
  updateUser(args: UpdateUserArgs): Promise<OptionalUser>
  deleteUser(args: DeleteUserArgs): Promise<string | null>

  resetUserPassword(args: ResetUserPasswordArgs): Promise<OptionalUser>

  addOAuth2Account(args: UserOAuth2AccountArgs): Promise<OptionalUser>
  deleteOAuth2Account(args: DeleteUserOAuth2AccountArgs): Promise<OptionalUser>

  updatePaymentProviderCustomers(args: UpdatePaymentProviderCustomerArgs): Promise<OptionalUser>
}
