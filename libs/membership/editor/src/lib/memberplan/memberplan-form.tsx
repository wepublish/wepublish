import { Dispatch, SetStateAction, useMemo, useState } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import {
  Currency,
  FullPaymentMethodFragment,
  FullImageFragment,
  ProductType,
  FullAvailablePaymentMethodFragment,
} from '@wepublish/editor/api';
import { MemberPlanFormValues } from './memberplan-schema';
import { useTranslation } from 'react-i18next';
import { slugify } from '@wepublish/utils';
import {
  ALL_PAYMENT_PERIODICITIES,
  ChooseEditImage,
  ImageEditPanel,
  ImageSelectPanel,
  InfoTooltip,
  ListInput,
  RichTextBlock,
  RichTextBlockValue,
  SelectPage,
  FormFields,
  FormSectionTitle,
  enqueueSnackbar,
  DRAWER_WIDTHS,
} from '@wepublish/ui/editor';
import { MdAutoFixHigh, MdCheck, MdExpandMore } from 'react-icons/md';
import { MemberPlanPricing } from './memberplan-pricing';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Autocomplete,
  Button,
  Card,
  CardContent,
  CardHeader,
  Drawer,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Grid,
  MenuItem,
  Switch,
  TextField,
} from '@mui/material';
import styled from '@emotion/styled';

const PanelWidth100 = styled(Card)`
  width: 100%;
`;

interface MemberPlanFormProps {
  memberPlanId?: string;
  paymentMethods: FullPaymentMethodFragment[];
  loading: boolean;
}

