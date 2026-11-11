import type { OperationVariables } from '@apollo/client';
import type { useLazyQuery, useQuery } from '@apollo/client/react';
import { RadioProps } from '@mui/material';
import {
  ChallengeQuery,
  CreateSubscriptionInfoQuery,
  CreateSubscriptionInfoQueryVariables,
  Currency,
  FullGoodieFragment,
  FullInvoiceFragment,
  FullMemberPlanFragment,
  FullPaymentMethodFragment,
  FullSubscribeBlockFragment,
  FullSubscriptionFragment,
  InvoicesQuery,
  MemberPlanListQuery,
  PaymentPeriodicity,
  RegisterMutationVariables,
  SubscribeMutationVariables,
  SubscribePeriodicityDisplay,
  SubscriptionsQuery,
  UpgradeMutationVariables,
  UpgradeSubscriptionInfoQuery,
} from '@wepublish/website/api';
import { BuilderRegistrationFormProps } from './authentication.interface';
import { BuilderUserFormFields } from './user.interface';
import { FieldError, FieldErrors } from 'react-hook-form';

export type BuilderMemberPlanRenderSetting =
  FullSubscribeBlockFragment['memberPlanRenderSettings'][number];

export type BuilderMemberPlanLayout = BuilderMemberPlanRenderSetting['layout'];

export type BuilderSubscriptionListItemProps = FullSubscriptionFragment & {
  className?: string;
  cancel?: () => Promise<void>;
  reactivate?: () => Promise<void>;
  revertUpgrade?: () => Promise<void>;
  extend?: () => Promise<void>;
  /** Moves the subscription to another payment method of its member plan. */
  changePaymentMethod?: (paymentMethodId: string) => Promise<void>;
  /**
   * Bills the subscription with another periodicity (one of its
   * `switchablePeriodicities`) from the next renewal on.
   */
  switchPeriodicity?: (paymentPeriodicity: PaymentPeriodicity) => Promise<void>;
  cancelPaymentMethodChange?: (changeId: string) => Promise<void>;
  /**
   * Total in cents of the subscription's open invoice, which is paid with the
   * new payment method when changing it.
   */
  openInvoiceTotal?: number;
};

export type BuilderSubscriptionListProps = Pick<
  useQuery.Result<SubscriptionsQuery, OperationVariables, 'complete' | 'empty'>,
  'data' | 'loading' | 'error'
