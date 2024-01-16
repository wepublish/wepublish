import {
  MemberPlan as PrismaMemberPlan,
  PaymentPeriodicity,
  AvailablePaymentMethod
} from '@prisma/client'
import {RichTextNode} from '@wepublish/richtext/api'

export const AllPaymentPeriodicity: PaymentPeriodicity[] = [
  PaymentPeriodicity.monthly,
  PaymentPeriodicity.quarterly,
  PaymentPeriodicity.biannual,
  PaymentPeriodicity.yearly
]

export interface MemberPlan extends Omit<PrismaMemberPlan, 'description'> {
  readonly description: RichTextNode[]
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

export type MemberPlanWithPaymentMethods = PrismaMemberPlan & {
  availablePaymentMethods: AvailablePaymentMethod[]
}
