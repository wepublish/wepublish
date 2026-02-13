import { zodResolver } from '@hookform/resolvers/zod';
import { Checkbox, FormControlLabel } from '@mui/material';
import styled from '@emotion/styled';
import {
  Challenge,
  defaultRegisterSchema,
  requiredRegisterSchema,
  UserForm,
  useUser,
  zodAlwaysRefine,
} from '@wepublish/authentication/website';
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
  useAsyncAction,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { formatCurrency, roundUpTo5Cents } from '../formatters/format-currency';
import {
  formatPaymentPeriod,
  getPaymentPeriodicyMonths,
} from '../formatters/format-payment-period';
import { formatRenewalPeriod } from '../formatters/format-renewal-period';
import { ApolloError } from '@apollo/client';
import { ApiAlert } from '@wepublish/errors/website';
import { Modal } from '@wepublish/website/builder';
import { useTranslation } from 'react-i18next';

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
});

export const SubscribeWrapper = styled('form')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(5)};
  align-content: start;
`;

export type SubscribeSectionProps = {
  area?: string;
};

export const SubscribeSection = styled('div')<SubscribeSectionProps>`
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

export const SubscribeNarrowSection = styled(SubscribeSection)`
  gap: ${({ theme }) => theme.spacing(1)};
`;

export const usePaymentText = ({
  type = 'button',
  autoRenew,
  extendable,
  productType,
  memberPlan,
  paymentPeriodicity,
  monthlyAmount,
  currency,
  siteTitle,
  locale,
}: {
  type?: 'button' | 'support';
  autoRenew: boolean;
  extendable: boolean;
  memberPlan: string;
  productType: ProductType;
  paymentPeriodicity: PaymentPeriodicity;
  monthlyAmount: number;
  currency: Currency;
  siteTitle: string;
  locale: string;
}) => {
  const { t } = useTranslation();

  return useMemo(() => {
    const variables = {
      productType,
      renewalPeriod: formatRenewalPeriod(paymentPeriodicity),
      renewalPeriodL: formatRenewalPeriod(paymentPeriodicity).toLowerCase(),
      paymentPeriod: formatPaymentPeriod(paymentPeriodicity),
      paymentPeriodL: formatPaymentPeriod(paymentPeriodicity).toLowerCase(),
      formattedAmount: formatCurrency(
        (monthlyAmount / 100) * getPaymentPeriodicyMonths(paymentPeriodicity),
        currency,
        locale
      ),
      monthlyAmount,
      memberPlan,
      siteTitle,
    };

    if (autoRenew && extendable) {
      return t(`subscribe.${type}.subscribeForPeriod`, variables);
    }

    if (extendable) {
      return t(`subscribe.${type}.payForPeriod`, variables);
    }

    return t(`subscribe.${type}.pay`, variables);
  }, [
    autoRenew,
    currency,
    extendable,
    locale,
    monthlyAmount,
    paymentPeriodicity,
    productType,
    type,
    memberPlan,
    siteTitle,
    t,
  ]);
};

