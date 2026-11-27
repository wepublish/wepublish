import { useQuery } from '@apollo/client/react';
import {
  FullMemberPlanFragment,
  MemberPlanDocument,
  PaymentMethodListDocument,
  PaymentPeriodicity,
} from '@wepublish/editor/api';
import {
  bindComponent,
  CurrencyField,
  editorForm,
  MultiSelectField,
  SelectField,
} from '@wepublish/form/editor';
import {
  getPeriodPriceRange,
  getPlanPeriodicities,
} from '@wepublish/ui/editor';
import { useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import {
  type GiftCodeOfferFormValues,
  giftCodeOfferSchema,
} from './giftCodeOffer.schema';

const { Field } = editorForm.fieldsFor(giftCodeOfferSchema);

const PaymentMethodsSelect = bindComponent(MultiSelectField);
const RenewalPaymentMethodSelect = bindComponent(SelectField);

const formatAmount = (amount: number, currency: string) =>
  `${(amount / 100).toFixed(2)} ${currency}`;

const withoutAutoRenew = ({ autoRenew }: GiftCodeOfferFormValues) => !autoRenew;

const withoutPeriodicity = ({ periodicity }: GiftCodeOfferFormValues) =>
  !periodicity;

const pricedPeriodicitiesOf = (plan: FullMemberPlanFragment | undefined) =>
  plan ?
    getPlanPeriodicities(plan).flatMap(periodicity => {
      const { amountMin, amountTarget } = getPeriodPriceRange(
        plan,
        periodicity
      );
      const amount = amountTarget ?? amountMin;

      return amount > 0 ? [{ periodicity, amount }] : [];
    })
  : [];

const renewalPaymentMethodsOf = (
  plan: FullMemberPlanFragment | undefined,
  periodicity: PaymentPeriodicity | null | undefined
) => {
  const methods = new Map<string, string>();

  for (const row of plan?.availablePaymentMethods ?? []) {
    if (periodicity && row.paymentPeriodicities.includes(periodicity)) {
      for (const method of row.paymentMethods) {
        if (method.active) {
          methods.set(method.id, method.name);
        }
      }
    }
  }

  return methods;
};

export function GiftCodeOfferSaleFields() {
  const { t } = useTranslation();
  const memberPlanId = useWatch<GiftCodeOfferFormValues, 'memberPlanId'>({
    name: 'memberPlanId',
  });
  const periodicity = useWatch<GiftCodeOfferFormValues, 'periodicity'>({
    name: 'periodicity',
  });

  const { data: planData } = useQuery(MemberPlanDocument, {
    variables: { id: memberPlanId ?? '' },
    skip: !memberPlanId,
  });
  const { data: paymentMethodData } = useQuery(PaymentMethodListDocument);

  const plan = memberPlanId ? planData?.memberPlan : undefined;
  const pricedPeriodicities = pricedPeriodicitiesOf(plan);
  const periodicities = pricedPeriodicities.map(option => option.periodicity);
  const periodicityOptions =
    periodicity && !periodicities.includes(periodicity) ?
      [...periodicities, periodicity]
    : periodicities;
  const planPriceOf = (chosen: PaymentPeriodicity | null | undefined) =>
    pricedPeriodicities.find(option => option.periodicity === chosen)?.amount;
  const planPrice = planPriceOf(periodicity);
  const currency = plan?.currency ?? '';
  const canRenew = !plan || plan.extendable;

  const paymentMethods = paymentMethodData?.paymentMethods ?? [];
  const paymentMethodNames = new Map(
    paymentMethods.map(method => [method.id, method.name])
  );

  const paymentMethodOptions = ({
    paymentMethodIds,
  }: GiftCodeOfferFormValues) => [
    ...paymentMethods.map(method => ({ value: method.id, label: method.name })),
    ...(paymentMethodIds ?? [])
      .filter(id => !paymentMethodNames.has(id))
      .map(id => ({ value: id, label: id })),
  ];

  const renewalPaymentMethodOptions = ({
    periodicity: chosen,
    renewalPaymentMethodId,
  }: GiftCodeOfferFormValues) => {
    const methods = renewalPaymentMethodsOf(plan, chosen);
    const options = [...methods].map(([value, label]) => ({ value, label }));

    return renewalPaymentMethodId && !methods.has(renewalPaymentMethodId) ?
        [
          ...options,
          {
            value: renewalPaymentMethodId,
            label:
              paymentMethodNames.get(renewalPaymentMethodId) ??
              renewalPaymentMethodId,
          },
        ]
      : options;
  };

  return (
    <>
      <Field
        name="memberPlanId"
        onValueChange={(_id, { getValues, setValue }) => {
          if (getValues('price') === planPrice) {
            setValue('price', null);
          }

          setValue('periodicity', null);
          setValue('renewalPaymentMethodId', null);
        }}
      />
      <Field
        name="periodicity"
        options={periodicityOptions}
        disabled={!memberPlanId}
        onValueChange={(chosen, { getValues, setValue }) => {
          const price = getValues('price');
          const nextPlanPrice = planPriceOf(chosen);

          if (nextPlanPrice && (price == null || price === planPrice)) {
            setValue('price', nextPlanPrice);
          }

          const renewalPaymentMethodId = getValues('renewalPaymentMethodId');

          if (
            renewalPaymentMethodId &&
            !renewalPaymentMethodsOf(plan, chosen).has(renewalPaymentMethodId)
          ) {
            setValue('renewalPaymentMethodId', null);
          }
        }}
      />
      <Field
        name="price"
        component={bindComponent(CurrencyField, { currency })}
        helperText={({ price }) => {
          if (!planPrice || price == null) {
            return 'giftCodeOffer.form.priceHelp';
          }

          if (price === planPrice) {
            return 'giftCodeOffer.form.priceSameAsPlan';
          }

          return (
            <>
              {t(
                price < planPrice ?
                  'giftCodeOffer.form.priceBelowPlan'
                : 'giftCodeOffer.form.priceAbovePlan',
                { price: formatAmount(planPrice, currency) }
              )}
            </>
          );
        }}
      />
      <Field name="redemptionWindowMonths" />
      <Field
        name="paymentMethodIds"
        component={PaymentMethodsSelect}
        options={paymentMethodOptions}
      />
      <Field name="allowDiscountCodes" />
      <Field
        name="autoRenew"
        disabled={({ autoRenew }) => !canRenew && !autoRenew}
        helperText={
          canRenew ?
            'giftCodeOffer.form.autoRenewHelp'
          : 'giftCodeOffer.form.autoRenewNotExtendable'
        }
        onValueChange={(checked, { setValue }) => {
          if (!checked) {
            setValue('renewalPaymentMethodId', null);
          }
        }}
      />
      <Field
        name="renewalPaymentMethodId"
        component={RenewalPaymentMethodSelect}
        options={renewalPaymentMethodOptions}
        hidden={withoutAutoRenew}
        disabled={withoutPeriodicity}
        required
      />
    </>
  );
}
