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
  z.object({
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
    imageID: z.string().nullish(),
    image: z.custom<FullImageFragment>().nullish(),
  });

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

type PricingRow = Pick<
  FullMemberPlanFragment['periodicityPricing'][number],
  'periodicity' | 'amountMin' | 'amountTarget'
>;

const priceOf = (row: PricingRow) => row.amountTarget ?? row.amountMin;

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
  const { control, setValue } = useFormContext<GiftCodeOfferFormValues>();
  const [isChooseModalOpen, setChooseModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);

  const memberPlanId = useWatch({ control, name: 'memberPlanId' });
  const memberPlan = useWatch({ control, name: 'memberPlan' });
  const periodicity = useWatch({ control, name: 'periodicity' });
  const image = useWatch({ control, name: 'image' });

  const { data: planData } = useQuery(MemberPlanDocument, {
    variables: { id: memberPlanId },
    skip: !memberPlanId,
  });
  const { data: paymentMethodData } = useQuery(PaymentMethodListDocument);

  const plan = memberPlanId ? planData?.memberPlan : undefined;

  const pricedRows = useMemo(
    () =>
      (plan?.periodicityPricing ?? []).filter(row => (priceOf(row) ?? 0) > 0),
    [plan]
  );

  const periodicityOptions = useMemo(() => {
    const options = pricedRows.map(row => row.periodicity);

    return periodicity && !options.includes(periodicity) ?
        [...options, periodicity]
      : options;
  }, [pricedRows, periodicity]);

  const currentPriceRow = pricedRows.find(
    row => row.periodicity === periodicity
  );

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
                      onChange={event =>
                        field.onChange(
                          (event.target.value as PaymentPeriodicity) || null
                        )
                      }
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

                {plan && currentPriceRow && (
                  <Typography variant="body2">
                    {t('giftCodeOffer.form.currentPrice', {
                      price: formatAmount(
                        priceOf(currentPriceRow) ?? 0,
                        plan.currency
                      ),
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

                <FormControlLabel
                  control={
                    <Controller
                      control={control}
                      name="active"
                      render={({ field }) => (
                        <Checkbox
                          checked={Boolean(field.value)}
                          onChange={(_event, active) => field.onChange(active)}
                        />
                      )}
                    />
                  }
                  label={t('giftCodeOffer.form.active')}
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
