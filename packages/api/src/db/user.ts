import {
  ConnectionResult,
  DateFilter,
  InputCursor,
  Limit,
  MetadataProperty,
  SortOrder
} from './common'
import {PaymentPeriodicity} from './memberPlan'

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
  Name = 'name'
}

export enum BulkDataTypes {
  Csv = 'csv',
  Json = 'json'
}
export interface UserAndSubscriptionBulkDataArgs {
  readonly type: BulkDataTypes
}

export interface UserSubscriptionFilter {
  readonly startsAt?: DateFilter
  readonly paidUntil?: DateFilter
  readonly deactivatedAt?: DateFilter
  readonly autoRenew?: boolean
}

export interface UserFilter {
  readonly name?: string
  readonly text?: string
  readonly subscription?: UserSubscriptionFilter
}

export interface UserSubscriptionPeriod {
  readonly id: string
  readonly createdAt: Date
  readonly startsAt: Date
  readonly endsAt: Date
  readonly paymentPeriodicity: PaymentPeriodicity
  readonly amount: number
  readonly invoiceID: string
}

export interface UserSubscriptionPeriodInput {
  readonly startsAt: Date
  readonly endsAt: Date
  readonly paymentPeriodicity: PaymentPeriodicity
  readonly amount: number
  readonly invoiceID: string
}

export interface CreateUserSubscriptionPeriodArgs {
  readonly userID: string
  readonly input: UserSubscriptionPeriodInput
}

export interface DeleteUserSubscriptionPeriodArgs {
  readonly userID: string
  readonly periodID: string
}

export interface UserSubscription {
  readonly memberPlanID: string
  readonly paymentPeriodicity: PaymentPeriodicity
  readonly monthlyAmount: number
  readonly autoRenew: boolean
  readonly startsAt: Date
  readonly paidUntil: Date | null
  readonly periods: UserSubscriptionPeriod[]
  readonly paymentMethodID: string
  readonly deactivatedAt: Date | null
}

export interface UserSubscriptionInput {
  readonly memberPlanID: string
  readonly paymentPeriodicity: PaymentPeriodicity
  readonly monthlyAmount: number
  readonly autoRenew: boolean
  readonly startsAt: Date
  readonly paidUntil: Date | null
  readonly paymentMethodID: string
  readonly deactivatedAt: Date | null
}

export interface UpdateUserSubscriptionArgs {
  readonly userID: string
  readonly input: UserSubscriptionInput
}

export interface DeleteUserSubscriptionArgs {
  readonly userID: string
}

export interface PaymentProviderCustomer {
  readonly paymentProviderID: string
  readonly customerID: string
}

export interface UserAddress {
  readonly company?: string
  readonly streetAddress: string
  readonly streetAddress2?: string
  readonly zipCode: string
  readonly city: string
  readonly country: string
}

export interface UserOAuth2Account {
  readonly type: string
  readonly provider: string
  readonly providerAccountId: string
  readonly refreshToken?: string
  readonly accessToken: string
  readonly expiresAt: number
  readonly tokenType: string
  readonly scope: string
  readonly idToken: string
  readonly oauthTokenSecret?: string
  readonly oauthToken?: string
  readonly sessionState?: string
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
  readonly preferredName?: string
  readonly email: string
  readonly emailVerifiedAt: Date | null

  readonly address?: UserAddress

  readonly active: boolean
  readonly lastLogin: Date | null
  readonly oauth2Accounts: UserOAuth2Account[]

  readonly properties: MetadataProperty[]

  readonly roleIDs: string[]

  readonly subscription?: UserSubscription
  readonly paymentProviderCustomers: PaymentProviderCustomer[]
}

export interface UserWithSubscription {
  readonly id: string
  readonly createdAt: Date
  readonly modifiedAt: Date
  readonly name: string
  readonly email: string

  readonly active: boolean

  readonly company?: string
  readonly streetAddress?: string
  readonly streetAddress2?: string
  readonly zipCode?: string
  readonly city?: string
  readonly country?: string

  readonly memberPlanID: string
  readonly paymentPeriodicity: PaymentPeriodicity
  readonly monthlyAmount: number
  readonly autoRenew: boolean
  readonly startsAt: Date
  readonly paidUntil: Date | null
  // readonly periods: UserSubscriptionPeriod[]
  readonly paymentMethodID: string
  readonly deactivatedAt: Date | null

  //  readonly paymentProviderCustomers: PaymentProviderCustomer[]
}

export interface UserInput {
  readonly name: string
  readonly preferredName?: string
  readonly email: string
  readonly emailVerifiedAt: Date | null

  readonly address?: UserAddress

  readonly active: boolean

  readonly properties: MetadataProperty[]
  readonly roleIDs: string[]
}

export interface UpdatePaymentProviderCustomerArgs {
  readonly userID: string
  readonly paymentProviderCustomers: PaymentProviderCustomer[]
}

export type OptionalUser = User | null
export type OptionalUserSubscription = UserSubscription | null

export interface GetUsersArgs {
  readonly cursor: InputCursor
  readonly limit: Limit
  readonly filter?: UserFilter
  readonly sort: UserSort
  readonly order: SortOrder
}

export interface DBUserAdapter {
  getUsersBulkData({filter}: any): Promise<UserWithSubscription[]>
  createUser(args: CreateUserArgs): Promise<OptionalUser>
  updateUser(args: UpdateUserArgs): Promise<OptionalUser>
  deleteUser(args: DeleteUserArgs): Promise<string | null>

  resetUserPassword(args: ResetUserPasswordArgs): Promise<OptionalUser>

  getUser(email: string): Promise<OptionalUser>
  getUsersByID(ids: string[]): Promise<OptionalUser[]>
  getUserByID(id: string): Promise<OptionalUser>
  getUserForCredentials(args: GetUserForCredentialsArgs): Promise<OptionalUser>
  getUserByOAuth2Account(args: GetUserByOAuth2AccountArgs): Promise<OptionalUser>

  getUsers(args: GetUsersArgs): Promise<ConnectionResult<User>>

  addOAuth2Account(args: UserOAuth2AccountArgs): Promise<OptionalUser>
  deleteOAuth2Account(args: DeleteUserOAuth2AccountArgs): Promise<OptionalUser>

  updateUserSubscription(args: UpdateUserSubscriptionArgs): Promise<OptionalUserSubscription>
  deleteUserSubscription(args: DeleteUserSubscriptionArgs): Promise<string | null>
  addUserSubscriptionPeriod(
    args: CreateUserSubscriptionPeriodArgs
  ): Promise<OptionalUserSubscription>
  deleteUserSubscriptionPeriod(
    args: DeleteUserSubscriptionPeriodArgs
  ): Promise<OptionalUserSubscription>

  updatePaymentProviderCustomers(args: UpdatePaymentProviderCustomerArgs): Promise<OptionalUser>
}
