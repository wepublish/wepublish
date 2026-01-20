import { zodResolver } from '@hookform/resolvers/zod';
import {
  Currency,
  PaymentMethod,
  PaymentPeriodicity,
  UpgradeMutationVariables,
} from '@wepublish/website/api';
import {
  BuilderUpgradeProps,
  Link,
  useAsyncAction,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { formatCurrency, roundUpTo5Cents } from '../formatters/format-currency';

import { ApolloError } from '@apollo/client';
import { ApiAlert } from '@wepublish/errors/website';
import { useTranslation } from 'react-i18next';
import {
  SubscribeAmount,
  SubscribeAmountText,
  SubscribeButton,
  SubscribeCancelable,
  SubscribeNarrowSection,
  SubscribePayment,
  subscribeSchema,
  SubscribeSection,
  SubscribeWrapper,
  usePaymentText,
} from '../subscribe/subscribe';
import { getPaymentPeriodicyMonths } from '../formatters/format-payment-period';
import styled from '@emotion/styled';

const upgradeSchema = subscribeSchema.pick({
  memberPlanId: true,
  monthlyAmount: true,
  paymentMethodId: true,
  payTransactionFee: true,
});

export const getUpgradeText = (
  autoRenew: boolean,
  extendable: boolean,
  paymentPeriodicity: PaymentPeriodicity,
  monthlyAmount: number,
  discount: number,
  currency: Currency,
  locale: string
) => {
  if (!monthlyAmount) {
    return 'Kostenlos';
  }

  if (autoRenew && extendable) {
    return `Für ${formatCurrency(
      (monthlyAmount / 100) * getPaymentPeriodicyMonths(paymentPeriodicity) -
        discount / 100,
      currency,
      locale
    )}`;
  }

  if (extendable) {
    return `Für ${formatCurrency(
      (monthlyAmount / 100) * getPaymentPeriodicyMonths(paymentPeriodicity) -
        discount / 100,
      currency,
      locale
    )}`;
  }

  return `Für ${formatCurrency(
    (monthlyAmount / 100) * getPaymentPeriodicyMonths(paymentPeriodicity) -
      discount / 100,
    currency,
    locale
  )}`;
};

export const UpgradeContinuation = styled(SubscribeCancelable)`
  margin-bottom: ${({ theme }) => theme.spacing(1)};
`;

export const Upgrade = ({
  defaults,
  memberPlans,
  subscriptionToUpgrade,
  className,
  upgradeInfo,
  onSelect,
  onUpgrade,
  donate,
  termsOfServiceUrl,
  transactionFee = amount => roundUpTo5Cents((amount * 0.02) / 100) * 100,
  transactionFeeText,
}: BuilderUpgradeProps) => {
  const {
    meta: { locale, siteTitle },
    elements: { H5, Paragraph },
    MemberPlanPicker,
    PaymentMethodPicker,
    PaymentAmount,
    TransactionFee,
  } = useWebsiteBuilder();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error>();
  const callAction = useAsyncAction(setLoading, setError);

  const availableMemberplans = useMemo(
    () =>
      memberPlans.data?.memberPlans.nodes.filter(
        mb =>
          mb.amountPerMonthMin >
          subscriptionToUpgrade.memberPlan.amountPerMonthMin
      ) ?? [],
    [
      memberPlans.data?.memberPlans.nodes,
      subscriptionToUpgrade.memberPlan.amountPerMonthMin,
    ]
  );

  const { control, handleSubmit, watch, setValue, resetField } = useForm<
    z.infer<typeof upgradeSchema>
  >({
    resolver: zodResolver(upgradeSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: {
      memberPlanId:
        defaults?.memberPlanSlug ?
          availableMemberplans.find(
            memberPlan => memberPlan.slug === defaults?.memberPlanSlug
          )?.id
        : availableMemberplans[0]?.id,
    },
  });

  const selectedPaymentMethodId = watch('paymentMethodId');
  const selectedMemberPlanId = watch('memberPlanId');
  const payTransactionFee = watch('payTransactionFee');
  const monthlyAmount =
    watch('monthlyAmount') +
    (payTransactionFee ? transactionFee(watch('monthlyAmount')) : 0);

  const selectedMemberPlan = useMemo(
    () =>
      availableMemberplans.find(
        memberPlan => memberPlan.id === selectedMemberPlanId
      ),
    [availableMemberplans, selectedMemberPlanId]
  );

  const allPaymentMethods = useMemo(
    () =>
      (selectedMemberPlan?.availablePaymentMethods?.flatMap(
        ({ paymentMethods }) => paymentMethods
      ) as PaymentMethod[]) ?? [],
    [selectedMemberPlan?.availablePaymentMethods]
  );

  const paymentText = usePaymentText({
    autoRenew: subscriptionToUpgrade.autoRenew,
    currency: selectedMemberPlan?.currency ?? Currency.Chf,
    extendable: selectedMemberPlan?.extendable ?? true,
    paymentPeriodicity: subscriptionToUpgrade.paymentPeriodicity,
    productType: subscriptionToUpgrade.memberPlan.productType,
    siteTitle,
    monthlyAmount,
    locale,
  });

  const upgradeText = getUpgradeText(
    subscriptionToUpgrade.autoRenew,
    selectedMemberPlan?.extendable ?? true,
    subscriptionToUpgrade.paymentPeriodicity,
    monthlyAmount,
    upgradeInfo.data?.upgradeSubscriptionInfo.discountAmount ?? 0,
    selectedMemberPlan?.currency ?? Currency.Chf,
    locale
  );

  const supportText = usePaymentText({
    type: 'support',
    autoRenew: true,
    extendable: selectedMemberPlan?.extendable ?? true,
    paymentPeriodicity: PaymentPeriodicity.Monthly,
    monthlyAmount: watch('monthlyAmount'),
    currency: selectedMemberPlan?.currency ?? Currency.Chf,
    productType: subscriptionToUpgrade.memberPlan.productType,
    siteTitle,
    locale,
  });

  const onSubmit = handleSubmit(data => {
    const upgradeData: UpgradeMutationVariables = {
      monthlyAmount,
      memberPlanId: data.memberPlanId,
      paymentMethodId: data.paymentMethodId,
      subscriptionId: subscriptionToUpgrade.id,
    };

    return callAction(onUpgrade)(upgradeData);
  });

  useEffect(() => {
    if (selectedMemberPlan) {
      setValue(
        'monthlyAmount',
        selectedMemberPlan.amountPerMonthTarget ||
          selectedMemberPlan.amountPerMonthMin
      );
    }
  }, [selectedMemberPlan, setValue]);

  useEffect(() => {
    if (
      selectedPaymentMethodId &&
      !allPaymentMethods?.find(({ id }) => id === selectedPaymentMethodId)
    ) {
      resetField('paymentMethodId');
    }
  }, [resetField, allPaymentMethods, selectedPaymentMethodId]);

  useEffect(() => {
    onSelect(selectedMemberPlan?.id);
  }, [selectedMemberPlan?.id, onSelect]);

  const shouldHidePaymentAmount =
    selectedMemberPlan?.amountPerMonthMin ===
    selectedMemberPlan?.amountPerMonthMax;

  const amountPerMonthMin = selectedMemberPlan?.amountPerMonthMin || 500;

  return (
    <SubscribeWrapper
      className={className}
      onSubmit={onSubmit}
      noValidate
    >
      <Paragraph gutterBottom={false}>
        Mach jetzt ein Upgrade von deinem{' '}
        {subscriptionToUpgrade.memberPlan.name} auf das{' '}
        {selectedMemberPlan?.name}. Dein Restguthaben von{' '}
        {formatCurrency(
          (upgradeInfo.data?.upgradeSubscriptionInfo.discountAmount ?? 0) / 100,
          selectedMemberPlan?.currency ?? Currency.Chf,
          locale
        )}{' '}
        Franken bei deinem {subscriptionToUpgrade.memberPlan.name} wird Dir
        dabei angerechnet. Weiter unten siehst du Deinen noch zu zahlenden
        Upgrade-Preis für den Wechsel zum {selectedMemberPlan?.name}.
      </Paragraph>

      <SubscribeSection area="memberPlans">
        {availableMemberplans.length > 1 && <H5 component="h2">Abo wählen</H5>}

        <Controller
          name={'memberPlanId'}
          control={control}
          render={({ field }) => (
            <MemberPlanPicker
              {...field}
              onChange={memberPlanId => field.onChange(memberPlanId)}
              memberPlans={availableMemberplans}
            />
          )}
        />

        {memberPlans.error && (
          <ApiAlert
            error={memberPlans.error}
            severity="error"
          />
        )}
      </SubscribeSection>
      <SubscribeSection area="monthlyAmount">
        {!shouldHidePaymentAmount && (
          <Controller
            name={'monthlyAmount'}
            defaultValue={0}
            control={control}
            render={({ field, fieldState: { error } }) => (
              <SubscribeAmount>
                <Paragraph
                  component={SubscribeAmountText}
                  gutterBottom={false}
                >
                  {supportText}
                </Paragraph>

                <PaymentAmount
                  {...field}
                  error={error}
                  slug={selectedMemberPlan?.slug}
                  donate={!!donate?.(selectedMemberPlan)}
                  amountPerMonthMin={amountPerMonthMin}
                  amountPerMonthTarget={
                    selectedMemberPlan?.amountPerMonthTarget ?? undefined
                  }
                  currency={selectedMemberPlan?.currency ?? Currency.Chf}
                />
              </SubscribeAmount>
            )}
          />
        )}
      </SubscribeSection>
      <SubscribeSection area="paymentPeriodicity">
        {allPaymentMethods.length > 1 && (
          <H5 component="h2">Zahlungsmethode wählen</H5>
        )}

        <SubscribePayment>
          <Controller
            name={'paymentMethodId'}
            control={control}
            defaultValue={
              availableMemberplans[0]?.availablePaymentMethods[0]
                ?.paymentMethods[0]?.id
            }
            render={({ field }) => (
              <PaymentMethodPicker
                {...field}
                onChange={paymentMethodId => field.onChange(paymentMethodId)}
                paymentMethods={allPaymentMethods}
              />
            )}
          />
        </SubscribePayment>
      </SubscribeSection>
      {error && (
        <ApiAlert
          error={error as ApolloError}
          severity="error"
        />
      )}
      {!!watch('monthlyAmount') && (
        <SubscribeSection area="transactionFee">
          <Controller
            name={'payTransactionFee'}
            control={control}
            render={({ field: feeField }) => (
              <TransactionFee
                text={transactionFeeText}
                {...feeField}
              />
            )}
          />
        </SubscribeSection>
      )}
      <SubscribeNarrowSection area="submit">
        <SubscribeButton
          size={'large'}
          disabled={loading}
          type="submit"
        >
          {upgradeText} upgraden
        </SubscribeButton>

        <UpgradeContinuation>Danach {paymentText}</UpgradeContinuation>

        {subscriptionToUpgrade.autoRenew && termsOfServiceUrl ?
          <Link
            underline={'hover'}
            href={termsOfServiceUrl}
          >
            <SubscribeCancelable>
              {t('subscribe.cancellable')}
            </SubscribeCancelable>
          </Link>
        : subscriptionToUpgrade.autoRenew && (
            <SubscribeCancelable>
              {t('subscribe.cancellable')}
            </SubscribeCancelable>
          )
        }
      </SubscribeNarrowSection>
    </SubscribeWrapper>
  );
};
