import styled from '@emotion/styled';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormControlLabel, Radio, RadioGroup } from '@mui/material';
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
  FullGiftCodeOfferFragment,
  RegisterMutationVariables,
  UserAddressInput,
} from '@wepublish/website/api';
import {
  BuilderGiftCodePurchaseProps,
  BuilderGiftCodePurchaseVariables,
  BuilderUserFormFields,
  Button,
  useAsyncAction,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import { Controller, FormProvider, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { formatCurrency } from '../formatters/format-currency';

export const giftCodePurchaseSchema = z.object({
  offerId: z.string().min(1),
  recipientName: z.string().trim().min(1).max(200),
  message: z.string().max(1000).nullish(),
  paymentMethodId: z.string().min(1),
});

export const GiftCodePurchaseWrapper = styled('form')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(5)};
  align-content: start;
`;

export const GiftCodePurchaseSection = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(3)};
  align-content: start;

  &:empty {
    display: none;
  }
`;

export const GiftCodePurchaseSubmit = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(1)};
  justify-items: center;
`;

export const GiftCodePurchaseButton = styled(Button)`
  justify-self: center;
`;

export const GiftCodeOfferPickerWrapper = styled(RadioGroup)`
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
`;

export const GiftCodeOfferCard = styled(FormControlLabel)`
  margin: 0;
  align-items: start;
  gap: ${({ theme }) => theme.spacing(1)};
  padding: ${({ theme }) => theme.spacing(2)};
  border: 1px solid ${({ theme }) => theme.palette.divider};
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;

  &:has(input:checked) {
    border-color: ${({ theme }) => theme.palette.primary.main};
  }
`;

export const GiftCodeOfferCardContent = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(1)};

  img {
    width: 100%;
    height: auto;
    border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  }
`;

export const GiftCodeOfferCardMeta = styled('div')`
  color: ${({ theme }) => theme.palette.text.secondary};
`;

export const GiftCodeOfferCardPrice = styled('strong')``;

type GiftCodeOfferPickerProps = {
  offers: FullGiftCodeOfferFragment[];
  name?: string;
  value?: string;
  onChange: (offerId: string) => void;
  className?: string;
};

export const GiftCodeOfferPicker = forwardRef<
  HTMLDivElement,
  GiftCodeOfferPickerProps
>(function GiftCodeOfferPicker(
  { offers, name, value, onChange, className },
  ref
) {
  const {
    meta: { locale },
    elements: { Image },
    blocks: { RichText },
  } = useWebsiteBuilder();
  const { t } = useTranslation();

  return (
    <GiftCodeOfferPickerWrapper
      ref={ref}
      name={name}
      aria-label={t('giftCode.purchase.chooseOffer')}
      value={value ?? ''}
      onChange={event => onChange(event.target.value)}
      className={className}
    >
      {offers.map(offer => (
        <GiftCodeOfferCard
          key={offer.id}
          value={offer.id}
          control={<Radio />}
          label={
            <GiftCodeOfferCardContent>
              {offer.image && <Image image={offer.image} />}

              <strong>{offer.name}</strong>

              {offer.description && <RichText richText={offer.description} />}

              <GiftCodeOfferCardMeta>
                {offer.memberPlan.name},{' '}
                {t('giftCode.duration', { periodicity: offer.periodicity })}
              </GiftCodeOfferCardMeta>

              {!!offer.redemptionWindowMonths && (
                <GiftCodeOfferCardMeta>
                  {t('giftCode.redemptionWindow', {
                    months: offer.redemptionWindowMonths,
                  })}
                </GiftCodeOfferCardMeta>
              )}

              <GiftCodeOfferCardPrice>
                {formatCurrency(
                  offer.price.amount / 100,
                  offer.price.currency,
                  locale
                )}
              </GiftCodeOfferCardPrice>
            </GiftCodeOfferCardContent>
          }
        />
      ))}
    </GiftCodeOfferPickerWrapper>
  );
});

export const GiftCodePurchase = <
  T extends Exclude<BuilderUserFormFields, 'flair'>,
