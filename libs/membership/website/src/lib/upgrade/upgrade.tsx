import { zodResolver } from '@hookform/resolvers/zod';
import { zodAlwaysRefine } from '@wepublish/authentication/website';
import {
  Currency,
  PaymentMethod,
  PaymentPeriodicity,
  ProductType,
  SubscribeBlockPlanRenderStyle,
  UpgradeMutationVariables,
} from '@wepublish/website/api';
import {
  BuilderUpgradeProps,
  Link,
  useAsyncAction,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { formatCurrency, roundUpTo5Cents } from '../formatters/format-currency';
import { PaymentAmountPicker } from '../payment-amount/payment-amount-picker/payment-amount-picker';

import { ApolloError } from '@apollo/client';
import { ApiAlert } from '@wepublish/errors/website';
import { FormHelperText } from '@mui/material';
import { Trans, useTranslation } from 'react-i18next';
import {
  clampMonthlyAmount,
  GoodieSection,
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
  goodieId: true,
});

export const useUpgradeText = ({
  productType,
  discount,
  paymentPeriodicity,
  monthlyAmount,
  memberPlan,
  currency,
  locale,
}: {
  discount: number;
  productType: ProductType;
  paymentPeriodicity: PaymentPeriodicity;
  monthlyAmount: number;
  memberPlan: string;
  currency: Currency;
  locale: string;
}) => {
  const { t } = useTranslation();

  return useMemo(() => {
    const variables = {
      productType,
      formattedAmount: formatCurrency(
        (monthlyAmount / 100) * getPaymentPeriodicyMonths(paymentPeriodicity) -
          discount / 100,
        currency,
        locale
      ),
      monthlyAmount,
      memberPlan,
    };

    return t(`subscribe.upgrade.button`, variables);
  }, [
    productType,
    monthlyAmount,
    paymentPeriodicity,
    discount,
    currency,
    locale,
    memberPlan,
    t,
  ]);
};

