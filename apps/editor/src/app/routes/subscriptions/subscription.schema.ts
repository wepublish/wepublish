import {
  type CreateSubscriptionMutationVariables,
  type FullMemberPlanFragment,
  type FullPaymentMethodFragment,
  type PropertyInput,
  type SubscriptionQuery,
  type UpdateSubscriptionMutationVariables,
  PaymentPeriodicity,
} from '@wepublish/editor/api';
import {
  type FormDefaultValues,
  type FormOutput,
  type FormValues,
  crossField,
  formFields,
} from '@wepublish/form/editor';
import {
  type UserSearchValue,
  getMonthlyEquivalentRange,
  PAYMENT_PERIODICITY_MONTHS,
} from '@wepublish/ui/editor';
import { z } from 'zod/v4';

export type LoadedSubscription = SubscriptionQuery['subscription'];

export const periodMinAmountOf = (
  memberPlan: FullMemberPlanFragment,
  paymentPeriodicity: PaymentPeriodicity
): number => {
  const override = memberPlan.periodicityPricing?.find(
    price => price.periodicity === paymentPeriodicity && price.amountMin != null
  );

  return (
    override?.amountMin ??
    Math.round(
      getMonthlyEquivalentRange(memberPlan.periodicityPricing)
        .amountPerMonthMin * PAYMENT_PERIODICITY_MONTHS[paymentPeriodicity]
    )
  );
};

export const planMonthlyAmountOf = (
  memberPlan: FullMemberPlanFragment,
  paymentPeriodicity: PaymentPeriodicity
): number => {
  const periodMin = memberPlan.periodicityPricing?.find(
    price => price.periodicity === paymentPeriodicity
  )?.amountMin;

  return periodMin != null ?
      periodMin / PAYMENT_PERIODICITY_MONTHS[paymentPeriodicity]
    : getMonthlyEquivalentRange(memberPlan.periodicityPricing)
        .amountPerMonthMin;
};

const subscriptionFields = z.object({
  user: formFields
    .user<UserSearchValue>()
    .meta({ label: 'userSubscriptionEdit.selectUser' }),
  memberPlan: formFields
    .entity<FullMemberPlanFragment>()
    .meta({ label: 'userSubscriptionEdit.selectMemberPlan' }),
  paymentPeriodicity: z
    .enum(PaymentPeriodicity)
    .default(PaymentPeriodicity.Yearly)
    .meta({
      label: 'memberPlanList.paymentPeriodicities',
      optionLabelPrefix: 'memberPlanList.paymentPeriodicity.',
    }),
  monthlyAmount: z
    .number()
    .default(500)
    .meta({ label: 'userSubscriptionEdit.periodAmount' }),
  paymentMethod: formFields
    .entity<FullPaymentMethodFragment>()
    .meta({ label: 'userSubscriptionEdit.paymentMethod' }),
  startsAt: z
    .date()
    .default(() => new Date())
    .meta({ label: 'userSubscriptionEdit.startsAt' }),
  paidUntil: z.date().nullish().meta({
    label: 'userSubscriptionEdit.paidUntil',
    description: 'userSubscriptionEdit.paidUntilInfo',
  }),
  extendable: z.boolean().meta({
    label: 'memberplanForm.extendableToggle',
    helperText: 'memberplanForm.extendableHelpText',
  }),
  autoRenew: z.boolean().meta({
    label: 'userSubscriptionEdit.autoRenew',
    helperText: 'userSubscriptionEdit.autoRenewDescription',
  }),
});

export const subscriptionSchema = crossField(
  subscriptionFields,
  ['memberPlan', 'paymentPeriodicity', 'monthlyAmount'],
  ({ memberPlan, paymentPeriodicity, monthlyAmount }) =>
    Math.round(monthlyAmount * PAYMENT_PERIODICITY_MONTHS[paymentPeriodicity]) >=
    periodMinAmountOf(memberPlan, paymentPeriodicity),
  { path: ['monthlyAmount'], error: 'errorMessages.amountTooLowErrorMessage' }
);

export type SubscriptionValues = FormValues<typeof subscriptionSchema>;

type SubscriptionOutput = FormOutput<typeof subscriptionSchema>;

export const withoutMemberPlan = ({ memberPlan }: SubscriptionValues) =>
  !memberPlan;

export const notExtendable = ({ extendable }: SubscriptionValues) =>
  !extendable;

export const fromSubscription = (
  subscription: LoadedSubscription
): FormDefaultValues<typeof subscriptionSchema> => ({
  user: subscription.user,
  memberPlan: subscription.memberPlan,
  paymentPeriodicity: subscription.paymentPeriodicity,
  monthlyAmount: subscription.monthlyAmount,
  paymentMethod: subscription.paymentMethod,
  startsAt: new Date(subscription.startsAt),
  paidUntil:
    subscription.paidUntil ? new Date(subscription.paidUntil) : null,
  extendable: subscription.extendable,
  autoRenew: subscription.autoRenew,
});

export const propertiesOf = (
  subscription: LoadedSubscription
): PropertyInput[] =>
  subscription.properties.map(({ key, value, public: isPublic }) => ({
    key,
    value,
    public: isPublic,
  }));

const inputOf = (values: SubscriptionOutput, properties: PropertyInput[]) => ({
  monthlyAmount: values.monthlyAmount,
  paymentPeriodicity: values.paymentPeriodicity,
  autoRenew: values.autoRenew,
  startsAt: values.startsAt.toISOString(),
  properties,
  extendable: values.extendable,
});

export const toUpdateSubscriptionVariables = (
  id: string,
  values: SubscriptionOutput,
  properties: PropertyInput[]
): UpdateSubscriptionMutationVariables => ({
  id,
  ...inputOf(values, properties),
  userID: values.user.id,
  paymentMethodID: values.paymentMethod.id,
  memberPlanID: values.memberPlan.id,
});

export const toCreateSubscriptionVariables = (
  values: SubscriptionOutput,
  skipMail: boolean
): CreateSubscriptionMutationVariables => ({
  ...inputOf(values, []),
  userID: values.user.id,
  paymentMethodID: values.paymentMethod.id,
  memberPlanID: values.memberPlan.id,
  skipMail,
});
