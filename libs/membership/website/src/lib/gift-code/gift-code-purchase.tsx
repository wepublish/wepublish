import { zodResolver } from '@hookform/resolvers/zod';
import { FormControlLabel } from '@mui/material';
import {
  BuilderChallengeRef,
  Challenge,
  UserFormWrapper,
  useUser,
} from '@wepublish/authentication/website';
import { ApiAlert } from '@wepublish/errors/website';
import {
  BuilderGiftCodePurchaseProps,
  BuilderGiftCodePurchaseVariables,
  BuilderUserFormFields,
  useAsyncAction,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { formatCurrency } from '../formatters/format-currency';
import { MemberPlanPickerRadios } from '../memberplan-picker/memberplan-picker';
import {
  SubscribeButton,
  SubscribeNarrowSection,
  SubscribePayment,
  SubscribeSection,
  SubscribeWrapper,
} from '../subscribe/subscribe';
import {
  toRegisterVariables,
  useGiftCodeFormSchema,
} from './gift-code-register-schema';

export const GiftCodePurchase = <
  T extends Exclude<BuilderUserFormFields, 'flair'>,
>({
  offers,
  defaultOfferId,
  challenge,
  askRecipientName = true,
  showDiscountCodes = false,
  onPurchase,
  onPurchaseWithRegister,
  fields = ['firstName', 'password', 'passwordRepeated', 'address'] as T[],
  schema,
  className,
}: BuilderGiftCodePurchaseProps<T>) => {
  const {
    MemberPlanItem,
    elements: { H5, TextField },
    PaymentMethodPicker,
    UserForm,
  } = useWebsiteBuilder();
  const { t } = useTranslation();
  const { hasUser } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error>();
  const callAction = useAsyncAction(setLoading, setError);
  const challengeRef = useRef<BuilderChallengeRef>(null);

  const purchaseSchema = useMemo(
    () =>
      z.object({
        offerId: z.string().min(1),
        paymentMethodId: z.string().min(1),
        recipientName:
          askRecipientName ?
            z.string().trim().min(1).max(200)
          : z.string().nullish(),
        discountCode: z.string().nullish(),
      }),
    [askRecipientName]
  );

  const formSchema = useGiftCodeFormSchema(
    purchaseSchema,
    hasUser,
    fields,
    schema
  );

  const initialOffer =
    offers.find(({ id }) => id === defaultOfferId) ?? offers[0];

  const { control, handleSubmit, setValue } = useForm<Record<string, any>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      offerId: initialOffer?.id,
      paymentMethodId: initialOffer?.paymentMethods[0]?.id,
      recipientName: '',
      discountCode: '',
    },
    mode: 'onTouched',
    reValidateMode: 'onChange',
  });

  const offerId = useWatch({ control, name: 'offerId' });
  const paymentMethodId = useWatch({ control, name: 'paymentMethodId' });
  const selectedOffer = offers.find(({ id }) => id === offerId);
  const paymentMethods = useMemo(
    () => selectedOffer?.paymentMethods ?? [],
    [selectedOffer]
  );
  const showDiscountCode =
    showDiscountCodes && !!selectedOffer?.allowDiscountCodes;

  useEffect(() => {
    if (
      paymentMethods.length &&
      !paymentMethods.some(({ id }) => id === paymentMethodId)
    ) {
      setValue('paymentMethodId', paymentMethods[0].id);
    }
  }, [paymentMethods, paymentMethodId, setValue]);

  useEffect(() => {
    if (challenge.data?.challenge.challengeID) {
      setValue(
        'challengeAnswer.challengeID',
        challenge.data.challenge.challengeID
      );
    }
  }, [challenge, setValue]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) =>
    handleSubmit(data => {
      challengeRef.current?.reset();

      const purchase: BuilderGiftCodePurchaseVariables = {
        offerId: data.offerId,
        paymentMethodId: data.paymentMethodId,
        recipientName: askRecipientName ? data.recipientName.trim() : null,
        discountCode: (showDiscountCode && data.discountCode?.trim()) || null,
      };

      if (hasUser) {
        return callAction(onPurchase)(purchase);
      }

      return callAction(onPurchaseWithRegister)({
        purchase,
        register: toRegisterVariables(data),
      });
    })(event);

  if (!offers.length) {
    return null;
  }

  return (
    <SubscribeWrapper
      className={className}
      onSubmit={onSubmit}
      noValidate
    >
      <SubscribeSection area="memberPlans">
        {offers.length > 1 && (
          <H5 component="h2">{t('giftCode.purchase.chooseOffer')}</H5>
        )}

        <Controller
          name="offerId"
          control={control}
          render={({ field }) => (
            <MemberPlanPickerRadios
              {...field}
              aria-label={t('giftCode.purchase.chooseOffer')}
              onChange={(_, value) => field.onChange(value)}
            >
              {offers.map(offer => (
                <FormControlLabel
                  key={offer.id}
                  value={offer.id}
                  control={
                    <MemberPlanItem
                      checked={offer.id === field.value}
                      name={offer.name}
                      slug={offer.id}
                      currency={offer.memberPlan.currency}
                      extendable
                      shortDescription={offer.description}
                      tags={[]}
                      goodies={[]}
                      periodicityPricing={[
                        {
                          __typename: 'PeriodicityPrice',
                          periodicity: offer.periodicity,
                          label: null,
                          amountMin: offer.price,
                          amountTarget: offer.price,
                          amountMax: offer.price,
                          printIssues: null,
                        },
                      ]}
                      paymentPeriodicity={offer.periodicity}
                    />
                  }
                  label={offer.name}
                />
              ))}
            </MemberPlanPickerRadios>
          )}
        />
      </SubscribeSection>

      {askRecipientName && (
        <SubscribeSection area="recipientName">
          <UserFormWrapper>
            <Controller
              name="recipientName"
              control={control}
              render={({ field, fieldState: { error: fieldError } }) => (
                <TextField
                  {...field}
                  value={field.value ?? ''}
                  label={t('giftCode.purchase.recipientName')}
                  error={!!fieldError}
                  helperText={fieldError?.message}
                />
              )}
            />
          </UserFormWrapper>
        </SubscribeSection>
      )}

      {!hasUser && (
        <SubscribeSection area="userForm">
          <UserForm
            control={control}
            fields={fields}
          />
        </SubscribeSection>
      )}

      <SubscribeSection area="paymentPeriodicity">
        {paymentMethods.length > 1 && (
          <H5 component="h2">{t('subscribe.choosePaymentMethod')}</H5>
        )}

        <SubscribePayment>
          <Controller
            name="paymentMethodId"
            control={control}
            render={({ field }) => (
              <PaymentMethodPicker
                {...field}
                onChange={id => field.onChange(id)}
                paymentMethods={paymentMethods}
              />
            )}
          />
        </SubscribePayment>
      </SubscribeSection>

      {showDiscountCode && (
        <SubscribeNarrowSection area="discountCode">
          <Controller
            name="discountCode"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                value={field.value ?? ''}
                label={t('subscribe.discountCode.label')}
                autoComplete="off"
                sx={{ maxWidth: 200 }}
              />
            )}
          />
        </SubscribeNarrowSection>
      )}

      {!hasUser && (
        <SubscribeSection area="challenge">
          <H5 component="h2">{t('subscribe.spamProtection')}</H5>

          {challenge.data?.challenge && (
            <Controller
              name={'challengeAnswer.challengeSolution'}
              control={control}
              render={({ field, fieldState: { error: fieldError } }) => (
                <Challenge
                  {...field}
                  challengeRef={challengeRef}
                  value={field.value || ''}
                  onChange={field.onChange}
                  challenge={challenge.data!.challenge}
                  label={t('subscribe.captcha')}
                  error={!!fieldError}
                  helperText={fieldError?.message}
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
          error={error}
          severity="error"
        />
      )}

      <SubscribeNarrowSection area="submit">
        <SubscribeButton
          type="submit"
          size="large"
          disabled={loading || challenge.loading}
        >
          {t('giftCode.purchase.submit', {
            amount:
              selectedOffer ?
                formatCurrency(
                  selectedOffer.price / 100,
                  selectedOffer.memberPlan.currency
                )
              : '',
          })}
        </SubscribeButton>
      </SubscribeNarrowSection>
    </SubscribeWrapper>
  );
};