>({
  offers,
  challenge,
  defaults,
  fields = ['firstName', 'password', 'passwordRepeated', 'address'] as T[],
  schema = defaultRegisterSchema,
  className,
  onPurchase,
  onPurchaseWithRegister,
}: BuilderGiftCodePurchaseProps<T>) => {
  const {
    meta: { locale },
    elements: { Alert, H5, TextField },
    PaymentMethodPicker,
    UserForm,
  } = useWebsiteBuilder();
  const { t } = useTranslation();
  const { hasUser } = useUser();
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

  const loggedOutSchema = useMemo(() => {
    let result: z.ZodEffects<any> | z.ZodObject<any> =
      requiredRegisterSchema.merge(
        schema.pick(fieldsToDisplay).merge(giftCodePurchaseSchema)
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

  const defaultOffer =
    offers.find(({ id }) => id === defaults?.offerId) ?? offers[0];

  const form = useForm<
    z.infer<typeof giftCodePurchaseSchema> | z.infer<typeof loggedOutSchema>
  >({
    resolver: zodResolver(hasUser ? giftCodePurchaseSchema : loggedOutSchema),
    defaultValues: {
      offerId: defaultOffer?.id ?? '',
      recipientName: '',
      message: '',
      paymentMethodId: defaultOffer?.paymentMethods[0]?.id ?? '',
    },
    mode: 'onTouched',
    reValidateMode: 'onChange',
  });
  const { control, handleSubmit, setValue } = form;

  const selectedOfferId = useWatch({ control, name: 'offerId' });
  const selectedOffer = useMemo(
    () => offers.find(({ id }) => id === selectedOfferId),
    [offers, selectedOfferId]
  );
  const paymentMethods = useMemo(
    () => selectedOffer?.paymentMethods ?? [],
    [selectedOffer]
  );

  useEffect(() => {
    if (challenge.data?.challenge.challengeID) {
      setValue<'challengeAnswer.challengeID'>(
        'challengeAnswer.challengeID',
        challenge.data.challenge.challengeID
      );
    }
  }, [challenge, setValue]);

  const submit = (
    data:
      z.infer<typeof giftCodePurchaseSchema> | z.infer<typeof loggedOutSchema>
  ) => {
    challengeRef.current?.reset();

    const purchase: BuilderGiftCodePurchaseVariables = {
      offerId: data.offerId,
      recipientName: data.recipientName,
      message: data.message || null,
      paymentMethodId: data.paymentMethodId,
    };

    if (hasUser) {
      return callAction(onPurchase)(purchase);
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

    const register = {
      birthday,
      email,
      password,
      name,
      firstName,
      address: address as UserAddressInput,
      challengeAnswer,
    } as RegisterMutationVariables;

    return callAction(onPurchaseWithRegister)({ register, purchase });
  };

  const formattedAmount =
    selectedOffer ?
      formatCurrency(
        selectedOffer.price.amount / 100,
        selectedOffer.price.currency,
        locale
      )
    : '';

  return (
    <FormProvider {...form}>
      <GiftCodePurchaseWrapper
        className={className}
        onSubmit={event => handleSubmit(submit, console.warn)(event)}
        noValidate
      >
        <GiftCodePurchaseSection>
          {offers.length > 1 && (
            <H5 component="h2">{t('giftCode.purchase.chooseOffer')}</H5>
          )}

          <Controller
            name={'offerId'}
            control={control}
            render={({ field }) => (
              <GiftCodeOfferPicker
                name={field.name}
                value={field.value}
                onChange={offerId => field.onChange(offerId)}
                offers={offers}
              />
            )}
          />
        </GiftCodePurchaseSection>

        <GiftCodePurchaseSection>
          <H5 component="h2">{t('giftCode.purchase.recipientTitle')}</H5>

          <Controller
            name={'recipientName'}
            control={control}
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                value={field.value ?? ''}
                label={t('giftCode.purchase.recipientName')}
                error={!!error}
                helperText={error?.message}
                fullWidth
              />
            )}
          />

          <Controller
            name={'message'}
            control={control}
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                value={field.value ?? ''}
                label={t('giftCode.purchase.message')}
                error={!!error}
                helperText={error?.message}
                multiline
                minRows={3}
                fullWidth
              />
            )}
          />
        </GiftCodePurchaseSection>

        {!hasUser && (
          <GiftCodePurchaseSection>
            <UserForm
              control={control}
              fields={fields}
            />
          </GiftCodePurchaseSection>
        )}

        <GiftCodePurchaseSection>
          {paymentMethods.length > 1 && (
            <H5 component="h2">{t('giftCode.purchase.choosePaymentMethod')}</H5>
          )}

          {paymentMethods.length ?
            <Controller
              name={'paymentMethodId'}
              control={control}
              render={({ field }) => (
                <PaymentMethodPicker
                  {...field}
                  onChange={paymentMethodId => field.onChange(paymentMethodId)}
                  paymentMethods={paymentMethods}
                />
              )}
            />
          : <Alert severity="warning">
              {t('giftCode.purchase.noPaymentMethods')}
            </Alert>
          }
        </GiftCodePurchaseSection>

        {!hasUser && (
          <GiftCodePurchaseSection>
            <H5 component="h2">{t('giftCode.purchase.spamProtection')}</H5>

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
                    label={t('giftCode.purchase.captcha')}
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
          </GiftCodePurchaseSection>
        )}

        {error && (
          <ApiAlert
            error={error}
            severity="error"
          />
        )}

        <GiftCodePurchaseSubmit>
          <Alert severity="info">
            {selectedOffer?.issueBeforePayment ?
              t('giftCode.purchase.issueBeforePaymentNote')
            : t('giftCode.purchase.deliveryNote')}
          </Alert>

          <GiftCodePurchaseButton
            size={'large'}
            type="submit"
            disabled={challenge.loading || loading || !paymentMethods.length}
          >
            {t('giftCode.purchase.button', { formattedAmount })}
          </GiftCodePurchaseButton>
        </GiftCodePurchaseSubmit>
      </GiftCodePurchaseWrapper>
    </FormProvider>
  );
};