export function MemberPlanForm({
  memberPlanId,
  paymentMethods,
  loading,
}: MemberPlanFormProps) {
  const { t } = useTranslation();
  const [isChooseModalOpen, setChooseModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const { control, watch, setValue } = useFormContext<MemberPlanFormValues>();

  const availablePaymentMethods = useWatch({
    control,
    name: 'availablePaymentMethods',
  });
  const image = useWatch({ control, name: 'image' });
  const extendable = useWatch({ control, name: 'extendable' });
  const maxCount = useWatch({ control, name: 'maxCount' });

  const productType =
    useWatch({ control, name: 'productType' }) ?? ProductType.Subscription;
  const isDonationProduct = productType === ProductType.Donation;
  const maxCountLabel = t(
    isDonationProduct ?
      'memberplanForm.maxCountDonation'
    : 'memberplanForm.maxCount'
  );
  const maxCountHelpText = t(
    isDonationProduct ?
      'memberplanForm.maxCountDonationHelpText'
    : 'memberplanForm.maxCountHelpText'
  );

  const isTrialSubscription = !extendable && !!maxCount;

  const enabledPeriodicities = useMemo(() => {
    const enabled = new Set(
      availablePaymentMethods.flatMap(({ value }) => value.paymentPeriodicities)
    );

    return ALL_PAYMENT_PERIODICITIES.filter(periodicity =>
      enabled.has(periodicity)
    );
  }, [availablePaymentMethods]);

  function setExtendable(extendable: boolean, trialMaxCount?: number): void {
    // a subscription plan must be extendable if at least one payment methods requires auto renew
    const forcedAutoRenewPaymentMethods = !!availablePaymentMethods?.find(
      apm => apm.value.forceAutoRenewal
    );

    if (forcedAutoRenewPaymentMethods) {
      enqueueSnackbar(t('memberplanForm.trialSubscriptionNotPossible'), {
        variant: 'error',
        autoHideDuration: 6000,
      });

      return;
    }

    if (trialMaxCount != null) {
      setValue('maxCount', trialMaxCount);
    }

    setValue('extendable', extendable);
  }

  function setForceAutoRenewal(
    forceAutoRenewal: boolean,
    onChange: Dispatch<SetStateAction<FullAvailablePaymentMethodFragment>>,
    availablePaymentMethod: FullAvailablePaymentMethodFragment
  ): void {
    // if subscription plan ist not extendable, a subscription can not be forced to be auto-renew.
    if (!extendable && forceAutoRenewal) {
      enqueueSnackbar(t('memberplanForm.forceAutoRenewNotPossible'), {
        variant: 'error',
      });

      return;
    }

    onChange({ ...availablePaymentMethod, forceAutoRenewal });
  }

  return (
    <Grid
      container
      spacing={2}
    >
      <Grid size={{ xs: 6 }}>
        <PanelWidth100>
          <CardContent>
            <Grid
              container
              spacing={2}
            >
              <Grid size={{ xs: 12 }}>
                <FormLabel>{t('memberplanForm.productType')}</FormLabel>
                <Controller
                  control={control}
                  name="productType"
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      select
                      disabled={loading}
                      error={Boolean(error)}
                      helperText={error?.message}
                      fullWidth
                    >
                      <MenuItem
                        key={ProductType.Subscription}
                        value={ProductType.Subscription}
                      >
                        {t('memberplanForm.productTypeSubscription')}
                      </MenuItem>

                      <MenuItem
                        key={ProductType.Donation}
                        value={ProductType.Donation}
                      >
                        {t('memberplanForm.productTypeDonation')}
                      </MenuItem>
                    </TextField>
                  )}
                />
                <FormHelperText>
                  {t('memberplanForm.productTypeHelpText')}
                </FormHelperText>
              </Grid>

              <Grid size={{ xs: 6 }}>
                <ChooseEditImage
                  onSelect={(image: FullImageFragment) => {
                    setChooseModalOpen(false);
                    setValue('image', image);
                  }}
                  image={image}
                  disabled={loading}
                  openChooseModalOpen={() => setChooseModalOpen(true)}
                  openEditModalOpen={() => setEditModalOpen(true)}
                  removeImage={() => setValue('image', null)}
                />
              </Grid>

              <Grid size={{ xs: 6 }}>
                <Controller
                  control={control}
                  name="active"
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Switch
                          {...field}
                          checked={field.value}
                          disabled={loading}
                        />
                      }
                      label={t('memberPlanEdit.active')}
                    />
                  )}
                />
                <FormHelperText>
                  {t('memberPlanEdit.activeDescription')}
                </FormHelperText>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Grid
                  container
                  spacing={2}
                >
                  <Grid size={{ xs: 6 }}>
                    <FormLabel>{t('memberPlanEdit.name')}</FormLabel>
                    <Controller
                      control={control}
                      name="name"
                      render={({ field, fieldState: { error } }) => (
                        <TextField
                          {...field}
                          onChange={event => {
                            field.onChange(event);

                            if (!memberPlanId) {
                              setValue('slug', slugify(event.target.value));
                            }
                          }}
                          error={Boolean(error)}
                          helperText={error?.message}
                          fullWidth
                        />
                      )}
                    />
                  </Grid>

                  <Grid size={{ xs: 6 }}>
                    <FormLabel>
                      {t('memberPlanEdit.slug')}{' '}
                      <InfoTooltip text={t('memberPlanEdit.slugHelp')} />
                    </FormLabel>
                    <Controller
                      control={control}
                      name="slug"
                      render={({ field, fieldState: { error } }) => (
                        <TextField
                          {...field}
                          onChange={event =>
                            field.onChange(slugify(event.target.value || ''))
                          }
                          error={Boolean(error)}
                          helperText={error?.message}
                          fullWidth
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <FormLabel>
                  {t('memberPlanEdit.description')}{' '}
                  <InfoTooltip text={t('memberPlanEdit.descriptionHelp')} />
                </FormLabel>

                <Controller
                  control={control}
                  name="description"
                  render={({ field }) => (
                    <RichTextBlock
                      value={field.value}
                      disabled={loading}
                      onChange={value =>
                        field.onChange(
                          (value as RichTextBlockValue['richText']) ?? null
                        )
                      }
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <FormLabel>
                  {t('memberPlanEdit.shortDescription')}{' '}
                  <InfoTooltip
                    text={t('memberPlanEdit.shortDescriptionHelp')}
                  />
                </FormLabel>

                <Controller
                  control={control}
                  name="shortDescription"
                  render={({ field }) => (
                    <RichTextBlock
                      value={field.value}
                      disabled={loading}
                      onChange={value =>
                        field.onChange(
                          (value as RichTextBlockValue['richText']) ?? null
                        )
                      }
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <FormLabel>{t('memberPlanEdit.externalReward')}</FormLabel>

                <Controller
                  control={control}
                  name="externalReward"
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      value={field.value ?? ''}
                      error={Boolean(error)}
                      helperText={error?.message}
                      fullWidth
                    />
                  )}
                />
              </Grid>
            </Grid>
          </CardContent>
        </PanelWidth100>
      </Grid>

      <Grid size={{ xs: 6 }}>
        <Card>
          <CardHeader title={t('memberplanForm.trialSubscription')} />

          <CardContent>
            <FormFields>
              <div>
                {isTrialSubscription ?
                  <Alert
                    icon={<MdCheck />}
                    severity="success"
                  >
                    {t('memberplanForm.trialMemberplanAlert')}
                  </Alert>
                : <>
                    <Button
                      variant="outlined"
                      startIcon={<MdAutoFixHigh />}
                      onClick={() => setExtendable(false, 1)}
                      disabled={isTrialSubscription}
                      color="success"
                    >
                      {t('memberplanForm.configureTrialBtn')}
                    </Button>{' '}
                    <InfoTooltip
                      text={t('memberplanForm.configureTrialHelp')}
                    />
                  </>
                }
              </div>

              <div>
                <FormControlLabel
                  control={
                    <Switch
                      checked={extendable}
                      onChange={(_event, extendable) =>
                        setExtendable(extendable)
                      }
                    />
                  }
                  label={
                    <>
                      {t('memberplanForm.extendableToggle')}{' '}
                      <InfoTooltip
                        text={t('memberplanForm.extendableHelpText')}
                      />
                    </>
                  }
                />
              </div>

              <div>
                <FormLabel>
                  {maxCountLabel} <InfoTooltip text={maxCountHelpText} />
                </FormLabel>
                <Controller
                  control={control}
                  name="maxCount"
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      value={field.value ?? ''}
                      placeholder={maxCountLabel}
                      type={'number'}
                      slotProps={{ htmlInput: { min: 0 } }}
                      onChange={event =>
                        field.onChange(Number(event.target.value) || null)
                      }
                      error={Boolean(error)}
                      helperText={error?.message}
                      fullWidth
                    />
                  )}
                />
              </div>

              <div>
                <FormLabel>{t('memberPlanEdit.tags')}</FormLabel>
                <Controller
                  control={control}
                  name="tags"
                  render={({ field }) => (
                    <Autocomplete
                      multiple
                      freeSolo
                      disabled={loading}
                      options={field.value}
                      value={field.value}
                      onChange={(_event, tags) => field.onChange(tags)}
                      renderInput={params => <TextField {...params} />}
                    />
                  )}
                />
              </div>

              <div>
                <FormLabel>
                  {t('memberplanForm.migratePMTitle')}{' '}
                  <InfoTooltip text={t('memberplanForm.migratePMHelptext')} />
                </FormLabel>
                <Controller
                  control={control}
                  name="migrateToTargetPaymentMethodID"
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      select
                      value={field.value ?? ''}
                      disabled={loading}
                      onChange={event =>
                        field.onChange(event.target.value || null)
                      }
                      error={Boolean(error)}
                      helperText={error?.message}
                      fullWidth
                    >
                      {paymentMethods.map(pm => (
                        <MenuItem
                          key={pm.id}
                          value={pm.id}
                        >
                          {pm.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </div>

              <FormSectionTitle>
                {t('memberplanForm.redirectionsTitle')}
              </FormSectionTitle>

              <div>
                <FormLabel>{t('memberPlanEdit.successPage')}</FormLabel>
                <Controller
                  control={control}
                  name="successPageId"
                  render={({ field }) => (
                    <SelectPage
                      setSelectedPage={field.onChange}
                      selectedPage={field.value}
                      name={field.name}
                    />
                  )}
                />
              </div>

              <div>
                <FormLabel>{t('memberPlanEdit.failPage')}</FormLabel>
                <Controller
                  control={control}
                  name="failPageId"
                  render={({ field }) => (
                    <SelectPage
                      setSelectedPage={field.onChange}
                      selectedPage={field.value}
                      name={field.name}
                    />
                  )}
                />
              </div>

              <div>
                <FormLabel>
                  {t('memberplanForm.confirmationPage')}{' '}
                  <InfoTooltip
                    text={t('memberplanForm.confirmationPageHelptext')}
                  />
                </FormLabel>
                <Controller
                  control={control}
                  name="confirmationPageId"
                  render={({ field }) => (
                    <SelectPage
                      setSelectedPage={field.onChange}
                      selectedPage={field.value}
                      name={field.name}
                    />
                  )}
                />
              </div>
            </FormFields>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12 }}>
        <PanelWidth100>
          <CardHeader title={t('memberPlanEdit.paymentConfigs')} />

          <CardContent>
            <Grid
              container
              spacing={2}
            >
              <Grid size={{ xs: 6 }}>
                <FormFields>
                  <div>
                    <FormLabel>{t('memberPlanEdit.currency')}</FormLabel>
                    <Controller
                      control={control}
                      name="currency"
                      render={({ field, fieldState: { error } }) => (
                        <TextField
                          {...field}
                          select
                          disabled={loading}
                          error={Boolean(error)}
                          helperText={error?.message}
                          fullWidth
                        >
                          <MenuItem
                            key={Currency.Chf}
                            value={Currency.Chf}
                          >
                            {Currency.Chf}
                          </MenuItem>

                          <MenuItem
                            key={Currency.Eur}
                            value={Currency.Eur}
                          >
                            {Currency.Eur}
                          </MenuItem>
                        </TextField>
                      )}
                    />
                  </div>

                  <div>
                    <FormLabel>
                      {t('memberplanForm.defaultPaymentPeriodicity')}
                    </FormLabel>
                    <Controller
                      control={control}
                      name="defaultPaymentPeriodicity"
                      render={({ field, fieldState: { error } }) => (
                        <TextField
                          {...field}
                          select
                          value={field.value ?? ''}
                          disabled={loading}
                          error={Boolean(error)}
                          helperText={error?.message}
                          fullWidth
                        >
                          {enabledPeriodicities.map(periodicity => (
                            <MenuItem
                              key={periodicity}
                              value={periodicity}
                            >
                              {t(
                                `memberPlanList.paymentPeriodicity.${periodicity}`
                              )}
                            </MenuItem>
                          ))}
                        </TextField>
                      )}
                    />
                    <FormHelperText>
                      {t('memberplanForm.defaultPaymentPeriodicityHelpText')}
                    </FormHelperText>
                  </div>
                </FormFields>
              </Grid>

              <Grid size={{ xs: 6 }}>
                <FormLabel>{t('memberPlanList.paymentMethods')}</FormLabel>
                <Controller
                  control={control}
                  name="availablePaymentMethods"
                  render={({ field }) => (
                    <ListInput
                      value={field.value}
                      disabled={loading}
                      onChange={field.onChange}
                      defaultValue={{
                        __typename: 'AvailablePaymentMethod',
                        forceAutoRenewal: false,
                        paymentPeriodicities: [],
                        paymentMethods: [],
                      }}
                    >
                      {({ value, onChange }) => (
                        <Accordion style={{ width: '100%' }}>
                          <AccordionSummary expandIcon={<MdExpandMore />}>
                            {t('memberPlanEdit.editPaymentSetting')}
                          </AccordionSummary>

                          <AccordionDetails>
                            <Grid
                              container
                              spacing={2}
                            >
                              <Grid size={{ xs: 12 }}>
                                <FormControlLabel
                                  control={
                                    <Switch
                                      checked={value.forceAutoRenewal}
                                      disabled={loading}
                                      onChange={(_event, forceAutoRenewal) =>
                                        setForceAutoRenewal(
                                          forceAutoRenewal,
                                          onChange,
                                          value
                                        )
                                      }
                                    />
                                  }
                                  label={
                                    <>
                                      {t('memberPlanEdit.forceAutoRenewal')}{' '}
                                      <InfoTooltip
                                        text={t(
                                          'memberPlanEdit.forceAutoRenewalHelp'
                                        )}
                                      />
                                    </>
                                  }
                                />
                              </Grid>

                              <Grid size={{ xs: 12 }}>
                                <FormLabel>
                                  {t('memberPlanList.paymentPeriodicities')}
                                </FormLabel>
                                <Autocomplete
                                  multiple
                                  disableCloseOnSelect
                                  options={ALL_PAYMENT_PERIODICITIES}
                                  getOptionLabel={periodicity =>
                                    t(
                                      `memberPlanList.paymentPeriodicity.${periodicity}`
                                    )
                                  }
                                  value={value.paymentPeriodicities}
                                  onChange={(_event, paymentPeriodicities) =>
                                    onChange({
                                      ...value,
                                      paymentPeriodicities,
                                    })
                                  }
                                  renderInput={params => (
                                    <TextField {...params} />
                                  )}
                                />
                              </Grid>

                              <Grid size={{ xs: 12 }}>
                                <FormLabel>
                                  {t('memberPlanList.paymentMethods')}
                                </FormLabel>
                                <Autocomplete
                                  multiple
                                  disableCloseOnSelect
                                  options={paymentMethods.map(pm => pm.id)}
                                  getOptionLabel={option =>
                                    paymentMethods
                                      .filter(pm => pm.id === option)
                                      .map(pm => pm.name)[0] ?? option
                                  }
                                  value={value.paymentMethods.map(pm => pm.id)}
                                  onChange={(_event, paymentMethodIDs) => {
                                    onChange({
                                      ...value,
                                      paymentMethods: paymentMethodIDs
                                        .map(pmID =>
                                          paymentMethods.find(
                                            pm => pm.id === pmID
                                          )
                                        )
                                        .filter(pm => pm !== undefined),
                                    });
                                  }}
                                  renderInput={params => (
                                    <TextField {...params} />
                                  )}
                                />
                              </Grid>
                            </Grid>
                          </AccordionDetails>
                        </Accordion>
                      )}
                    </ListInput>
                  )}
                />
              </Grid>
            </Grid>
          </CardContent>
        </PanelWidth100>
      </Grid>

      {/* pricing */}
      <Grid size={{ xs: 12 }}>
        <MemberPlanPricing loading={loading} />
      </Grid>

      {/* image upload and selection */}
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
          onSelect={(image: FullImageFragment) => {
            setChooseModalOpen(false);
            setValue('image', image);
          }}
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
    </Grid>
  );
}
