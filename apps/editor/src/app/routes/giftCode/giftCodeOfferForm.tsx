import { useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  Autocomplete,
  Card,
  CardContent,
  Checkbox,
  Drawer,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  FullImageFragment,
  FullMemberPlanFragment,
  MemberPlanDocument,
  PaymentMethodListDocument,
  PaymentPeriodicity,
} from '@wepublish/editor/api';
import {
  ChooseEditImage,
  DRAWER_WIDTHS,
  getPeriodPriceRange,
  getPlanPeriodicities,
  ImageEditPanel,
  ImageSelectPanel,
  RichTextBlock,
  RichTextBlockValue,
  SelectMemberPlan,
} from '@wepublish/ui/editor';
import { TFunction } from 'i18next';
import { useMemo, useState } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

export const createGiftCodeOfferSchema = (t: TFunction) =>
  z
    .object({
      name: z.string().trim().min(1, t('errorMessages.noNameErrorMessage')),
      description: z.custom<RichTextBlockValue['richText']>().nullish(),
      active: z.boolean(),
      issueBeforePayment: z.boolean(),
      allowDiscountCodes: z.boolean(),
      memberPlanId: z
        .string()
        .min(1, t('errorMessages.noMemberPlanErrorMessage')),
      memberPlan: z
        .custom<Pick<FullMemberPlanFragment, 'id' | 'name'>>()
        .nullish(),
      periodicity: z
        .nativeEnum(PaymentPeriodicity)
        .nullable()
        .refine(periodicity => periodicity != null, {
          message: t('errorMessages.noPaymentPeriodicityErrorMessage'),
        }),
      redemptionWindowMonths: z
        .number()
        .int(t('giftCodeOffer.form.redemptionWindowMonthsInvalid'))
        .min(1, t('giftCodeOffer.form.redemptionWindowMonthsInvalid'))
        .nullable(),
      paymentMethodIds: z
        .array(z.string())
        .min(1, t('giftCodeOffer.form.paymentMethodsRequired')),
      autoRenew: z.boolean(),
      renewalPaymentMethodId: z.string().nullable(),
      imageID: z.string().nullish(),
      image: z.custom<FullImageFragment>().nullish(),
    })
    .refine(
      ({ autoRenew, renewalPaymentMethodId }) =>
        !autoRenew || Boolean(renewalPaymentMethodId),
      {
        message: t('giftCodeOffer.form.renewalPaymentMethodRequired'),
        path: ['renewalPaymentMethodId'],
      }
    );

export type GiftCodeOfferFormValues = z.input<
  ReturnType<typeof createGiftCodeOfferSchema>
>;

export const EMPTY_GIFT_CODE_OFFER: GiftCodeOfferFormValues = {
  name: '',
  description: null,
  active: true,
  issueBeforePayment: false,
  allowDiscountCodes: false,
  memberPlanId: '',
  memberPlan: null,
  periodicity: null,
  redemptionWindowMonths: null,
  paymentMethodIds: [],
  autoRenew: false,
  renewalPaymentMethodId: null,
  imageID: null,
  image: null,
};

export const toGiftCodeOfferVariables = ({
  image,
  memberPlan,
  periodicity,
  ...offer
}: GiftCodeOfferFormValues) =>
  periodicity ? { ...offer, periodicity } : undefined;

const formatAmount = (amount: number, currency: string) =>
  `${(amount / 100).toFixed(2)} ${currency}`;

const FormWrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  align-items: start;
  gap: 16px;

  ${({ theme }) => theme.breakpoints.up('lg')} {
    grid-template-columns: 1fr 1fr;
  }
`;

const FormSection = styled.div`
  display: grid;
  align-items: start;
  gap: 16px;
