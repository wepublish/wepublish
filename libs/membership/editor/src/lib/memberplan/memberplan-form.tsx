import {
  Dispatch,
  SetStateAction,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
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
import { FieldLabel } from '../field-label';
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

const InlineRow = styled('div')`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(0.5)};
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
  const trialAlertRef = useRef<HTMLDivElement>(null);
  const focusTrialAlert = useRef(false);

  useEffect(() => {
    if (isTrialSubscription && focusTrialAlert.current) {
      focusTrialAlert.current = false;
      trialAlertRef.current?.focus();
    }
  }, [isTrialSubscription]);

  const fieldId = useId();
  const ids = {
    productType: `${fieldId}-product-type`,
    activeHelp: `${fieldId}-active-help`,
    name: `${fieldId}-name`,
    slug: `${fieldId}-slug`,
    description: `${fieldId}-description`,
    shortDescription: `${fieldId}-short-description`,
    externalReward: `${fieldId}-external-reward`,
    maxCount: `${fieldId}-max-count`,
    tags: `${fieldId}-tags`,
    migrate: `${fieldId}-migrate`,
    successPage: `${fieldId}-success-page`,
    failPage: `${fieldId}-fail-page`,
    confirmationPage: `${fieldId}-confirmation-page`,
    currency: `${fieldId}-currency`,
    defaultPeriodicity: `${fieldId}-default-periodicity`,
    paymentMethods: `${fieldId}-payment-methods`,
  };

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
      <Grid size={{ xs: 12, md: 6 }}>
        <PanelWidth100>
          <CardContent>
            <Grid
              container
              spacing={2}
            >
              <Grid size={{ xs: 12 }}>
                <FieldLabel
                  id={ids.productType}
                  label={t('memberplanForm.productType')}
                />
                <Controller
                  control={control}
                  name="productType"
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      select
                      disabled={loading}
                      error={Boolean(error)}
                      helperText={
                        error?.message ??
                        t('memberplanForm.productTypeHelpText')
                      }
                      slotProps={{ select: { labelId: ids.productType } }}
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
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
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

              <Grid size={{ xs: 12, sm: 6 }}>
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
                          slotProps={{
                            input: { 'aria-describedby': ids.activeHelp },
                          }}
                        />
                      }
                      label={t('memberPlanEdit.active')}
                    />
                  )}
                />
                <FormHelperText id={ids.activeHelp}>
                  {t('memberPlanEdit.activeDescription')}
                </FormHelperText>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Grid
                  container
                  spacing={2}
                >
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FieldLabel
                      id={ids.name}
                      label={t('memberPlanEdit.name')}
                    />
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
                          slotProps={{
                            htmlInput: { 'aria-labelledby': ids.name },
                          }}
                          fullWidth
                        />
                      )}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FieldLabel
                      id={ids.slug}
                      label={t('memberPlanEdit.slug')}
                      help={t('memberPlanEdit.slugHelp')}
                    />
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
                          slotProps={{
                            htmlInput: { 'aria-labelledby': ids.slug },
                          }}
                          fullWidth
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <FieldLabel
                  id={ids.description}
                  label={t('memberPlanEdit.description')}
                  help={t('memberPlanEdit.descriptionHelp')}
                />

                <Controller
                  control={control}
                  name="description"
                  render={({ field }) => (
                    <RichTextBlock
                      aria-labelledby={ids.description}
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
                <FieldLabel
                  id={ids.shortDescription}
                  label={t('memberPlanEdit.shortDescription')}
                  help={t('memberPlanEdit.shortDescriptionHelp')}
                />

                <Controller
                  control={control}
                  name="shortDescription"
                  render={({ field }) => (
                    <RichTextBlock
                      aria-labelledby={ids.shortDescription}
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
                <FieldLabel
                  id={ids.externalReward}
                  label={t('memberPlanEdit.externalReward')}
                />

                <Controller
                  control={control}
                  name="externalReward"
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      value={field.value ?? ''}
                      error={Boolean(error)}
                      helperText={error?.message}
                      slotProps={{
                        htmlInput: { 'aria-labelledby': ids.externalReward },
                      }}
                      fullWidth
                    />
                  )}
                />
              </Grid>
            </Grid>
          </CardContent>
        </PanelWidth100>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Card>
          <CardHeader
            title={t('memberplanForm.trialSubscription')}
            slotProps={{ title: { component: 'h2' } }}
          />

          <CardContent>
            <FormFields>
              <div>
                {isTrialSubscription ?
                  <Alert
                    ref={trialAlertRef}
                    tabIndex={-1}
                    icon={<MdCheck />}
                    severity="success"
                  >
                    {t('memberplanForm.trialMemberplanAlert')}
                  </Alert>
                : <>
                    <Button
                      variant="outlined"
                      startIcon={<MdAutoFixHigh />}
                      onClick={() => {
                        focusTrialAlert.current = true;
                        setExtendable(false, 1);
                      }}
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

              <InlineRow>
                <FormControlLabel
                  sx={{ marginRight: 0 }}
                  control={
                    <Switch
                      checked={extendable}
                      onChange={(_event, extendable) =>
                        setExtendable(extendable)
                      }
                    />
                  }
                  label={t('memberplanForm.extendableToggle')}
                />
                <InfoTooltip text={t('memberplanForm.extendableHelpText')} />
              </InlineRow>

              <div>
                <FieldLabel
                  id={ids.maxCount}
                  label={maxCountLabel}
                  help={maxCountHelpText}
                />
                <Controller
                  control={control}
                  name="maxCount"
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      value={field.value ?? ''}
                      type={'number'}
                      slotProps={{
                        htmlInput: { min: 0, 'aria-labelledby': ids.maxCount },
                      }}
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
                <FieldLabel
                  id={ids.tags}
                  label={t('memberPlanEdit.tags')}
                />
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
                      renderInput={params => (
                        <TextField
                          {...params}
                          slotProps={{
                            ...params.slotProps,
                            htmlInput: {
                              ...params.slotProps.htmlInput,
                              'aria-labelledby': ids.tags,
                            },
                          }}
                        />
                      )}
                    />
                  )}
                />
              </div>

              <div>
                <FieldLabel
                  id={ids.migrate}
                  label={t('memberplanForm.migratePMTitle')}
                  help={t('memberplanForm.migratePMHelptext')}
                />
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
                      slotProps={{ select: { labelId: ids.migrate } }}
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
                <FieldLabel
                  id={ids.successPage}
                  label={t('memberPlanEdit.successPage')}
                />
                <Controller
                  control={control}
                  name="successPageId"
                  render={({ field }) => (
                    <SelectPage
                      aria-labelledby={ids.successPage}
                      setSelectedPage={field.onChange}
                      selectedPage={field.value}
                      name={field.name}
                    />
                  )}
                />
              </div>

              <div>
                <FieldLabel
                  id={ids.failPage}
                  label={t('memberPlanEdit.failPage')}
                />
                <Controller
                  control={control}
                  name="failPageId"
                  render={({ field }) => (
                    <SelectPage
                      aria-labelledby={ids.failPage}
                      setSelectedPage={field.onChange}
                      selectedPage={field.value}
                      name={field.name}
                    />
                  )}
                />
              </div>

              <div>
                <FieldLabel
                  id={ids.confirmationPage}
                  label={t('memberplanForm.confirmationPage')}
                  help={t('memberplanForm.confirmationPageHelptext')}
                />
                <Controller
                  control={control}
                  name="confirmationPageId"
                  render={({ field }) => (
                    <SelectPage
                      aria-labelledby={ids.confirmationPage}
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
          <CardHeader
            title={t('memberPlanEdit.paymentConfigs')}
            slotProps={{ title: { component: 'h2' } }}
          />

          <CardContent>
            <Grid
              container
              spacing={2}
            >
              <Grid size={{ xs: 12, md: 6 }}>
                <FormFields>
                  <div>
                    <FieldLabel
                      id={ids.currency}
                      label={t('memberPlanEdit.currency')}
                    />
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
                          slotProps={{ select: { labelId: ids.currency } }}
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
                    <FieldLabel
                      id={ids.defaultPeriodicity}
                      label={t('memberplanForm.defaultPaymentPeriodicity')}
                    />
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
                          helperText={
                            error?.message ??
                            t(
                              'memberplanForm.defaultPaymentPeriodicityHelpText'
                            )
                          }
                          slotProps={{
                            select: { labelId: ids.defaultPeriodicity },
                          }}
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
                  </div>
                </FormFields>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <FieldLabel
                  id={ids.paymentMethods}
                  label={t('memberPlanList.paymentMethods')}
                />
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
                              <InlineRow>
                                <FormControlLabel
                                  sx={{ marginRight: 0 }}
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
                                  label={t('memberPlanEdit.forceAutoRenewal')}
                                />
                                <InfoTooltip
                                  text={t(
                                    'memberPlanEdit.forceAutoRenewalHelp'
                                  )}
                                />
                              </InlineRow>

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
                                    <TextField
                                      {...params}
                                      slotProps={{
                                        ...params.slotProps,
                                        htmlInput: {
                                          ...params.slotProps.htmlInput,
                                          'aria-label': t(
                                            'memberPlanList.paymentPeriodicities'
                                          ),
                                        },
                                      }}
                                    />
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
                                    <TextField
                                      {...params}
                                      slotProps={{
                                        ...params.slotProps,
                                        htmlInput: {
                                          ...params.slotProps.htmlInput,
                                          'aria-label': t(
                                            'memberPlanList.paymentMethods'
                                          ),
                                        },
                                      }}
                                    />
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
