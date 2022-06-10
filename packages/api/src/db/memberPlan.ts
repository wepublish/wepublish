import {RichTextNode} from '../graphql/richText'

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
  readonly imageID?: string | null
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

export enum MemberPlanSort {
  CreatedAt = 'modifiedAt',
  ModifiedAt = 'modifiedAt'
}

export interface MemberPlanFilter {
  name?: string
  active?: boolean
  tags?: string[]
}

export interface DBMemberPlanAdapter {
  createMemberPlan(args: CreateMemberPlanArgs): Promise<MemberPlan>
  updateMemberPlan(args: UpdateMemberPlanArgs): Promise<OptionalMemberPlan>
}
