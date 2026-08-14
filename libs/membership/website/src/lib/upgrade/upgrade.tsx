import { zodResolver } from '@hookform/resolvers/zod';
import {
  Currency,
  PaymentMethod,
  PaymentPeriodicity,
  ProductType,
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
import { FormHelperText } from '@mui/material';
import { MdCheck, MdError } from 'react-icons/md';
import { Trans, useTranslation } from 'react-i18next';
import {
  clampMonthlyAmount,
  SubscribeAmount,
  SubscribeAmountText,
  SubscribeButton,
  SubscribeCancelable,
  SubscribeContinuation,
  SubscribeNarrowSection,
  SubscribePayment,
  subscribeSchema,
  SubscribeSection,
  SubscribeWrapper,
} from '../subscribe/subscribe';
import {
  useContinuationText,
  usePaymentText,
  useUpgradeText,
} from '../subscribe/subscribe-texts';
import {
  findMemberPlanRenderSetting,
  getAmountPickerValues,
  isAmountPickerLayout,
  isAmountSliderLayout,
  isFixedAmountLayout,
  showsAmountInput,
} from '../subscribe/member-plan-render-settings';
import styled from '@emotion/styled';
import { getPaymentPeriodicyMonths } from '../formatters/format-payment-period';

const upgradeSchema = subscribeSchema.pick({
  memberPlanId: true,
  monthlyAmount: true,
  paymentMethodId: true,
  payTransactionFee: true,
  goodieId: true,
  voucher: true,
});

export const UpgradeInformation = styled('div')`
  padding: ${({ theme }) => theme.spacing(2)};
  background-color: ${({ theme }) => theme.palette.grey['100']};
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  max-width: 65ch;
  justify-self: center;
`;

export const Upgrade = ({
  defaults,
  memberPlans,
  memberPlanRenderSettings,
  subscriptionToUpgrade,
  className,
  upgradeInfo,
  onSelect,
  onUpgrade,
  donate,
  showGoodies = false,
  showVouchers = false,
  goodieMinValue,
  hideRepeatGoodieOnUpgrade = false,
  termsOfServiceUrl,
  transactionFee = amount => roundUpTo5Cents((amount * 0.02) / 100) * 100,
  transactionFeeText,
}: BuilderUpgradeProps) => {
  const {
    meta: { locale, siteTitle },
    elements: { Alert, H5, Paragraph, TextField },
    GoodiePicker,
    MemberPlanPicker,
    PaymentMethodPicker,
    PaymentAmountSlider,
    PaymentAmountPicker,
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
      monthlyAmount: 0,
      goodieId: null,
      voucher: defaults?.voucher ?? '',
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
  const voucher = watch('voucher');
  const watchedMonthlyAmount = watch<'monthlyAmount'>('monthlyAmount') ?? 0;
  const monthlyAmount =
    watchedMonthlyAmount +
    (payTransactionFee ? transactionFee(watchedMonthlyAmount) : 0);
  const goodieId = watch('goodieId');

  const selectedMemberPlan = useMemo(
    () =>
      availableMemberplans.find(
        memberPlan => memberPlan.id === selectedMemberPlanId
      ),
    [availableMemberplans, selectedMemberPlanId]
  );

  const hideGoodieForExistingGoodie =
    hideRepeatGoodieOnUpgrade && !!subscriptionToUpgrade.goodie;

  const availableGoodies = useMemo(() => {
    if (hideGoodieForExistingGoodie) {
      return [];
    }

    const deltaYearly =
      (monthlyAmount - subscriptionToUpgrade.monthlyAmount) *
      getPaymentPeriodicyMonths(subscriptionToUpgrade.paymentPeriodicity);

    if (goodieMinValue && goodieMinValue > deltaYearly) {
      return [];
    }

    return selectedMemberPlan?.goodies ?? [];
  }, [
    hideGoodieForExistingGoodie,
    monthlyAmount,
    subscriptionToUpgrade.monthlyAmount,
    subscriptionToUpgrade.paymentPeriodicity,
    goodieMinValue,
    selectedMemberPlan?.goodies,
  ]);

  const allPaymentMethods = useMemo(
    () =>
      (selectedMemberPlan?.availablePaymentMethods?.flatMap(
        ({ paymentMethods }) => paymentMethods
      ) as PaymentMethod[]) ?? [],
    [selectedMemberPlan?.availablePaymentMethods]
  );

  const isDonation = selectedMemberPlan?.productType === ProductType.Donation;

  const selectedRenderSetting = findMemberPlanRenderSetting(
    memberPlanRenderSettings,
    selectedMemberPlan?.id
  );
  const selectedLayout = selectedRenderSetting?.layout;

  const continuationText = useContinuationText({
    currency: selectedMemberPlan?.currency ?? Currency.Chf,
    paymentPeriodicity: subscriptionToUpgrade.paymentPeriodicity,
    memberPlan: selectedMemberPlan?.name ?? '',
    monthlyAmount,
    locale,
  });

  const supportText = usePaymentText({
    type: 'support',
    autoRenew: true,
    extendable: selectedMemberPlan?.extendable ?? true,
    memberPlan: selectedMemberPlan?.name ?? '',
    paymentPeriodicity: PaymentPeriodicity.Monthly,
    monthlyAmount: watchedMonthlyAmount,
    currency: selectedMemberPlan?.currency ?? Currency.Chf,
    productType: subscriptionToUpgrade.memberPlan.productType,
    siteTitle,
    locale,
  });

  const upgradeText = useUpgradeText({
    memberPlan: selectedMemberPlan?.name ?? '',
    productType: subscriptionToUpgrade.memberPlan.productType,
    paymentPeriodicity: subscriptionToUpgrade.paymentPeriodicity,
    monthlyAmount,
    discount: upgradeInfo.data?.upgradeUserSubscriptionInfo.discountAmount ?? 0,
    discountPercent:
      upgradeInfo.data?.upgradeUserSubscriptionInfo.discountPercent ?? 0,
    currency: selectedMemberPlan?.currency ?? Currency.Chf,
    locale,
  });

  const onSubmit = handleSubmit(data => {
    if (upgradeInfo.data?.upgradeUserSubscriptionInfo.voucherValid === false) {
      return;
    }

    const upgradeData: UpgradeMutationVariables = {
      monthlyAmount,
      memberPlanId: data.memberPlanId,
      paymentMethodId: data.paymentMethodId,
      subscriptionId: subscriptionToUpgrade.id,
      goodieId: data.goodieId,
      voucher: data.voucher,
    };

    return callAction(onUpgrade)(upgradeData);
  }, console.warn);

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
    if (goodieId && !availableGoodies.some(({ id }) => id === goodieId)) {
      setValue('goodieId', null);
    }
  }, [availableGoodies, goodieId, setValue]);

  useEffect(() => {
    onSelect(selectedMemberPlan?.id, voucher ?? undefined);
  }, [selectedMemberPlan?.id, voucher, onSelect]);

  const shouldHidePaymentAmount =
    selectedLayout ?
      isFixedAmountLayout(selectedLayout)
    : selectedMemberPlan?.amountPerMonthMin ===
      selectedMemberPlan?.amountPerMonthMax;

  const amountPerMonthMin = selectedMemberPlan?.amountPerMonthMin || 500;

  return (
    <SubscribeWrapper
      className={className}
      onSubmit={onSubmit}
      noValidate
    >
      <UpgradeInformation>
        <H5 gutterBottom>{t('subscribe.upgrade.infoTitle')}</H5>

        <Paragraph gutterBottom={false}>
          <Trans
            i18nKey="subscribe.upgrade.info"
            values={{
              oldMemberPlan: subscriptionToUpgrade.memberPlan.name,
              newMemberPlan: selectedMemberPlan?.name,
              discount: formatCurrency(
                (upgradeInfo.data?.upgradeUserSubscriptionInfo.discountAmount ??
                  0) / 100,
                selectedMemberPlan?.currency ?? Currency.Chf,
                locale
              ),
            }}
            components={{
              bold: <strong />,
            }}
          />
        </Paragraph>
      </UpgradeInformation>

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

                {isAmountPickerLayout(selectedLayout) && (
                  <PaymentAmountPicker
                    {...field}
                    onChange={amount =>
                      field.onChange(
                        clampMonthlyAmount(
                          +amount,
                          amountPerMonthMin,
                          selectedMemberPlan?.amountPerMonthMax ?? undefined
                        )
                      )
                    }
                    error={error}
                    donate={!!donate?.(selectedMemberPlan) || isDonation}
                    amountPerMonthMin={amountPerMonthMin}
                    amountPerMonthMax={
                      selectedMemberPlan?.amountPerMonthMax ?? undefined
                    }
                    amountPerMonthTarget={
                      selectedMemberPlan?.amountPerMonthTarget ?? undefined
                    }
                    currency={selectedMemberPlan?.currency ?? Currency.Chf}
                    presetAmounts={getAmountPickerValues(selectedLayout)}
                    showInput={showsAmountInput(selectedLayout)}
                  />
                )}

                {isAmountSliderLayout(selectedLayout) && (
                  <PaymentAmountSlider
                    {...field}
                    error={error}
                    donate={!!donate?.(selectedMemberPlan) || isDonation}
                    amountPerMonthMin={amountPerMonthMin}
                    amountPerMonthMax={
                      selectedMemberPlan?.amountPerMonthMax ?? undefined
                    }
                    amountPerMonthTarget={
                      selectedMemberPlan?.amountPerMonthTarget ?? undefined
                    }
                    currency={selectedMemberPlan?.currency ?? Currency.Chf}
                    showInput={showsAmountInput(selectedLayout)}
                  />
                )}
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

      {showGoodies && !hideGoodieForExistingGoodie && (
        <SubscribeNarrowSection area="goodie">
          <H5 component="h2">{t('subscribe.goodie.title')}</H5>

          <Controller
            name={'goodieId'}
            control={control}
            render={({ field, fieldState: { error: fieldError } }) => (
              <div>
                <GoodiePicker
                  {...field}
                  value={field.value}
                  onChange={goodieId => field.onChange(goodieId)}
                  goodies={availableGoodies}
                  disabled={!availableGoodies.length}
                />

                {!!fieldError && (
                  <FormHelperText error={!!fieldError}>
                    {fieldError?.message}
                  </FormHelperText>
                )}
              </div>
            )}
          />
        </SubscribeNarrowSection>
      )}

      {showVouchers && (
        <SubscribeNarrowSection area="voucher">
          <Controller
            name={'voucher'}
            control={control}
            render={({ field, fieldState: { error } }) => (
              <div>
                <div
                  css={{
                    display: 'flex',
                    flexFlow: 'row',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <TextField
                    {...field}
                    value={field.value ?? ''}
                    label={'Gutscheincode'}
                    error={!!error}
                    autoComplete="voucher"
                    sx={{ maxWidth: 200 }}
                  />

                  {!!upgradeInfo.data?.upgradeUserSubscriptionInfo
                    .discountPercent && (
                    <Alert
                      severity="success"
                      icon={<MdCheck />}
                    >
                      {t('subscribe.voucher.discountApplied', {
                        discountPercent:
                          upgradeInfo.data.upgradeUserSubscriptionInfo
                            .discountPercent * 100,
                      })}
                    </Alert>
                  )}

                  {upgradeInfo.data?.upgradeUserSubscriptionInfo
                    .voucherValid === false && (
                    <Alert
                      severity="error"
                      icon={<MdError />}
                    >
                      {t('subscribe.voucher.invalid')}
                    </Alert>
                  )}
                </div>

                {!!error && (
                  <FormHelperText error={!!error}>
                    {error?.message}
                  </FormHelperText>
                )}
              </div>
            )}
          />
        </SubscribeNarrowSection>
      )}

      {error && (
        <ApiAlert
          error={error as ApolloError}
          severity="error"
        />
      )}

      {!!watchedMonthlyAmount && (
        <SubscribeSection area="transactionFee">
          <Controller
            name={'payTransactionFee'}
            control={control}
            defaultValue={false}
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
          {upgradeText}
        </SubscribeButton>

        <SubscribeContinuation>{continuationText}</SubscribeContinuation>

        {termsOfServiceUrl ?
          <Link
            underline={'hover'}
            href={termsOfServiceUrl}
          >
            <SubscribeCancelable>
              {t('subscribe.cancellable')}
            </SubscribeCancelable>
          </Link>
        : <SubscribeCancelable>
            {t('subscribe.cancellable')}
          </SubscribeCancelable>
        }
      </SubscribeNarrowSection>
    </SubscribeWrapper>
  );
};
