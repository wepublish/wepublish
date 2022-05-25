import {
  ConnectionResult,
  DateFilter,
  InputCursor,
  Limit,
  MetadataProperty,
  SortOrder
} from './common'
import {PaymentPeriodicity} from './memberPlan'
import {GenericUserId} from './tempUser'

export enum SubscriptionDeactivationReason {
  None,
  UserSelfDeactivated,
  InvoiceNotPaid
}

export interface SubscriptionDeactivation {
  date: Date
  reason: SubscriptionDeactivationReason
}

export interface SubscriptionInput {
  readonly userID: string
  readonly memberPlanID: string
  readonly paymentPeriodicity: PaymentPeriodicity
  readonly monthlyAmount: number
  readonly autoRenew: boolean
  readonly startsAt: Date
  readonly paidUntil: Date | null
  readonly paymentMethodID: string
  readonly properties: MetadataProperty[]
  readonly deactivation: SubscriptionDeactivation | null
}

export interface CreateSubscriptionArgs {
  readonly input: SubscriptionInput
}
export interface UpdateSubscriptionArgs {
  readonly id: string
  readonly input: SubscriptionInput
}

export interface DeleteSubscriptionArgs {
  readonly id: string
}

export enum SubscriptionSort {
  CreatedAt = 'createdAt',
  ModifiedAt = 'modifiedAt'
}

export interface SubscriptionFilter {
  readonly startsAt?: DateFilter
  readonly startsAtFrom?: DateFilter
  readonly startsAtTo?: DateFilter
  readonly paidUntil?: DateFilter
  readonly paidUntilFrom?: DateFilter
  readonly paidUntilTo?: DateFilter
  readonly deactivationDate?: DateFilter
  readonly deactivationDateFrom?: DateFilter
  readonly deactivationDateTo?: DateFilter
  readonly deactivationReason?: SubscriptionDeactivationReason
  readonly autoRenew?: boolean
  readonly paymentMethodID?: string
  readonly memberPlanID?: string
  readonly paymentPeriodicity?: PaymentPeriodicity
  readonly userHasAddress?: boolean
}

export interface Subscription {
  readonly id: string
  readonly createdAt: Date
  readonly modifiedAt: Date
  readonly userID: GenericUserId
  readonly memberPlanID: string
  readonly paymentPeriodicity: PaymentPeriodicity
  readonly monthlyAmount: number
  readonly autoRenew: boolean
  readonly startsAt: Date
  readonly paidUntil: Date | null
  readonly periods: SubscriptionPeriod[]
  readonly paymentMethodID: string
  readonly properties: MetadataProperty[]
  readonly deactivation: SubscriptionDeactivation | null
}

export interface CreateSubscriptionPeriodArgs {
  readonly subscriptionID: string
  readonly input: SubscriptionPeriodInput
}

export interface DeleteSubscriptionPeriodArgs {
  readonly subscriptionID: string
  readonly periodID: string
}

export interface SubscriptionPeriod {
  readonly id: string
  readonly createdAt: Date
  readonly startsAt: Date
  readonly endsAt: Date
  readonly paymentPeriodicity: PaymentPeriodicity
  readonly amount: number
  readonly invoiceID: string
}

export interface SubscriptionPeriodInput {
  readonly startsAt: Date
  readonly endsAt: Date
  readonly paymentPeriodicity: PaymentPeriodicity
  readonly amount: number
  readonly invoiceID: string
}

export type OptionalSubscription = Subscription | null

export interface GetSubscriptionArgs {
  readonly cursor: InputCursor
  readonly limit: Limit
  readonly filter?: SubscriptionFilter
  readonly sort: SubscriptionSort
  readonly order: SortOrder
}

export interface DBSubscriptionAdapter {
  createSubscription(args: CreateSubscriptionArgs): Promise<OptionalSubscription>
  updateSubscription(args: UpdateSubscriptionArgs): Promise<OptionalSubscription>
  updateUserID(subscriptionID: string, userID: string): Promise<OptionalSubscription>
  deleteSubscription(args: DeleteSubscriptionArgs): Promise<string | null>

  addSubscriptionPeriod(args: CreateSubscriptionPeriodArgs): Promise<OptionalSubscription>
  deleteSubscriptionPeriod(args: DeleteSubscriptionPeriodArgs): Promise<OptionalSubscription>

  getSubscriptionByID(id: string): Promise<OptionalSubscription>
  getSubscriptionsByID(ids: readonly string[]): Promise<OptionalSubscription[]>
  getSubscriptionsByUserID(userID: string): Promise<OptionalSubscription[]>

  getSubscriptions(args: GetSubscriptionArgs): Promise<ConnectionResult<Subscription>>
}
