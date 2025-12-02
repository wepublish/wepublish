import { QueryResult } from '@apollo/client';
import { RadioProps } from '@mui/material';
import {
  ChallengeQuery,
  FullInvoiceFragment,
  FullMemberPlanFragment,
  FullSubscriptionFragment,
  InvoicesQuery,
  MemberPlanListQuery,
  PaymentMethod,
  PaymentPeriodicity,
  RegisterMutationVariables,
  SubscribeMutationVariables,
  SubscriptionsQuery,
  Currency,
  UpgradeMutationVariables,
  UpgradeSubscriptionInfoQuery,
} from '@wepublish/website/api';
import { BuilderRegistrationFormProps } from './authentication.interface';
import { BuilderUserFormFields } from './user.interface';
import { FieldError } from 'react-hook-form';

export type BuilderSubscriptionListItemProps = FullSubscriptionFragment & {
  className?: string;
  canExtend: boolean;
  cancel?: () => Promise<void>;
  extend?: () => Promise<void>;
};

export type BuilderSubscriptionListProps = Pick<
  QueryResult<SubscriptionsQuery>,
  'data' | 'loading' | 'error'
> & {
  className?: string;
  invoices: Pick<QueryResult<InvoicesQuery>, 'data' | 'loading' | 'error'>;
  subscribeUrl: string;
  onCancel?: (subscriptionId: string) => Promise<void>;
  onExtend?: (subscriptionId: string) => Promise<void>;
};

export type BuilderInvoiceListItemProps = FullInvoiceFragment & {
  className?: string;
  isSepa?: boolean;
  isBexio?: boolean;
  isPayrexxSubscription?: boolean;
  canPay: boolean;
  pay?: () => Promise<void>;
};

export type BuilderInvoiceListProps = Pick<
  QueryResult<InvoicesQuery>,
  'data' | 'loading' | 'error'
> & {
  className?: string;
  onPay?: (invoiceId: string, paymentMethodId: string) => Promise<void>;
};

export type BuilderMemberPlanPickerProps = {
  memberPlans: FullMemberPlanFragment[];
  className?: string;
  onChange: (memberPlanId: string) => void;
  name?: string;
  value?: string;
};

export type BuilderMemberPlanItemProps = Pick<
  FullMemberPlanFragment,
  | 'amountPerMonthMin'
  | 'amountPerMonthMax'
  | 'currency'
  | 'extendable'
  | 'shortDescription'
  | 'tags'
> &
  Omit<RadioProps, 'ref'> & { className?: string } & { slug: string };

export type BuilderPeriodicityPickerProps = {
  periodicities: PaymentPeriodicity[] | undefined;
  className?: string;
  onChange: (periodicitiy: PaymentPeriodicity) => void;
  name?: string;
  value?: string;
};

export type BuilderPaymentMethodPickerProps = {
  paymentMethods: PaymentMethod[] | undefined;
  className?: string;
  onChange: (paymentMethodId: string) => void;
  name?: string;
  value?: string;
};

export type BuilderTransactionFeeProps = {
  text?: string;
  className?: string;
  onChange: (value: boolean) => void;
  name?: string;
  value?: boolean;
};

export type BuilderPaymentAmountProps = {
  amountPerMonthMin: number;
  amountPerMonthMax?: number;
  amountPerMonthTarget: number | undefined;
  currency: Currency;
  donate: boolean;
  onChange: (amount: number) => void;
  name?: string;
  value: number;
  error: FieldError | undefined;
  className?: string;
  slug?: string;
};

export type BuilderSubscribeProps<
  T extends Exclude<BuilderUserFormFields, 'flair'> = Exclude<
    BuilderUserFormFields,
    'flair'
  >,
> = {
  challenge: Pick<QueryResult<ChallengeQuery>, 'data' | 'loading' | 'error'>;
  userSubscriptions: Pick<
    QueryResult<SubscriptionsQuery>,
    'data' | 'loading' | 'error'
  >;
  userInvoices: Pick<QueryResult<InvoicesQuery>, 'data' | 'loading' | 'error'>;
  memberPlans: Pick<
    QueryResult<MemberPlanListQuery>,
    'data' | 'loading' | 'error'
  >;
  className?: string;
  onSubscribeWithRegister?: (data: {
    subscribe: Omit<SubscribeMutationVariables, 'failureURL' | 'successURL'>;
    register: RegisterMutationVariables;
  }) => Promise<void>;
  onSubscribe?: (
    data: Omit<SubscribeMutationVariables, 'failureURL' | 'successURL'>
  ) => Promise<void>;
  onResubscribe?: (
    data: Omit<SubscribeMutationVariables, 'failureURL' | 'successURL'>
  ) => Promise<void>;
  defaults?: Partial<{
    memberPlanSlug: string | null;
    email: string;
    name: string;
    firstName: string;
  }>;
  deactivateSubscriptionId?: string;
  termsOfServiceUrl?: string;
  transactionFee?: (monthlyAmount: number) => number;
  transactionFeeText?: string;
  returningUserId?: string;
} & Pick<BuilderRegistrationFormProps<T>, 'schema' | 'fields'>;

export type BuilderUpgradeProps = {
  memberPlans: Pick<
    QueryResult<MemberPlanListQuery>,
    'data' | 'loading' | 'error'
  >;
  upgradeInfo: Pick<
    QueryResult<UpgradeSubscriptionInfoQuery>,
    'data' | 'loading' | 'error'
  >;
  subscriptionToUpgrade: FullSubscriptionFragment;
  className?: string;
  onUpgrade?: (
    data: Omit<UpgradeMutationVariables, 'failureURL' | 'successURL'>
  ) => Promise<void>;
  defaults?: Partial<{
    memberPlanSlug: string | null;
  }>;
  onSelect: (memberPlanId: string | undefined) => void;
  donate?: (memberPlan?: FullMemberPlanFragment) => boolean;
  termsOfServiceUrl?: string;
  transactionFee?: (monthlyAmount: number) => number;
  transactionFeeText?: string;
};
