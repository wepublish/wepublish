import {AvailablePaymentMethod, PaymentPeriodicity} from '@prisma/client'
import {RichTextNode} from '../graphql/richText'

export const AllPaymentPeriodicity: PaymentPeriodicity[] = [
  PaymentPeriodicity.monthly,
  PaymentPeriodicity.quarterly,
  PaymentPeriodicity.biannual,
  PaymentPeriodicity.yearly
]

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

export enum MemberPlanSort {
  CreatedAt = 'modifiedAt',
  ModifiedAt = 'modifiedAt'
}

export interface MemberPlanFilter {
  name?: string
  active?: boolean
  tags?: string[]
}
