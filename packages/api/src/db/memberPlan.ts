import {RichTextNode} from '../graphql/richText'
import {ConnectionResult, InputCursor, Limit, SortOrder} from './common'

export enum PaymentPeriodicity {
  Monthly = 1,
  Quarterly = 3,
  Yearly = 12
}

export interface MemberPlan {
  readonly id: string
  readonly createdAt: Date
  readonly modifiedAt: Date
  readonly label: string
  readonly imageID?: string
  readonly description: RichTextNode[]
  readonly isActive: boolean
  readonly availablePaymentPeriodicity: PaymentPeriodicity[]
  readonly minimumDuration: number // in months
  readonly forceAutoRenewal: boolean
  readonly pricePerMonthMinimum: number
  readonly pricePerMonthMaximum: number
  //readonly availablePaymentMethods: string[]
}

export interface MemberPlanInput {
  readonly label: string
  readonly imageID?: string
  readonly description: RichTextNode[]
  readonly isActive: boolean
  readonly availablePaymentPeriodicity: PaymentPeriodicity[]
  readonly minimumDuration: number // in months
  readonly forceAutoRenewal: boolean
  readonly pricePerMonthMinimum: number
  readonly pricePerMonthMaximum: number
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
  label?: string
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

  getMemberPlans(args: GetMemberPlansArgs): Promise<ConnectionResult<MemberPlan>>
}
