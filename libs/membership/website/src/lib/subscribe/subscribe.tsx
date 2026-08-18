import { ApolloError } from '@apollo/client';
import styled from '@emotion/styled';
import { zodResolver } from '@hookform/resolvers/zod';
import { Checkbox, FormControlLabel, FormHelperText } from '@mui/material';
import {
  BuilderChallengeRef,
  Challenge,
  defaultRegisterSchema,
  requiredRegisterSchema,
  useUser,
  zodAlwaysRefine,
} from '@wepublish/authentication/website';
import { ApiAlert } from '@wepublish/errors/website';
import {
  Currency,
  PaymentMethod,
  PaymentPeriodicity,
  ProductType,
  RegisterMutationVariables,
  ResubscribeMutationVariables,
  SubscribeMutationVariables,
  UserAddressInput,
} from '@wepublish/website/api';
import {
  BuilderSubscribeProps,
  BuilderUserFormFields,
  Button,
  Link,
  Modal,
  useAsyncAction,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { ComponentProps, useEffect, useMemo, useRef, useState } from 'react';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { MdCheck, MdError } from 'react-icons/md';
import { z } from 'zod';
import { roundUpTo5Cents } from '../formatters/format-currency';
import { getPaymentPeriodicyMonths } from '../formatters/format-payment-period';
import {
  findMemberPlanRenderSetting,
  getAmountPickerValues,
  isAmountPickerLayout,
  isAmountSliderLayout,
  isFixedAmountLayout,
  showsAmountInput,
} from './member-plan-render-settings';
import { useContinuationText, usePaymentText } from './subscribe-texts';

export const subscribeSchema = z.object({
  memberPlanId: z.string().min(1),
  paymentMethodId: z.string().min(1),
  monthlyAmount: z.coerce.number().gte(0),
  autoRenew: z.boolean(),
  paymentPeriodicity: z.enum([
    PaymentPeriodicity.Monthly,
    PaymentPeriodicity.Quarterly,
    PaymentPeriodicity.Biannual,
    PaymentPeriodicity.Yearly,
    PaymentPeriodicity.Biennial,
    PaymentPeriodicity.Lifetime,
  ]),
  payTransactionFee: z.boolean(),
  discountCode: z.string().nullish(),
  goodieId: z.string().nullish(),
});

export const SubscribeWrapper = styled('form')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(5)};
  align-content: start;
`;

export type SubscribeSectionProps = {
  area?: string;
};

const SubscribeSectionBase = ({
  area,
  ...rest
}: SubscribeSectionProps & ComponentProps<'div'>) => (
  <div
    data-area={area}
    {...rest}
  />
);

export const SubscribeSection = styled(
  SubscribeSectionBase
)<SubscribeSectionProps>`
  --grid-area: ${({ area = 'auto' }) => area};
  display: grid;
  gap: ${({ theme }) => theme.spacing(3)};
  align-content: start;

  &:empty {
    display: none;
  }
`;

export const SubscribeAmount = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(1)};
  grid-template-columns: 1fr;
  align-items: center;
  padding: ${({ theme }) => theme.spacing(3)};
  border: 1px solid ${({ theme }) => theme.palette.divider};
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
`;

export const SubscribeAmountText = styled('p')`
  text-align: center;

  ${({ theme }) => theme.breakpoints.up('xs')} {
    margin: ${({ theme }) => theme.spacing(0, 0, 2, 0)};
  }
`;

export const SubscribePayment = styled('div')`
  display: flex;
  flex-flow: row wrap;
  align-items: center;
  flex-grow: 1;
  column-gap: ${({ theme }) => theme.spacing(3)};
  row-gap: ${({ theme }) => theme.spacing(2)};

  &:empty {
    display: none;
  }
`;

export const SubscribeButton = styled(Button)`
  justify-self: center;
`;

export const SubscribeCancelable = styled('div')`
  text-align: center;
  color: ${({ theme }) => theme.palette.grey[500]};
  max-width: 35ch;
  justify-self: center;
`;

export const SubscribeContinuation = styled(SubscribeCancelable)`
  margin-bottom: ${({ theme }) => theme.spacing(1)};
`;