export const UpgradeContinuation = styled(SubscribeCancelable)`
  margin-bottom: ${({ theme }) => theme.spacing(1)};
`;

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
  planSettings,
  subscriptionToUpgrade,
  className,
  upgradeInfo,
  onSelect,
  onUpgrade,
  donate,
  showGoodies = false,
  goodieMinValue,
  hideRepeatGoodieOnUpgrade = false,
  termsOfServiceUrl,
  transactionFee = amount => roundUpTo5Cents((amount * 0.02) / 100) * 100,
  transactionFeeText,
}: BuilderUpgradeProps) => {
  const {
    meta: { locale, siteTitle },
    elements: { H5, Paragraph },
    GoodiePicker,
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

  const freeAmountTouchedRef = useRef(false);

  const schema = useMemo(
    () =>
      zodAlwaysRefine(upgradeSchema).refine(
        data => {
          const planSetting = planSettings?.find(
            ({ memberPlanId }) => memberPlanId === data.memberPlanId
          );

          return (
            planSetting?.renderStyle !==
              SubscribeBlockPlanRenderStyle.CardFreeInput ||
            freeAmountTouchedRef.current
          );
        },
        {
          message: `Bitte Betrag eingeben.`,
          path: ['monthlyAmount'],
        }
      ),
    [planSettings]
  );

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    resetField,
    setError: setFieldError,
    formState: { errors },
  } = useForm<z.infer<typeof upgradeSchema>>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: {
      monthlyAmount: 0,
      goodieId: null,
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
  const rawMonthlyAmount =
    (useWatch({ control, name: 'monthlyAmount' }) as number) ?? 0;
  const monthlyAmount =
    rawMonthlyAmount +
    (payTransactionFee ? transactionFee(rawMonthlyAmount) : 0);

  const goodieId = watch('goodieId');
  const [soldOutGoodieIds, setSoldOutGoodieIds] = useState<string[]>([]);

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
      (rawMonthlyAmount - subscriptionToUpgrade.monthlyAmount) * 12;

    if (goodieMinValue != null && deltaYearly < goodieMinValue) {
      return [];
    }

    return (
      selectedMemberPlan?.goodies?.filter(
        ({ id }) => !soldOutGoodieIds.includes(id)
      ) ?? []
    );
  }, [
    hideGoodieForExistingGoodie,
    subscriptionToUpgrade.monthlyAmount,
    rawMonthlyAmount,
    goodieMinValue,
    selectedMemberPlan?.goodies,
    soldOutGoodieIds,
  ]);

  const allGoodies = useMemo(() => {
    const goodiesById = new Map(
      memberPlans.data?.memberPlans.nodes
        .flatMap(memberPlan => memberPlan.goodies ?? [])
        .map(goodie => [goodie.id, goodie])
    );

    return [...goodiesById.values()];
  }, [memberPlans.data?.memberPlans.nodes]);

  const allPaymentMethods = useMemo(
    () =>
      (selectedMemberPlan?.availablePaymentMethods?.flatMap(
        ({ paymentMethods }) => paymentMethods
      ) as PaymentMethod[]) ?? [],
    [selectedMemberPlan?.availablePaymentMethods]
  );

  const isDonation = selectedMemberPlan?.productType === ProductType.Donation;

  const selectedPlanSetting = planSettings?.find(
    ({ memberPlanId }) => memberPlanId === selectedMemberPlan?.id
  );
  const selectedPlanRenderStyle = selectedPlanSetting?.renderStyle;

  const isFreeInput =
    selectedPlanRenderStyle === SubscribeBlockPlanRenderStyle.CardFreeInput;

  const useAmountTiles =
    selectedPlanRenderStyle === SubscribeBlockPlanRenderStyle.AmountTiles;
  const AmountComponent = useAmountTiles ? PaymentAmountPicker : PaymentAmount;

  const handleMonthlyAmountChange = useCallback(
    (amount: number, touched = true) => {
      freeAmountTouchedRef.current = touched;
      setValue('monthlyAmount', amount, { shouldValidate: true });
    },
    [setValue]
  );

  const paymentText = usePaymentText({
    autoRenew: true,
    currency: selectedMemberPlan?.currency ?? Currency.Chf,
    extendable: selectedMemberPlan?.extendable ?? true,
    paymentPeriodicity: subscriptionToUpgrade.paymentPeriodicity,
    productType: subscriptionToUpgrade.memberPlan.productType,
    memberPlan: selectedMemberPlan?.name ?? '',
    siteTitle,
    monthlyAmount,
    locale,
  });

  const supportText = usePaymentText({
    type: 'support',
    autoRenew: true,
    extendable: selectedMemberPlan?.extendable ?? true,
    memberPlan: selectedMemberPlan?.name ?? '',
    paymentPeriodicity: PaymentPeriodicity.Monthly,
    monthlyAmount: rawMonthlyAmount,
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
    currency: selectedMemberPlan?.currency ?? Currency.Chf,
    locale,
  });

  const onSubmit = handleSubmit(data => {
    const upgradeData: UpgradeMutationVariables = {
      monthlyAmount,
      memberPlanId: data.memberPlanId,
      paymentMethodId: data.paymentMethodId,
      subscriptionId: subscriptionToUpgrade.id,
      goodieId: data.goodieId,
    };

    return callAction(onUpgrade)(upgradeData);
  }, console.warn);

  const lastAmountResetPlanIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (
      !selectedMemberPlan ||
      lastAmountResetPlanIdRef.current === selectedMemberPlan.id
    ) {
      return;
    }

    lastAmountResetPlanIdRef.current = selectedMemberPlan.id;

    if (!isFreeInput) {
      setValue(
        'monthlyAmount',
        selectedMemberPlan.amountPerMonthTarget ||
          selectedMemberPlan.amountPerMonthMin
      );
    }
  }, [selectedMemberPlan, isFreeInput, setValue]);

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
    if (!error || !goodieId) {
      return;
    }

    const graphQLErrors =
      Array.isArray(error) ? error : (
        ((error as ApolloError).graphQLErrors ?? [])
      );

    const isSoldOut = graphQLErrors.some(
      graphQLError => graphQLError?.extensions?.code === 'GOODIE_SOLD_OUT'
    );

    if (isSoldOut) {
      setSoldOutGoodieIds(ids => [...ids, goodieId]);
      setValue('goodieId', null);
      setFieldError('goodieId', {
        message: t('subscribe.goodie.soldOut'),
      });
    }
  }, [error, goodieId, setFieldError, setValue, t]);

  useEffect(() => {
    onSelect(selectedMemberPlan?.id);
  }, [selectedMemberPlan?.id, onSelect]);

  const shouldHidePaymentAmount =
    selectedPlanRenderStyle ?
      selectedPlanRenderStyle === SubscribeBlockPlanRenderStyle.Card ||
      isFreeInput
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
              monthlyAmount={rawMonthlyAmount}
              onMonthlyAmountChange={handleMonthlyAmountChange}
              monthlyAmountError={errors.monthlyAmount?.message?.toString()}
              planSettings={planSettings}
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

                <AmountComponent
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
                  slug={selectedMemberPlan?.slug}
                  donate={
                    !!donate?.(selectedMemberPlan) || isDonation || isFreeInput
                  }
                  amountPerMonthMin={amountPerMonthMin}
                  amountPerMonthMax={
                    selectedMemberPlan?.amountPerMonthMax ?? undefined
                  }
                  amountPerMonthTarget={
                    selectedMemberPlan?.amountPerMonthTarget ?? undefined
                  }
                  currency={selectedMemberPlan?.currency ?? Currency.Chf}
                  presetAmounts={
                    selectedPlanSetting?.amountTileValues ?? undefined
                  }
                  tileLayout={
                    selectedPlanSetting?.amountTileLayout ?? undefined
                  }
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

      {showGoodies && !hideGoodieForExistingGoodie && (
        <GoodieSection area="goodie">
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
                  allGoodies={allGoodies}
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
        </GoodieSection>
      )}

      {error && (
        <ApiAlert
          error={error as ApolloError}
          severity="error"
        />
      )}

      {!!rawMonthlyAmount && (
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

        <UpgradeContinuation>Danach {paymentText}</UpgradeContinuation>

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