export const Subscribe = <T extends Exclude<BuilderUserFormFields, 'flair'>>({
  defaults,
  memberPlans,
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
}: BuilderSubscribeProps<T>) => {
  const {
    meta: { locale, siteTitle },
    elements: { Alert, H5, Paragraph },
    MemberPlanPicker,
    PaymentMethodPicker,
    PeriodicityPicker,
    PaymentAmount,
    TransactionFee,
  } = useWebsiteBuilder();
  const { t } = useTranslation();
  const { hasUser } = useUser();
  const [openConfirm, setOpenConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error>();
  const callAction = useAsyncAction(setLoading, setError);

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
      zodAlwaysRefine(hasUserContext ? loggedInSchema : loggedOutSchema).refine(
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
      ),
    [
      hasUserContext,
      loggedInSchema,
      loggedOutSchema,
      memberPlans.data?.memberPlans.nodes,
    ]
  );

  const { control, handleSubmit, watch, setValue, resetField } = useForm<
    z.infer<typeof loggedInSchema> | z.infer<typeof loggedOutSchema>
  >({
    resolver: zodResolver(schem),
    defaultValues: {
      ...defaults,
      monthlyAmount: 0,
      autoRenew: true,
      payTransactionFee: false,
      memberPlanId:
        defaults?.memberPlanSlug ?
          memberPlans.data?.memberPlans.nodes.find(
            memberPlan => memberPlan.slug === defaults?.memberPlanSlug
          )?.id
        : memberPlans.data?.memberPlans.nodes[0]?.id,
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

  const selectedPaymentMethodId = watch<'paymentMethodId'>('paymentMethodId');
  const selectedPaymentPeriodicity =
    watch<'paymentPeriodicity'>('paymentPeriodicity');
  const selectedMemberPlanId = watch<'memberPlanId'>('memberPlanId');
  const payTransactionFee = watch<'payTransactionFee'>('payTransactionFee');
  const monthlyAmount =
    watch<'monthlyAmount'>('monthlyAmount') +
    (payTransactionFee ?
      transactionFee(watch<'monthlyAmount'>('monthlyAmount'))
    : 0);
  const autoRenew = watch<'autoRenew'>('autoRenew');

  const selectedMemberPlan = useMemo(
    () =>
      memberPlans.data?.memberPlans.nodes.find(
        memberPlan => memberPlan.id === selectedMemberPlanId
      ),
    [memberPlans.data?.memberPlans.nodes, selectedMemberPlanId]
  );

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

  const shouldHidePaymentAmount =
    selectedMemberPlan?.amountPerMonthMin ===
    selectedMemberPlan?.amountPerMonthMax;

  const paymentText = usePaymentText({
    autoRenew,
    memberPlan: selectedMemberPlan?.name ?? '',
    extendable: selectedMemberPlan?.extendable ?? true,
    productType: selectedMemberPlan?.productType ?? ProductType.Subscription,
    paymentPeriodicity: selectedPaymentPeriodicity,
    monthlyAmount,
    currency: selectedMemberPlan?.currency ?? Currency.Chf,
    siteTitle,
    locale,
  });

  const supportText = usePaymentText({
    type: 'support',
    autoRenew: true,
    memberPlan: selectedMemberPlan?.name ?? '',
    extendable: selectedMemberPlan?.extendable ?? true,
    productType: selectedMemberPlan?.productType ?? ProductType.Subscription,
    paymentPeriodicity: PaymentPeriodicity.Monthly,
    monthlyAmount: watch<'monthlyAmount'>('monthlyAmount'),
    currency: selectedMemberPlan?.currency ?? Currency.Chf,
    siteTitle,
    locale,
  });

  const onSubmit = handleSubmit(data => {
    const subscribeData: SubscribeMutationVariables = {
      monthlyAmount,
      memberPlanId: data.memberPlanId,
      paymentMethodId: data.paymentMethodId,
      paymentPeriodicity: data.paymentPeriodicity,
      autoRenew: data.autoRenew,
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

  console.warn(watch('monthlyAmount'));

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

  const alreadyHasSubscription = useMemo(() => {
    if (deactivateSubscriptionId) {
      return;
    }

    return (
      userSubscriptions.data?.subscriptions.some(
        ({ memberPlan, deactivation }) =>
          memberPlan.id === selectedMemberPlanId &&
          memberPlan.productType === ProductType.Subscription &&
          !deactivation
      ) ?? false
    );
  }, [
    deactivateSubscriptionId,
    userSubscriptions.data?.subscriptions,
    selectedMemberPlanId,
  ]);

  const hasOpenInvoices = useMemo(() => {
    if (deactivateSubscriptionId) {
      return;
    }

    return (
      userInvoices.data?.invoices.some(
        invoice => !invoice.canceledAt && !invoice.paidAt
      ) ?? false
    );
  }, [deactivateSubscriptionId, userInvoices.data?.invoices]);

  const amountPerMonthMin = selectedMemberPlan?.amountPerMonthMin || 500;

  return (
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

                <PaymentAmount
                  {...field}
                  error={error}
                  slug={selectedMemberPlan?.slug}
                  donate={isDonation}
                  amountPerMonthMin={amountPerMonthMin}
                  amountPerMonthMax={
                    selectedMemberPlan?.amountPerMonthMax ?? undefined
                  }
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

      {!!watch<'monthlyAmount'>('monthlyAmount') && (
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
          {paymentText} {isDonation ? 'spenden' : 'abonnieren'}
        </SubscribeButton>

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
        submitText={`${paymentText} ${isDonation ? 'Spenden' : 'Abonnieren'}`}
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
  );
};