export const SubscribeNarrowSection = styled(SubscribeSection)`
  gap: ${({ theme }) => theme.spacing(1)};
`;

export const clampMonthlyAmount = (amount: number, min: number, max?: number) =>
  Math.min(Math.max(amount, min), max ?? Number.MAX_SAFE_INTEGER);

export const Subscribe = <T extends Exclude<BuilderUserFormFields, 'flair'>>({
  defaults,
  memberPlans,
  memberPlanRenderSettings,
  showGoodies = false,
  showDiscountCodes = false,
  challenge,
  userSubscriptions,
  userInvoices,
  fields = ['firstName', 'password', 'passwordRepeated', 'address'] as T[],
  schema = defaultRegisterSchema,
  className,
  onSubscribe,
  onSubscribeWithRegister,
  onResubscribe,
  deactivateSubscriptionId,
  termsOfServiceUrl,
  transactionFee = amount => roundUpTo5Cents((amount * 0.02) / 100) * 100,
  transactionFeeText,
  returningUserId,
  filterGoodies,
  goodieMinValue,
  fetchSubscribeInfo,
  subscribeInfo,
}: BuilderSubscribeProps<T>) => {
  const {
    meta: { locale, siteTitle },
    elements: { Alert, H5, Paragraph, TextField },
    GoodiePicker,
    MemberPlanPicker,
    PaymentMethodPicker,
    PeriodicityPicker,
    PaymentAmountSlider,
    PaymentAmountPicker,
    TransactionFee,
    UserForm,
  } = useWebsiteBuilder();
  const { t } = useTranslation();
  const { hasUser } = useUser();
  const [openConfirm, setOpenConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error>();
  const callAction = useAsyncAction(setLoading, setError);
  const challengeRef = useRef<BuilderChallengeRef>(null);

  const fieldsToDisplay = useMemo(
    () =>
      fields.reduce(
        (obj, field) => ({ ...obj, [field]: true }),
        {} as Record<Exclude<BuilderUserFormFields, 'flair'>, true>
      ),
    [fields]
  );
  const hasUserContext = hasUser || !!returningUserId;

  /**
   * Done like this to avoid type errors due to z.ZodObject vs z.ZodEffect<z.ZodObject>.
   * [Fixed with Zod 4](https://github.com/colinhacks/zod/issues/2474)
   */
  const loggedOutSchema = useMemo(() => {
    let result: z.ZodEffects<any> | z.ZodObject<any> =
      requiredRegisterSchema.merge(
        schema.pick(fieldsToDisplay).merge(subscribeSchema)
      );

    if (fieldsToDisplay.passwordRepeated) {
      result = zodAlwaysRefine(result).refine(
        data => data.password === data.passwordRepeated,
        {
          message: 'Passwörter stimmen nicht überein.',
          path: ['passwordRepeated'],
        }
      );
    }

    if (fieldsToDisplay.emailRepeated) {
      result = zodAlwaysRefine(result).refine(
        data => data.email === data.emailRepeated,
        {
          message: 'E-Mailadressen stimmen nicht überein.',
          path: ['emailRepeated'],
        }
      );
    }

    return result;
  }, [fieldsToDisplay, schema]);

  const loggedInSchema = subscribeSchema;
  const schem = useMemo(
    () =>
      zodAlwaysRefine(
        zodAlwaysRefine(
          hasUserContext ? loggedInSchema : loggedOutSchema
        ).refine(
          data => {
            const memberPlan = memberPlans.data?.memberPlans.nodes.find(
              mb => mb.id === data.memberPlanId
            );

            return (
              !memberPlan || data.monthlyAmount >= memberPlan.amountPerMonthMin
            );
          },
          {
            message: `Betrag kleiner wie der Mindestbetrag.`,
            path: ['monthlyAmount'],
          }
        )
      ),
    [
      hasUserContext,
      loggedInSchema,
      loggedOutSchema,
      memberPlans.data?.memberPlans.nodes,
    ]
  );

  const form = useForm<
    z.infer<typeof loggedInSchema> | z.infer<typeof loggedOutSchema>
  >({
    resolver: zodResolver(schem),
    defaultValues: {
      ...defaults,
      discountCode: defaults?.discountCode ?? '',
      goodieId: null,
      monthlyAmount: 0,
      autoRenew: true,
      payTransactionFee: false,
      memberPlanId:
        defaults?.memberPlanSlug ?
          memberPlans.data?.memberPlans.nodes.find(
            memberPlan => memberPlan.slug === defaults?.memberPlanSlug
          )?.id
        : (memberPlans.data?.memberPlans.nodes.find(
            memberPlan =>
              memberPlan.id ===
              memberPlanRenderSettings?.find(({ isDefault }) => isDefault)
                ?.memberPlanId
          )?.id ?? memberPlans.data?.memberPlans.nodes[0]?.id),
      paymentMethodId:
        memberPlans.data?.memberPlans.nodes[0]?.availablePaymentMethods[0]
          ?.paymentMethods[0]?.id,
      paymentPeriodicity:
        memberPlans.data?.memberPlans.nodes[0]?.availablePaymentMethods[0]
          ?.paymentPeriodicities[0],
    },
    mode: 'onTouched',
    reValidateMode: 'onChange',
  });
  const { control, handleSubmit, watch, setValue, resetField } = form;

  const discountCode = watch<'discountCode'>('discountCode');
  const goodieId = watch<'goodieId'>('goodieId');
  const selectedPaymentMethodId = watch<'paymentMethodId'>('paymentMethodId');
  const selectedPaymentPeriodicity =
    watch<'paymentPeriodicity'>('paymentPeriodicity');
  const selectedMemberPlanId = watch<'memberPlanId'>('memberPlanId');
  const payTransactionFee = watch<'payTransactionFee'>('payTransactionFee');
  const watchedMonthlyAmount = watch<'monthlyAmount'>('monthlyAmount');
  const monthlyAmount =
    watchedMonthlyAmount +
    (payTransactionFee ? transactionFee(watchedMonthlyAmount) : 0);
  const autoRenew = watch<'autoRenew'>('autoRenew');

  const selectedMemberPlan = useMemo(
    () =>
      memberPlans.data?.memberPlans.nodes.find(
        memberPlan => memberPlan.id === selectedMemberPlanId
      ),
    [memberPlans.data?.memberPlans.nodes, selectedMemberPlanId]
  );

  const availableGoodies = useMemo(() => {
    const goodies = selectedMemberPlan?.goodies ?? [];

    const filteredGoodies =
      filterGoodies ?
        filterGoodies(goodies, { monthlyAmount: watchedMonthlyAmount })
      : goodies;

    const amount =
      monthlyAmount * getPaymentPeriodicyMonths(selectedPaymentPeriodicity);

    if (goodieMinValue && goodieMinValue > amount) {
      return [];
    }

    return filteredGoodies;
  }, [
    selectedMemberPlan?.goodies,
    filterGoodies,
    watchedMonthlyAmount,
    monthlyAmount,
    selectedPaymentPeriodicity,
    goodieMinValue,
  ]);

  const selectedAvailablePaymentMethod = useMemo(
    () =>
      selectedMemberPlan?.availablePaymentMethods.find(memberPlan =>
        memberPlan.paymentMethods.find(
          ({ id }) => id === selectedPaymentMethodId
        )
      ),
    [selectedMemberPlan?.availablePaymentMethods, selectedPaymentMethodId]
  );

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

  const shouldHidePaymentAmount =
    selectedLayout ?
      isFixedAmountLayout(selectedLayout)
    : selectedMemberPlan?.amountPerMonthMin ===
      selectedMemberPlan?.amountPerMonthMax;

  const discountPercent =
    subscribeInfo.data?.createSubscriptionInfo.discountPercent ?? 0;

  const paymentText = usePaymentText({
    autoRenew,
    memberPlan: selectedMemberPlan?.name ?? '',
    extendable: selectedMemberPlan?.extendable ?? true,
    productType: selectedMemberPlan?.productType ?? ProductType.Subscription,
    paymentPeriodicity: selectedPaymentPeriodicity,
    monthlyAmount: monthlyAmount * (1 - discountPercent),
    currency: selectedMemberPlan?.currency ?? Currency.Chf,
    siteTitle,
    locale,
  });

  const continuationText = useContinuationText({
    memberPlan: selectedMemberPlan?.name ?? '',
    paymentPeriodicity: selectedPaymentPeriodicity,
    monthlyAmount,
    currency: selectedMemberPlan?.currency ?? Currency.Chf,
    locale,
  });

  const supportText = usePaymentText({
    type: 'support',
    autoRenew: true,
    memberPlan: selectedMemberPlan?.name ?? '',
    extendable: selectedMemberPlan?.extendable ?? true,
    productType: selectedMemberPlan?.productType ?? ProductType.Subscription,
    paymentPeriodicity: PaymentPeriodicity.Monthly,
    monthlyAmount: watchedMonthlyAmount,
    currency: selectedMemberPlan?.currency ?? Currency.Chf,
    siteTitle,
    locale,
  });

  const onSubmit = handleSubmit(data => {
    challengeRef.current?.reset();

    if (
      subscribeInfo.data?.createSubscriptionInfo.discountCodeValid === false
    ) {
      return;
    }

    const subscribeData: SubscribeMutationVariables = {
      monthlyAmount,
      memberPlanId: data.memberPlanId,
      paymentMethodId: data.paymentMethodId,
      paymentPeriodicity: data.paymentPeriodicity,
      autoRenew: data.autoRenew,
      discountCode: data.discountCode,
      goodieId: data.goodieId,
    };

    if (hasUser) {
      return callAction(onSubscribe)(subscribeData);
    }

    if (returningUserId) {
      const resubscribeData: ResubscribeMutationVariables = {
        ...subscribeData,
        userId: returningUserId,
      };

      return callAction(onResubscribe)(resubscribeData);
    }

    const {
      address,
      challengeAnswer,
      email,
      birthday,
      password,
      name,
      firstName,
    } = data as z.infer<typeof loggedOutSchema>;

    const registerData = {
      birthday,
      email,
      password,
      name,
      firstName,
      address: address as UserAddressInput,
      challengeAnswer,
    } as RegisterMutationVariables;

    return callAction(onSubscribeWithRegister)({
      register: registerData,
      subscribe: subscribeData,
    });
  }, console.warn);

  useEffect(() => {
    if (selectedMemberPlan) {
      setValue<'monthlyAmount'>(
        'monthlyAmount',
        selectedMemberPlan.amountPerMonthTarget ||
          selectedMemberPlan.amountPerMonthMin
      );
    }
  }, [selectedMemberPlan, setValue]);

  useEffect(() => {
    if (challenge.data?.challenge.challengeID) {
      setValue<'challengeAnswer.challengeID'>(
        'challengeAnswer.challengeID',
        challenge.data.challenge.challengeID
      );
    }
  }, [challenge, setValue]);

  useEffect(() => {
    if (selectedAvailablePaymentMethod?.forceAutoRenewal) {
      setValue<'autoRenew'>('autoRenew', true);
    }

    if (!selectedMemberPlan?.extendable) {
      setValue<'autoRenew'>('autoRenew', false);
    }
  }, [
    selectedAvailablePaymentMethod?.forceAutoRenewal,
    selectedMemberPlan?.extendable,
    setValue,
  ]);

  useEffect(() => {
    if (
      selectedPaymentMethodId &&
      !allPaymentMethods?.find(({ id }) => id === selectedPaymentMethodId)
    ) {
      resetField('paymentMethodId');
    }
  }, [resetField, allPaymentMethods, selectedPaymentMethodId]);

  useEffect(() => {
    if (
      !selectedAvailablePaymentMethod?.paymentPeriodicities.includes(
        selectedPaymentPeriodicity
      )
    ) {
      resetField('paymentPeriodicity', {
        defaultValue: selectedAvailablePaymentMethod
          ?.paymentPeriodicities?.[0] as undefined, // wrong undefined typing by react-hook: https://react-hook-form.com/docs/useform/resetfield
      });
    }
  }, [selectedAvailablePaymentMethod, resetField, selectedPaymentPeriodicity]);

  useEffect(() => {
    fetchSubscribeInfo({
      variables: {
        memberPlanId: selectedMemberPlanId,
        discountCode,
      },
    });
  }, [fetchSubscribeInfo, selectedMemberPlanId, discountCode]);

  useEffect(() => {
    if (goodieId && !availableGoodies.some(({ id }) => id === goodieId)) {
      setValue<'goodieId'>('goodieId', null);
    }
  }, [availableGoodies, goodieId, setValue]);

  const alreadyHasSubscription = useMemo(() => {
    if (deactivateSubscriptionId) {
      return;
    }

    return (
      userSubscriptions.data?.userSubscriptions.some(
        ({ memberPlan, deactivation }) =>
          memberPlan.id === selectedMemberPlanId &&
          memberPlan.productType === ProductType.Subscription &&
          !deactivation
      ) ?? false
    );
  }, [
    deactivateSubscriptionId,
    userSubscriptions.data?.userSubscriptions,
    selectedMemberPlanId,
  ]);

  const hasOpenInvoices = useMemo(() => {
    if (deactivateSubscriptionId) {
      return;
    }

    return (
      userInvoices.data?.userInvoices.some(
        invoice => !invoice.canceledAt && !invoice.paidAt
      ) ?? false
    );
  }, [deactivateSubscriptionId, userInvoices.data?.userInvoices]);

  const amountPerMonthMin = selectedMemberPlan?.amountPerMonthMin || 500;

  return (
    <FormProvider {...form}>
      <SubscribeWrapper
        className={className}
        onSubmit={onSubmit}
        noValidate
      >
        {!hasUser && returningUserId && (
          <SubscribeSection area="returning">
            <H5 component="h2">
              {`Hallo ${defaults?.firstName ?? ''} ${defaults?.name ?? ''}`.trim()}
              , willkommen zurück!
            </H5>
          </SubscribeSection>
        )}

        <SubscribeSection area="memberPlans">
          {(memberPlans.data?.memberPlans.nodes.length ?? 0) > 1 && (
            <H5 component="h2">Abo wählen</H5>
          )}

          {hasOpenInvoices && (
            <Alert severity="warning">
              Du hast bereits schon ein Abo mit offenen Rechnungen. Du kannst
              deine offenen Rechnungen in deinem{' '}
              <Link href="/profile">Profil</Link> anschauen.
            </Alert>
          )}

          {alreadyHasSubscription && (
            <Alert severity="warning">
              Du hast dieses Abo schon, bist du dir sicher? Du kannst deine Abos
              in deinem <Link href="/profile">Profil</Link> anschauen.
            </Alert>
          )}

          <Controller
            name={'memberPlanId'}
            control={control}
            render={({ field }) => (
              <MemberPlanPicker
                {...field}
                onChange={memberPlanId => field.onChange(memberPlanId)}
                memberPlans={memberPlans.data?.memberPlans.nodes ?? []}
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
                      donate={isDonation}
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
                      donate={isDonation}
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

        {!hasUserContext && (
          <SubscribeSection area={'userForm'}>
            <UserForm
              control={control}
              fields={fields}
            />
          </SubscribeSection>
        )}

        <SubscribeSection area="paymentPeriodicity">
          {allPaymentMethods.length > 1 && (
            <H5 component="h2">Zahlungsmethode wählen</H5>
          )}

          <SubscribePayment>
            <Controller
              name={'paymentMethodId'}
              control={control}
              render={({ field }) => (
                <PaymentMethodPicker
                  {...field}
                  onChange={paymentMethodId => field.onChange(paymentMethodId)}
                  paymentMethods={allPaymentMethods}
                />
              )}
            />

            <Controller
              name={'paymentPeriodicity'}
              control={control}
              render={({ field }) => (
                <PeriodicityPicker
                  {...field}
                  onChange={periodicity => field.onChange(periodicity)}
                  periodicities={
                    selectedAvailablePaymentMethod?.paymentPeriodicities
                  }
                />
              )}
            />

            {!selectedAvailablePaymentMethod?.forceAutoRenewal &&
              selectedMemberPlan?.extendable && (
                <Controller
                  name={'autoRenew'}
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      {...field}
                      control={
                        <Checkbox
                          checked={field.value}
                          disabled={
                            selectedAvailablePaymentMethod?.forceAutoRenewal
                          }
                        />
                      }
                      label="Automatisch erneuern"
                    />
                  )}
                />
              )}
          </SubscribePayment>
        </SubscribeSection>

        {showGoodies && (
          <SubscribeSection area="goodie">
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
          </SubscribeSection>
        )}

        {showDiscountCodes && (
          <SubscribeNarrowSection area="discountCode">
            <Controller
              name={'discountCode'}
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
                      label={'Rabattcode'}
                      error={!!error}
                      autoComplete="discountCode"
                      sx={{ maxWidth: 200 }}
                    />

                    {!!subscribeInfo.data?.createSubscriptionInfo
                      .discountPercent && (
                      <Alert
                        severity="success"
                        icon={<MdCheck />}
                      >
                        {t('subscribe.discountCode.discountApplied', {
                          discountPercent:
                            subscribeInfo.data?.createSubscriptionInfo
                              .discountPercent * 100,
                        })}
                      </Alert>
                    )}

                    {subscribeInfo.data?.createSubscriptionInfo
                      .discountCodeValid === false && (
                      <Alert
                        severity="error"
                        icon={<MdError />}
                      >
                        {t('subscribe.discountCode.invalid')}
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

        {!hasUserContext && (
          <SubscribeSection area="challenge">
            <H5 component="h2">Spam-Schutz</H5>

            {challenge.data?.challenge && (
              <Controller
                name={'challengeAnswer.challengeSolution'}
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <Challenge
                    {...field}
                    challengeRef={challengeRef}
                    value={field.value || ''}
                    onChange={field.onChange}
                    challenge={challenge.data!.challenge}
                    label={'Captcha'}
                    error={!!error}
                    helperText={error?.message}
                  />
                )}
              />
            )}

            {challenge.error && (
              <ApiAlert
                error={challenge.error}
                severity="error"
              />
            )}
          </SubscribeSection>
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
            disabled={
              challenge.loading ||
              userInvoices.loading ||
              userSubscriptions.loading ||
              loading
            }
            type="submit"
            onClick={e => {
              if (hasOpenInvoices || alreadyHasSubscription) {
                e.preventDefault();
                setOpenConfirm(true);
              }
            }}
          >
            {paymentText}
          </SubscribeButton>

          {!!discountPercent &&
            autoRenew &&
            (selectedMemberPlan?.extendable ?? true) && (
              <SubscribeContinuation>{continuationText}</SubscribeContinuation>
            )}

          {autoRenew && termsOfServiceUrl ?
            <Link
              underline={'hover'}
              href={termsOfServiceUrl}
            >
              <SubscribeCancelable>
                {t('subscribe.cancellable')}
              </SubscribeCancelable>
            </Link>
          : autoRenew && (
              <SubscribeCancelable>
                {t('subscribe.cancellable')}
              </SubscribeCancelable>
            )
          }
        </SubscribeNarrowSection>

        <Modal
          open={openConfirm}
          onSubmit={() => {
            onSubmit();
            setOpenConfirm(false);
          }}
          onCancel={() => setOpenConfirm(false)}
          submitText={paymentText}
        >
          <H5
            id="modal-modal-title"
            component="h1"
          >
            Bist du dir sicher?
          </H5>

          {hasOpenInvoices && (
            <Paragraph gutterBottom={false}>
              Du hast bereits schon ein Abo mit offenen Rechnungen. Du kannst
              deine offenen Rechnungen in deinem{' '}
              <Link href="/profile">Profil</Link> anschauen.
            </Paragraph>
          )}

          {alreadyHasSubscription && (
            <Paragraph gutterBottom={false}>
              Du hast dieses Abo schon. Du kannst deine Abos in deinem{' '}
              <Link href="/profile">Profil</Link> anschauen.
            </Paragraph>
          )}
        </Modal>
      </SubscribeWrapper>
    </FormProvider>
  );
};
