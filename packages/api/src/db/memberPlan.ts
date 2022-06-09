import {RichTextNode} from '../graphql/richText'
import {ConnectionResult, InputCursor, Limit, SortOrder} from './common'

export enum PaymentPeriodicity {
  Monthly = 'monthly',
  Quarterly = 'quarterly',
  Biannual = 'biannual',
  Yearly = 'yearly'
}

export const AllPaymentPeriodicity: PaymentPeriodicity[] = [
  PaymentPeriodicity.Monthly,
  PaymentPeriodicity.Quarterly,
  PaymentPeriodicity.Biannual,
  PaymentPeriodicity.Yearly
]

export interface AvailablePaymentMethod {
  paymentMethodIDs: string[]
  paymentPeriodicities: PaymentPeriodicity[]
  // minimumDurationMonths: number
  forceAutoRenewal: boolean
}

export interface MemberPlan {
  readonly id: string
  readonly createdAt: Date
  readonly modifiedAt: Date
  readonly name: string
  readonly slug: string
  readonly tags: string[]
  readonly imageID?: string
  readonly description: RichTextNode[]
  readonly active: boolean
  readonly amountPerMonthMin: number
  readonly availablePaymentMethods: AvailablePaymentMethod[]
}

export interface MemberPlanInput {
  readonly name: string
  readonly slug: string
  readonly tags?: string[]
  readonly imageID?: string
  readonly description: RichTextNode[]
  readonly active: boolean
  readonly amountPerMonthMin: number
  readonly availablePaymentMethods: AvailablePaymentMethod[]
}

export type OptionalMemberPlan = MemberPlan | null

export interface CreateMemberPlanArgs {
  input: MemberPlanInput
}

export interface UpdateMemberPlanArgs {
  id: string
  input: MemberPlanInput
}

export interface DeleteMemberPlanArgs {
  id: string
}

export enum MemberPlanSort {
  CreatedAt = 'modifiedAt',
  ModifiedAt = 'modifiedAt'
}

export interface MemberPlanFilter {
  name?: string
  active?: boolean
  tags?: string[]
}

export interface GetMemberPlansArgs {
  cursor: InputCursor
  limit: Limit
  filter?: MemberPlanFilter
  sort: MemberPlanSort
  order: SortOrder
}

export interface DBMemberPlanAdapter {
  createMemberPlan(args: CreateMemberPlanArgs): Promise<MemberPlan>
  updateMemberPlan(args: UpdateMemberPlanArgs): Promise<OptionalMemberPlan>
  deleteMemberPlan(args: DeleteMemberPlanArgs): Promise<string | null>

  getMemberPlansByID(ids: readonly string[]): Promise<OptionalMemberPlan[]>
  getMemberPlansBySlug(slugs: readonly string[]): Promise<OptionalMemberPlan[]>
  getActiveMemberPlansByID(ids: readonly string[]): Promise<OptionalMemberPlan[]>
  getActiveMemberPlansBySlug(slugs: readonly string[]): Promise<OptionalMemberPlan[]>

  getMemberPlans(args: GetMemberPlansArgs): Promise<ConnectionResult<MemberPlan>>
  getActiveMemberPlans(args: GetMemberPlansArgs): Promise<ConnectionResult<MemberPlan>>
}
