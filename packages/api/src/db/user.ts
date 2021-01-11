import {ConnectionResult, DateFilter, InputCursor, Limit, SortOrder} from './common'
import {PaymentPeriodicity} from './memberPlan'

export interface UserInput {
  readonly name: string
  readonly email: string
  readonly roleIDs: string[]
}

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

export enum UserSort {
  CreatedAt = 'modifiedAt',
  ModifiedAt = 'modifiedAt'
}

export interface UserSubscriptionFilter {
  readonly startsAt?: DateFilter
  readonly payedUntil?: DateFilter
  readonly deactivatedAt?: DateFilter
  readonly autoRenew?: boolean
}

export interface UserFilter {
  readonly name?: string
  readonly subscription?: UserSubscriptionFilter
}

export interface UserSubscriptionPeriod {
  readonly startsAt: Date
  readonly endsAt: Date
  readonly paymentPeriodicity: PaymentPeriodicity
  readonly amount: number
  readonly invoiceID: string
}

export interface UserSubscription {
  readonly memberPlanID: string
  readonly paymentPeriodicity: PaymentPeriodicity
  readonly monthlyAmount: number
  readonly autoRenew: boolean
  readonly startsAt: Date
  readonly payedUntil: Date | null
  readonly subscriptionPeriods: UserSubscriptionPeriod[]
  readonly paymentMethodID: string
  readonly deactivatedAt: Date | null
}

export interface UserSubscriptionInput {
  readonly memberPlanID: string
  readonly paymentPeriodicity: PaymentPeriodicity
  readonly monthlyAmount: number
  readonly autoRenew: boolean
  readonly startsAt: Date
  readonly payedUntil: Date | null
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
  readonly id: string
  readonly createdAt: Date
}

export interface User {
  readonly id: string
  readonly name: string
  readonly email: string
  readonly roleIDs: string[]
  readonly subscription?: UserSubscription
  readonly paymentProviderCustomers: Record<string, PaymentProviderCustomer>
}

export interface UpdatePaymentProviderCustomerArgs {
  readonly userID: string
  readonly paymentProviderCustomers: Record<string, PaymentProviderCustomer>
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
  createUser(args: CreateUserArgs): Promise<OptionalUser>
  updateUser(args: UpdateUserArgs): Promise<OptionalUser>
  deleteUser(args: DeleteUserArgs): Promise<string | null>

  resetUserPassword(args: ResetUserPasswordArgs): Promise<OptionalUser>

  getUser(email: string): Promise<OptionalUser>
  getUsersByID(ids: string[]): Promise<OptionalUser[]>
  getUserByID(id: string): Promise<OptionalUser>
  getUserForCredentials(args: GetUserForCredentialsArgs): Promise<OptionalUser>

  getUsers(args: GetUsersArgs): Promise<ConnectionResult<User>>

  updateUserSubscription(args: UpdateUserSubscriptionArgs): Promise<OptionalUserSubscription>
  deleteUserSubscription(args: DeleteUserSubscriptionArgs): Promise<string | null>

  updatePaymentProviderCustomers(args: UpdatePaymentProviderCustomerArgs): Promise<OptionalUser>
}
