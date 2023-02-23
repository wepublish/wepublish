import {PaymentPeriodicity, SubscriptionEvent} from '@prisma/client'

export type Store = {
  defaultFlow: StoreTimeline
  customFlow: StoreMemberPlan
}

export type StoreMemberPlan = {
  [key: string]: StorePaymentMethode
}

type StorePaymentMethode = {
  [key: string]: StorePeriodicites
}

type StorePeriodicites = {
  [key in PaymentPeriodicity]?: StoreAutoRenewal
}

type StoreAutoRenewal = {
  [key: string]: StoreTimeline
}

export type StoreTimeline = {
  [key: number]: Action[]
  onUserAction: Action[]
}
export type Action = {
  type: SubscriptionEvent
  externalMailTemplate: string | null
}

export type StoreInterval = {
  event: SubscriptionEvent
  daysAwayFromEnding: number | null
  externalMailTemplate: string | null
}

export type LookupActionInput = {
  memberplanId: string
  paymentmethodeId: string
  periodicity: PaymentPeriodicity
  autorenwal: boolean
  daysAwayFromEnding: number | null
}
