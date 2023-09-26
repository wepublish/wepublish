import {QueryResult} from '@apollo/client'
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
import {BuilderRegistrationFormProps} from './authentication.interface'
import {OptionalKeysOf} from 'type-fest'

export type BuilderSubscriptionListItemProps = Subscription & {
  className?: string
  pay?: () => Promise<void>
  cancel?: () => Promise<void>
  extend?: () => Promise<void>
}

export type BuilderSubscriptionListProps = Pick<
  QueryResult<SubscriptionsQuery>,
  'data' | 'loading' | 'error'
> & {
  className?: string
  onPay?: (subscriptionId: string) => Promise<void>
  onCancel?: (subscriptionId: string) => Promise<void>
  onExtend?: (subscriptionId: string) => Promise<void>
}

export type BuilderInvoiceListItemProps = Invoice & {
  className?: string
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
  memberPlans: MemberPlan[] | undefined
  className?: string
  onChange: (memberPlanId: string) => void
  name?: string
  value?: string
  defaultValue?: string
}

export type BuilderPeriodicityPickerProps = {
  periodicities: PaymentPeriodicity[] | undefined
  className?: string
  onChange: (periodicitiy: PaymentPeriodicity) => void
  name?: string
  value?: string
  defaultValue?: string
}

export type BuilderPaymentMethodPickerProps = {
  paymentMethods: PaymentMethod[] | undefined
  className?: string
  onChange: (paymentMethodId: string) => void
  name?: string
  value?: string
  defaultValue?: string
}

export type BuilderSubscribeProps<
  T extends OptionalKeysOf<RegisterMutationVariables> = OptionalKeysOf<RegisterMutationVariables>
> = {
  challenge: Pick<QueryResult<ChallengeQuery>, 'data' | 'loading' | 'error'>
  memberPlans: Pick<QueryResult<MemberPlanListQuery>, 'data' | 'loading' | 'error'>
  className?: string
  onSubscribeWithRegister?: (data: {
    subscribe: Omit<SubscribeMutationVariables, 'failureURL' | 'successURL'>
    register: RegisterMutationVariables
  }) => Promise<void>
  onSubscribe?: (
    data: Omit<SubscribeMutationVariables, 'failureURL' | 'successURL'>
  ) => Promise<void>
} & Pick<BuilderRegistrationFormProps<T>, 'schema' | 'fields'>