`;

export const GiftCodeOfferForm = () => {
  const { t } = useTranslation();
  const { control, setValue, getValues } =
    useFormContext<GiftCodeOfferFormValues>();
  const [isChooseModalOpen, setChooseModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);

  const memberPlanId = useWatch({ control, name: 'memberPlanId' });
  const memberPlan = useWatch({ control, name: 'memberPlan' });
  const periodicity = useWatch({ control, name: 'periodicity' });
  const autoRenew = useWatch({ control, name: 'autoRenew' });
  const image = useWatch({ control, name: 'image' });

  const { data: planData } = useQuery(MemberPlanDocument, {
    variables: { id: memberPlanId },
    skip: !memberPlanId,
  });
  const { data: paymentMethodData } = useQuery(PaymentMethodListDocument);

  const plan = memberPlanId ? planData?.memberPlan : undefined;

  const pricedPeriodicities = useMemo(
    () =>
      plan ?
        getPlanPeriodicities(plan).flatMap(sold => {
          const { amountMin, amountTarget } = getPeriodPriceRange(plan, sold);
          const amount = amountTarget ?? amountMin;

          return amount > 0 ? [{ periodicity: sold, amount }] : [];
        })
      : [],
    [plan]
  );

  const periodicityOptions = useMemo(() => {
    const options = pricedPeriodicities.map(option => option.periodicity);

    return periodicity && !options.includes(periodicity) ?
        [...options, periodicity]
      : options;
  }, [pricedPeriodicities, periodicity]);

  const currentPrice = pricedPeriodicities.find(
    option => option.periodicity === periodicity
  );

  const renewalPaymentMethodsFor = (
    chosenPeriodicity: PaymentPeriodicity | null
  ) => {
    const methods = new Map<string, string>();

    for (const row of plan?.availablePaymentMethods ?? []) {
      if (
        chosenPeriodicity &&
        row.paymentPeriodicities.includes(chosenPeriodicity)
      ) {
        for (const method of row.paymentMethods) {
          if (method.active) {
            methods.set(method.id, method.name);
          }
        }
      }
    }

    return methods;
  };

  const renewalPaymentMethods = renewalPaymentMethodsFor(periodicity);

  const canRenew = !plan || plan.extendable;

  const paymentMethods = paymentMethodData?.paymentMethods ?? [];
  const paymentMethodNames = new Map(
    paymentMethods.map(method => [method.id, method.name])
  );

  const pickImage = (chosen: FullImageFragment) => {
    setChooseModalOpen(false);
    setValue('imageID', chosen.id);
    setValue('image', chosen);
  };

  return (
    <>
      <FormWrapper>
        <FormSection>
          <Card>
            <CardContent>
              <Stack
                direction="column"
                spacing={3}
              >
                <Controller
                  control={control}
                  name="name"
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      value={field.value ?? ''}
                      label={t('giftCodeOffer.form.name')}
                      error={Boolean(error)}
                      helperText={error?.message}
                      fullWidth
                    />
                  )}
                />

                <div>
                  <FormLabel>{t('giftCodeOffer.form.description')}</FormLabel>

                  <Controller
                    control={control}
                    name="description"
                    render={({ field }) => (
                      <RichTextBlock
                        value={field.value}
                        onChange={field.onChange}
                      />
                    )}
                  />
                </div>

                <div>
                  <FormLabel>{t('giftCodeOffer.form.image')}</FormLabel>

                  <Controller
                    control={control}
                    name="image"
                    render={({ field }) => (
                      <ChooseEditImage
                        onSelect={pickImage}
                        image={field.value}
                        disabled={false}
                        openChooseModalOpen={() => setChooseModalOpen(true)}
                        openEditModalOpen={() => setEditModalOpen(true)}
                        removeImage={() => {
                          field.onChange(null);
                          setValue('imageID', null);
                        }}
                      />
                    )}
                  />
                </div>
              </Stack>
            </CardContent>
          </Card>
        </FormSection>

        <FormSection>
          <Card
            variant="outlined"
            css={{ overflow: 'initial' }}
          >
            <CardContent>
              <Stack
                direction="column"
                spacing={3}
              >
                <Controller
                  control={control}
                  name="active"
                  render={({ field }) => (
                    <div>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={Boolean(field.value)}
                            onChange={(_event, checked) =>
                              field.onChange(checked)
                            }
                          />
                        }
                        label={t('giftCodeOffer.form.active')}
                      />
                    </div>
                  )}
                />

                <Controller
                  control={control}
                  name="memberPlanId"
                  render={({ field, fieldState: { error } }) => (
                    <SelectMemberPlan
                      name="memberPlanId"
                      label={t('giftCodeOffer.form.memberPlan')}
                      error={Boolean(error)}
                      helperText={error?.message}
                      defaultMemberPlan={memberPlan}
                      selectedMemberPlan={field.value || null}
                      setSelectedMemberPlan={id => {
                        field.onChange(id ?? '');
                        setValue('periodicity', null);
                        setValue('renewalPaymentMethodId', null);
                      }}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="periodicity"
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      select
                      name={field.name}
                      inputRef={field.ref}
                      onBlur={field.onBlur}
                      value={field.value ?? ''}
                      onChange={event => {
                        const chosen =
                          (event.target.value as PaymentPeriodicity) || null;
                        const renewalPaymentMethodId = getValues(
                          'renewalPaymentMethodId'
                        );

                        field.onChange(chosen);

                        if (
                          renewalPaymentMethodId &&
                          !renewalPaymentMethodsFor(chosen).has(
                            renewalPaymentMethodId
                          )
                        ) {
                          setValue('renewalPaymentMethodId', null);
                        }
                      }}
                      label={t('giftCodeOffer.form.periodicity')}
                      disabled={!memberPlanId}
                      error={Boolean(error)}
                      helperText={
                        error?.message ??
                        t('giftCodeOffer.form.periodicityHelp')
                      }
                      fullWidth
                    >
                      {periodicityOptions.map(option => (
                        <MenuItem
                          key={option}
                          value={option}
                        >
                          {t(`memberPlanList.paymentPeriodicity.${option}`)}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />

                {plan && currentPrice && (
                  <Typography variant="body2">
                    {t('giftCodeOffer.form.currentPrice', {
                      price: formatAmount(currentPrice.amount, plan.currency),
                    })}
                  </Typography>
                )}

                <Controller
                  control={control}
                  name="redemptionWindowMonths"
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      name={field.name}
                      inputRef={field.ref}
                      onBlur={field.onBlur}
                      value={field.value ?? ''}
                      type="number"
                      slotProps={{ htmlInput: { min: 1, step: 1 } }}
                      label={t('giftCodeOffer.form.redemptionWindowMonths')}
                      placeholder={t('giftCodeOffer.overview.unlimited')}
                      onChange={event =>
                        field.onChange(
                          event.target.value === '' ?
                            null
                          : Number(event.target.value)
                        )
                      }
                      error={Boolean(error)}
                      helperText={
                        error?.message ??
                        t('giftCodeOffer.form.redemptionWindowMonthsHelp')
                      }
                      fullWidth
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="paymentMethodIds"
                  render={({ field, fieldState: { error } }) => (
                    <Autocomplete
                      multiple
                      disableCloseOnSelect
                      options={[
                        ...paymentMethods.map(method => method.id),
                        ...field.value.filter(
                          id => !paymentMethodNames.has(id)
                        ),
                      ]}
                      getOptionLabel={id => paymentMethodNames.get(id) ?? id}
                      value={field.value}
                      onChange={(_event, ids) => field.onChange(ids)}
                      onBlur={field.onBlur}
                      renderInput={params => (
                        <TextField
                          {...params}
                          name={field.name}
                          inputRef={field.ref}
                          label={t('giftCodeOffer.form.paymentMethods')}
                          error={Boolean(error)}
                          helperText={
                            error?.message ??
                            t('giftCodeOffer.form.paymentMethodsHelp')
                          }
                        />
                      )}
                      fullWidth
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="issueBeforePayment"
                  render={({ field }) => (
                    <div>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={Boolean(field.value)}
                            onChange={(_event, checked) =>
                              field.onChange(checked)
                            }
                          />
                        }
                        label={t('giftCodeOffer.form.issueBeforePayment')}
                      />

                      <FormHelperText>
                        {t('giftCodeOffer.form.issueBeforePaymentHelp')}
                      </FormHelperText>
                    </div>
                  )}
                />

                <Controller
                  control={control}
                  name="allowDiscountCodes"
                  render={({ field }) => (
                    <div>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={Boolean(field.value)}
                            onChange={(_event, checked) =>
                              field.onChange(checked)
                            }
                          />
                        }
                        label={t('giftCodeOffer.form.allowDiscountCodes')}
                      />

                      <FormHelperText>
                        {t('giftCodeOffer.form.allowDiscountCodesHelp')}
                      </FormHelperText>
                    </div>
                  )}
                />

                <Controller
                  control={control}
                  name="autoRenew"
                  render={({ field }) => (
                    <div>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={Boolean(field.value)}
                            disabled={!canRenew && !field.value}
                            onChange={(_event, checked) => {
                              field.onChange(checked);

                              if (!checked) {
                                setValue('renewalPaymentMethodId', null);
                              }
                            }}
                          />
                        }
                        label={t('giftCodeOffer.form.autoRenew')}
                      />

                      <FormHelperText>
                        {canRenew ?
                          t('giftCodeOffer.form.autoRenewHelp')
                        : t('giftCodeOffer.form.autoRenewNotExtendable')}
                      </FormHelperText>
                    </div>
                  )}
                />

                {autoRenew && (
                  <Controller
                    control={control}
                    name="renewalPaymentMethodId"
                    render={({ field, fieldState: { error } }) => (
                      <TextField
                        select
                        name={field.name}
                        inputRef={field.ref}
                        onBlur={field.onBlur}
                        value={field.value ?? ''}
                        onChange={event =>
                          field.onChange(event.target.value || null)
                        }
                        label={t('giftCodeOffer.form.renewalPaymentMethod')}
                        disabled={!periodicity}
                        error={Boolean(error)}
                        helperText={
                          error?.message ??
                          t('giftCodeOffer.form.renewalPaymentMethodHelp')
                        }
                        fullWidth
                      >
                        {[...renewalPaymentMethods].map(([id, name]) => (
                          <MenuItem
                            key={id}
                            value={id}
                          >
                            {name}
                          </MenuItem>
                        ))}

                        {field.value &&
                          !renewalPaymentMethods.has(field.value) && (
                            <MenuItem value={field.value}>
                              {paymentMethodNames.get(field.value) ??
                                field.value}
                            </MenuItem>
                          )}
                      </TextField>
                    )}
                  />
                )}
              </Stack>
            </CardContent>
          </Card>
        </FormSection>
      </FormWrapper>

      <Drawer
        anchor="right"
        slotProps={{
          paper: {
            sx: {
              width: DRAWER_WIDTHS.sm,
              maxWidth: '100vw',
            },
          },
        }}
        open={isChooseModalOpen}
        onClose={() => setChooseModalOpen(false)}
      >
        <ImageSelectPanel
          onClose={() => setChooseModalOpen(false)}
          onSelect={pickImage}
        />
      </Drawer>

      {image && (
        <Drawer
          anchor="right"
          slotProps={{
            paper: {
              sx: {
                display: 'flex',
                flexDirection: 'column',
                width: DRAWER_WIDTHS.sm,
                maxWidth: '100vw',
              },
            },
          }}
          open={isEditModalOpen}
          onClose={() => setEditModalOpen(false)}
        >
          <ImageEditPanel
            id={image.id}
            onClose={() => setEditModalOpen(false)}
            onSave={() => setEditModalOpen(false)}
          />
        </Drawer>
      )}
    </>
  );
};