> & {
  className?: string;
  invoices: Pick<
    useQuery.Result<InvoicesQuery, OperationVariables, 'complete' | 'empty'>,
    'data' | 'loading' | 'error'
  >;
  subscribeUrl: string;
  onCancel?: (subscriptionId: string) => Promise<void>;
  onReactivate?: (subscriptionId: string) => Promise<void>;
  onRevertUpgrade?: (subscriptionId: string) => Promise<void>;
  onExtend?: (subscriptionId: string) => Promise<void>;
  onChangePaymentMethod?: (
    subscriptionId: string,
    paymentMethodId: string
  ) => Promise<void>;
  onCancelPaymentMethodChange?: (changeId: string) => Promise<void>;
  onSwitchPeriodicity?: (
    subscriptionId: string,
    paymentPeriodicity: PaymentPeriodicity
  ) => Promise<void>;
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
  useQuery.Result<InvoicesQuery, OperationVariables, 'complete' | 'empty'>,
  'data' | 'loading' | 'error'
> & {
  className?: string;
  onPay?: (invoiceId: string, paymentMethodId: string) => Promise<void>;
};

export type BuilderGoodiePickerProps = {
  goodies: FullGoodieFragment[];
  className?: string;
  name?: string;
  value?: string | null;
  disabled?: boolean;
  onChange: (goodieId: string | null) => void;
};

export type BuilderMemberPlanPickerProps = {
  memberPlans: FullMemberPlanFragment[];
  className?: string;
  onChange: (memberPlanId: string) => void;
  name?: string;
  value?: string;
  paymentPeriodicity?: PaymentPeriodicity;
  requiredPeriodicity?: PaymentPeriodicity;
  memberPlanRenderSettings?: BuilderMemberPlanRenderSetting[];
  amount?: number;
  onAmountChange?: (monthlyAmount: number) => void;
};

export type BuilderMemberPlanItemProps = Pick<
  FullMemberPlanFragment,
  | 'slug'
  | 'periodicityPricing'
  | 'currency'
  | 'extendable'
  | 'shortDescription'
  | 'tags'
  | 'goodies'
> &
  Partial<
    Pick<
      FullMemberPlanFragment,
      'availablePaymentMethods' | 'defaultPaymentPeriodicity'
    >
  > &
  Omit<RadioProps, 'ref'> & { className?: string } & {
    slug: string;
    paymentPeriodicity?: PaymentPeriodicity;
    showPeriodicity?: boolean;
    // the card stands for one offer of a plan and periodicity, so its price
    // is the one for that whole period
    isOffer?: boolean;
    amountLayout?: BuilderMemberPlanLayout;
    amount?: number;
    onAmountChange?: (monthlyAmount: number) => void;
  };

export type MemberPlanOffer = {
  memberPlanId: string;
  paymentPeriodicity: PaymentPeriodicity;
};

export type BuilderMemberPlanOfferPickerProps = {
  memberPlans: FullMemberPlanFragment[];
  className?: string;
  onChange: (offer: MemberPlanOffer) => void;
  name?: string;
  value?: Partial<MemberPlanOffer>;
  memberPlanRenderSettings?: BuilderMemberPlanRenderSetting[];
  amount?: number;
  onAmountChange?: (monthlyAmount: number) => void;
};

export type BuilderPeriodicityPickerProps = {
  periodicities: PaymentPeriodicity[] | undefined;
  variant?: 'select' | 'toggle';
  memberPlan?: FullMemberPlanFragment | null;
  className?: string;
  onChange: (periodicitiy: PaymentPeriodicity) => void;
  name?: string;
  value?: string;
};

export type BuilderPaymentMethodPickerProps = {
  paymentMethods: FullPaymentMethodFragment[] | undefined;
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

export type BuilderPaymentAmountSliderProps = {
  amountPerMonthMin: number;
  amountPerMonthMax?: number;
  amountPerMonthTarget: number | undefined;
  paymentPeriodicity?: PaymentPeriodicity;
  currency: Currency;
  donate: boolean;
  onChange: (amount: number) => void;
  name?: string;
  value: number;
  error: FieldError | undefined;
  className?: string;
  showInput?: boolean;
};

export type BuilderPaymentAmountPickerProps = {
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
  presetAmounts?: number[];
  showInput?: boolean;
  paymentPeriodicity?: PaymentPeriodicity;
};

/**
 * The sections of the subscribe form, in render order. Each one renders as a
 * `[data-area]` element and can be left out through `hiddenAreas`.
 */
export const SUBSCRIBE_AREAS = [
  'returning',
  'notices',
  'periodicity',
  'memberPlans',
  'monthlyAmount',
  'summary',
  'userForm',
  'paymentPeriodicity',
  'goodie',
  'discountCode',
  'challenge',
  'transactionFee',
  'submit',
] as const;

export type SubscribeArea = (typeof SUBSCRIBE_AREAS)[number];

export type BuilderSubscribeSummaryProps = {
  memberPlan?: FullMemberPlanFragment | null;
  paymentPeriodicity: PaymentPeriodicity;
  /** The chosen amount per month in cents, without transaction fee. */
  monthlyAmount: number;
  /** The chosen amount per payment period in cents, without transaction fee. */
  periodAmount: number;
  currency: Currency;
  selectedPlanUnavailable: boolean;
  /** Validates plan, periodicity and amount; resolves to whether they are valid. */
  validateSelection: () => Promise<boolean>;
  className?: string;
};

export type BuilderSubscribeProps<
  T extends Exclude<BuilderUserFormFields, 'flair'> = Exclude<
    BuilderUserFormFields,
    'flair'
  >,
> = {
  challenge: Pick<
    useQuery.Result<ChallengeQuery, OperationVariables, 'complete' | 'empty'>,
    'data' | 'loading' | 'error'
  >;
  userSubscriptions: Pick<
    useQuery.Result<
      SubscriptionsQuery,
      OperationVariables,
      'complete' | 'empty'
    >,
    'data' | 'loading' | 'error'
  >;
  userInvoices: Pick<
    useQuery.Result<InvoicesQuery, OperationVariables, 'complete' | 'empty'>,
    'data' | 'loading' | 'error'
  >;
  memberPlans: Pick<
    useQuery.Result<
      MemberPlanListQuery,
      OperationVariables,
      'complete' | 'empty'
    >,
    'data' | 'loading' | 'error'
  >;
  memberPlanRenderSettings?: BuilderMemberPlanRenderSetting[];
  showGoodies?: boolean;
  showDiscountCodes?: boolean;
  goodieMinValue?: number | null;
  subscribeInfo: Pick<
    useQuery.Result<
      CreateSubscriptionInfoQuery,
      OperationVariables,
      'complete' | 'empty' | 'streaming'
    >,
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
  fetchSubscribeInfo: useLazyQuery.ExecFunction<
    CreateSubscriptionInfoQuery,
    CreateSubscriptionInfoQueryVariables
  >;
  defaults?: Partial<{
    memberPlanSlug: string | null;
    paymentPeriodicity: PaymentPeriodicity | null;
    email: string;
    name: string;
    firstName: string;
    discountCode: string;
  }>;
  periodicityDisplay?: SubscribePeriodicityDisplay | null;
  deactivateSubscriptionId?: string;
  termsOfServiceUrl?: string;
  transactionFee?: (monthlyAmount: number) => number;
  transactionFeeText?: string;
  returningUserId?: string;
  filterGoodies?: (
    goodies: FullGoodieFragment[],
    context: { monthlyAmount: number }
  ) => FullGoodieFragment[];
  /** Sections that are not rendered at all; their form values are kept. */
  hiddenAreas?: readonly SubscribeArea[];
  /** Called when a submit fails validation, e.g. because of a hidden section. */
  onInvalid?: (errors: FieldErrors) => void;
} & Pick<BuilderRegistrationFormProps<T>, 'schema' | 'fields'>;

export type BuilderUpgradeProps = {
  memberPlans: Pick<
    useQuery.Result<
      MemberPlanListQuery,
      OperationVariables,
      'complete' | 'empty'
    >,
    'data' | 'loading' | 'error'
  >;
  upgradeInfo: Pick<
    useQuery.Result<
      UpgradeSubscriptionInfoQuery,
      OperationVariables,
      'complete' | 'empty' | 'streaming'
    >,
    'data' | 'loading' | 'error'
  >;
  subscriptionToUpgrade: FullSubscriptionFragment;
  memberPlanRenderSettings?: BuilderMemberPlanRenderSetting[];
  showGoodies?: boolean;
  showDiscountCodes?: boolean;
  goodieMinValue?: number | null;
  goodieMinValueAppliesToUpgrade?: boolean;
  hideRepeatGoodieOnUpgrade?: boolean;
  className?: string;
  onUpgrade?: (
    data: Omit<UpgradeMutationVariables, 'failureURL' | 'successURL'>
  ) => Promise<void>;
  defaults?: Partial<{
    memberPlanSlug: string | null;
    discountCode: string;
  }>;
  onSelect: (memberPlanId: string | undefined, discountCode?: string) => void;
  donate?: (memberPlan?: FullMemberPlanFragment) => boolean;
  termsOfServiceUrl?: string;
  transactionFee?: (monthlyAmount: number) => number;
  transactionFeeText?: string;
};
