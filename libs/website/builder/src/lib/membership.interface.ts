import {QueryResult} from '@apollo/client'
import {RadioProps} from '@mui/material'
import {
  ChallengeQuery,
  Invoice,
  InvoicesQuery,
  MemberPlan,
  MemberPlanListQuery,
  PaymentMethod,
  PaymentPeriodicity,
  RegisterMutationVariables,
  SubscribeMutationVariables,
  Subscription,
  SubscriptionsQuery
} from '@wepublish/website/api'
import {OptionalKeysOf} from 'type-fest'
import {BuilderRegistrationFormProps} from './authentication.interface'

export type BuilderSubscriptionListItemProps = Subscription & {
  className?: string
  canPay: boolean
  canExtend: boolean
  pay?: () => Promise<void>
  cancel?: () => Promise<void>
  extend?: () => Promise<void>
}

export type BuilderSubscriptionListProps = Pick<
  QueryResult<SubscriptionsQuery>,
  'data' | 'loading' | 'error'
> & {
  className?: string
  invoices: Pick<QueryResult<InvoicesQuery>, 'data' | 'loading' | 'error'>
  onPay?: (subscriptionId: string) => Promise<void>
  onCancel?: (subscriptionId: string) => Promise<void>
  onExtend?: (subscriptionId: string) => Promise<void>
}

export type BuilderInvoiceListItemProps = Invoice & {
  className?: string
  canPay: boolean
  pay?: () => Promise<void>
}

export type BuilderInvoiceListProps = Pick<
  QueryResult<InvoicesQuery>,
  'data' | 'loading' | 'error'
> & {
  className?: string
  onPay?: (invoiceId: string, paymentMethodId: string) => Promise<void>
}

export type BuilderMemberPlanPickerProps = {
  memberPlans: MemberPlan[]
  className?: string
  onChange: (memberPlanId: string) => void
  name?: string
  value?: string
}

export type BuilderMemberPlanItemProps = Pick<MemberPlan, 'amountPerMonthMin' | 'currency'> &
  RadioProps & {className?: string}

export type BuilderPeriodicityPickerProps = {
  periodicities: PaymentPeriodicity[] | undefined
  className?: string
  onChange: (periodicitiy: PaymentPeriodicity) => void
  name?: string
  value?: string
}

export type BuilderPaymentMethodPickerProps = {
  paymentMethods: PaymentMethod[] | undefined
  className?: string
  onChange: (paymentMethodId: string) => void
  name?: string
  value?: string
}

export type BuilderSubscribeProps<
  T extends OptionalKeysOf<RegisterMutationVariables> = OptionalKeysOf<RegisterMutationVariables>
> = {
  challenge: Pick<QueryResult<ChallengeQuery>, 'data' | 'loading' | 'error'>
  userSubscriptions: Pick<QueryResult<SubscriptionsQuery>, 'data' | 'loading' | 'error'>
  userInvoices: Pick<QueryResult<InvoicesQuery>, 'data' | 'loading' | 'error'>
  memberPlans: Pick<QueryResult<MemberPlanListQuery>, 'data' | 'loading' | 'error'>
  className?: string
  onSubscribeWithRegister?: (data: {
    subscribe: Omit<SubscribeMutationVariables, 'failureURL' | 'successURL'>
    register: RegisterMutationVariables
  }) => Promise<void>
  onSubscribe?: (
    data: Omit<SubscribeMutationVariables, 'failureURL' | 'successURL'>
  ) => Promise<void>
  defaults?: Partial<{
    memberPlanSlug: string | null
    email: string
    name: string
    firstName: string
  }>
  deactivateSubscriptionId?: string
  extraMoneyOffset?: number
} & Pick<BuilderRegistrationFormProps<T>, 'schema' | 'fields'>
