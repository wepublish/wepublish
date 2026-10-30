import styled from '@emotion/styled';
import { PaymentPeriodicity } from '@wepublish/editor/api';
import { useMemo, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  enabledPeriodicitiesOf,
  materializePricing,
  MemberPlanFormValues,
  PeriodicityPriceValue,
} from './memberplan-schema';
import { MdPriceCheck } from 'react-icons/md';
import {
  CurrencyInput,
  InfoTooltip,
  PAYMENT_PERIODICITY_MONTHS,
} from '@wepublish/ui/editor';
import {
  Card,
  CardContent,
  CardHeader,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Grid,
  Switch,
  Tab,
  Tabs,
  TextField,
} from '@mui/material';

const TAB_PERIODICITY_ORDER = [
  PaymentPeriodicity.Monthly,
  PaymentPeriodicity.Quarterly,
  PaymentPeriodicity.Biannual,
  PaymentPeriodicity.Yearly,
  PaymentPeriodicity.Biennial,
  PaymentPeriodicity.Lifetime,
];

const PanelWidth100 = styled(Card)`
  width: 100%;
`;

const ToggleCol = styled(Grid)`
  text-align: end;
`;

// keeps the row height stable while switching between tabs
const ToggleColReserved = styled(ToggleCol)`
  visibility: hidden;
`;

const TabContent = styled('div')`
  padding-top: 12px;
`;

const RowPaddingTop = styled(Grid)`
  padding-top: 12px;
`;

const ErrorHelpText = styled(FormHelperText)`
  color: ${({ theme }) => theme.vars.palette.error.main};
`;

function derivePeriodAmount(
  monthlyAmount: number | null | undefined,
  periodicity: PaymentPeriodicity
): number | null {
  if (monthlyAmount == null) {
    return null;
  }

  return Math.round(monthlyAmount * PAYMENT_PERIODICITY_MONTHS[periodicity]);
}

function formatDelta(delta: number, derived: number, currency: string): string {
  const percent = derived > 0 ? ((delta / derived) * 100).toFixed(1) : '0';

  return `${delta >= 0 ? '−' : '+'} ${currency} ${(Math.abs(delta) / 100).toFixed(2)} (${percent}%)`;
}

interface MemberPlanPricingProps {
  loading: boolean;
}

export function MemberPlanPricing({ loading }: MemberPlanPricingProps) {
  const { t } = useTranslation();
  const {
    control,
    setValue,
    formState: { errors },
  } = useFormContext<MemberPlanFormValues>();

  const currency = useWatch({ control, name: 'currency' }) ?? 'CHF';
  const availablePaymentMethods = useWatch({
    control,
    name: 'availablePaymentMethods',
  });
  const storedPricing = useWatch({ control, name: 'periodicityPricing' });
  const [activeTab, setActiveTab] = useState<PaymentPeriodicity | null>(null);

  const enabledPeriodicities = useMemo(
    () =>
      enabledPeriodicitiesOf(availablePaymentMethods, TAB_PERIODICITY_ORDER),
    [availablePaymentMethods]
  );

  const monthlyEnabled = enabledPeriodicities.includes(
    PaymentPeriodicity.Monthly
  );

  const pricing: PeriodicityPriceValue[] = useMemo(
    () => materializePricing(storedPricing ?? [], enabledPeriodicities),
    [storedPricing, enabledPeriodicities]
  );

  const periodicity =
    activeTab && enabledPeriodicities.includes(activeTab) ?
      activeTab
    : enabledPeriodicities[0];

  function setPeriodicityPrice(
    price: Omit<PeriodicityPriceValue, 'periodicity'> | null
  ) {
    const withoutPeriodicity = pricing.filter(
      p => p.periodicity !== periodicity
    );

    const isEmpty =
      !price ||
      (price.label == null &&
        price.amountMin == null &&
        price.amountTarget == null &&
        price.amountMax == null);

    setValue(
      'periodicityPricing',
      !isEmpty ?
        [...withoutPeriodicity, { periodicity, ...price }]
      : withoutPeriodicity,
      { shouldValidate: true }
    );
  }

  if (!enabledPeriodicities.length) {
    return (
      <PanelWidth100>
        <CardContent>
          <CardHeader title={t('memberplanForm.periodicityPricing')} />

          <CardContent>
            <FormHelperText>
              {t('memberplanForm.periodicityPricingNoPeriodicities')}
            </FormHelperText>
          </CardContent>
        </CardContent>
      </PanelWidth100>
    );
  }

  const isMonthlyTab = periodicity === PaymentPeriodicity.Monthly;
  const monthlyRow = pricing.find(
    p => p.periodicity === PaymentPeriodicity.Monthly
  );
  const monthlyPriced = monthlyRow?.amountMin != null;
  const override = pricing.find(p => p.periodicity === periodicity);
  const derivedMin = derivePeriodAmount(
    monthlyRow?.amountMin ?? 0,
    periodicity
  );
  const derivedTarget = derivePeriodAmount(
    monthlyRow?.amountTarget,
    periodicity
  );
  const derivedMax = derivePeriodAmount(monthlyRow?.amountMax, periodicity);
  const showDeriveToggle = !isMonthlyTab && monthlyEnabled && monthlyPriced;
  const ToggleWrapper = showDeriveToggle ? ToggleCol : ToggleColReserved;
  const hasOverride = override?.amountMin != null;
  const fieldsEditable = isMonthlyTab || !showDeriveToggle || hasOverride;
  const overrideBase: Omit<PeriodicityPriceValue, 'periodicity'> =
    hasOverride ? override : (
      {
        __typename: 'PeriodicityPrice',
        label: override?.label ?? null,
        amountMin: derivedMin ?? 0,
        amountTarget: derivedTarget,
        amountMax: derivedMax,
      }
    );

  const shownMin = override?.amountMin ?? derivedMin ?? 0;
  const shownTarget =
    hasOverride ? (override?.amountTarget ?? null) : derivedTarget;
  const shownMax = hasOverride ? (override?.amountMax ?? null) : derivedMax;
  const targetInvalid =
    shownTarget != null &&
    (shownTarget < shownMin || (shownMax != null && shownTarget > shownMax));
  const maxInvalid = shownMax != null && shownMax < shownMin;

  function setPeriodicityLabel(label: string | null) {
    setPeriodicityPrice({
      __typename: 'PeriodicityPrice',
      amountMin: override?.amountMin ?? null,
      amountTarget: override?.amountTarget ?? null,
      amountMax: override?.amountMax ?? null,
      label,
    });
  }

  const referenceDerived = derivedTarget ?? derivedMin;
  const referenceOverride =
    hasOverride ?
      (override?.amountTarget ?? override?.amountMin ?? null)
    : null;
  const delta =
    referenceDerived != null && referenceOverride != null ?
      referenceDerived - referenceOverride
    : null;

  return (
    <PanelWidth100>
      <CardContent>
        <CardHeader title={t('memberplanForm.periodicityPricing')} />

        <CardContent>
          <FormHelperText>
            {t(
              monthlyEnabled ?
                'memberplanForm.periodicityPricingHelpText'
              : 'memberplanForm.periodicityPricingHelpTextNoMonthly'
            )}
          </FormHelperText>

          {errors.periodicityPricing?.message && (
            <ErrorHelpText>
              {errors.periodicityPricing.message as string}
            </ErrorHelpText>
          )}

          <Tabs
            value={periodicity}
            onChange={(_event, eventKey) =>
              setActiveTab(eventKey as PaymentPeriodicity)
            }
          >
            {enabledPeriodicities.map(tabPeriodicity => (
              <Tab
                key={tabPeriodicity}
                value={tabPeriodicity}
                icon={
                  (
                    monthlyEnabled &&
                    tabPeriodicity !== PaymentPeriodicity.Monthly &&
                    pricing.some(
                      p =>
                        p.periodicity === tabPeriodicity && p.amountMin != null
                    )
                  ) ?
                    <MdPriceCheck />
                  : undefined
                }
                iconPosition="start"
                label={
                  <>
                    {t(`memberPlanList.paymentPeriodicity.${tabPeriodicity}`)}
                  </>
                }
              />
            ))}
          </Tabs>

          <TabContent>
            {monthlyEnabled && (
              <Grid
                container
                spacing={2}
              >
                <Grid size={{ xs: 9 }}>
                  {delta != null && delta !== 0 && referenceDerived != null && (
                    <FormHelperText>
                      {t('memberplanForm.periodicityPricingDelta', {
                        delta: formatDelta(delta, referenceDerived, currency),
                      })}
                    </FormHelperText>
                  )}
                </Grid>

                <ToggleWrapper size={{ xs: 3 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={hasOverride}
                        disabled={loading}
                        onChange={(_event, enabled) =>
                          setPeriodicityPrice(
                            enabled ?
                              {
                                __typename: 'PeriodicityPrice',
                                label: override?.label ?? null,
                                amountMin: derivedMin ?? 0,
                                amountTarget: derivedTarget,
                                amountMax: derivedMax,
                              }
                            : {
                                __typename: 'PeriodicityPrice',
                                label: override?.label ?? null,
                                amountMin: null,
                                amountTarget: null,
                                amountMax: null,
                              }
                          )
                        }
                      />
                    }
                    label={
                      <>
                        {t('memberplanForm.periodicityPricingCustom')}{' '}
                        <InfoTooltip
                          text={t(
                            'memberplanForm.periodicityPricingCustomHelp'
                          )}
                        />
                      </>
                    }
                  />
                </ToggleWrapper>
              </Grid>
            )}

            <Grid
              container
              spacing={2}
            >
              <Grid size={{ xs: 4 }}>
                <FormLabel>
                  {t(
                    isMonthlyTab ?
                      'memberPlanEdit.amountPerMonthMin'
                    : 'memberplanForm.periodicityPricingMin'
                  )}{' '}
                  <InfoTooltip
                    text={t('memberplanForm.periodicityPricingMinHelpText')}
                  />
                </FormLabel>
                <CurrencyInput
                  name={`periodicityPricing.${periodicity}.amountMin`}
                  currency={currency}
                  centAmount={shownMin}
                  disabled={loading || !fieldsEditable}
                  onChange={centAmount => {
                    setPeriodicityPrice({
                      ...overrideBase,
                      amountMin: Math.round(centAmount || 0),
                    });
                  }}
                />
              </Grid>

              <Grid size={{ xs: 4 }}>
                <FormLabel>
                  {t(
                    isMonthlyTab ?
                      'memberplanForm.amountPerMonthTarget'
                    : 'memberplanForm.periodicityPricingTarget'
                  )}{' '}
                  <InfoTooltip
                    text={t('memberplanForm.periodicityPricingTargetHelpText')}
                  />
                </FormLabel>
                <CurrencyInput
                  name={`periodicityPricing.${periodicity}.amountTarget`}
                  currency={currency}
                  centAmount={shownTarget}
                  disabled={loading || !fieldsEditable}
                  onChange={centAmount => {
                    setPeriodicityPrice({
                      ...overrideBase,
                      amountTarget:
                        centAmount != null ? Math.round(centAmount) : null,
                    });
                  }}
                />
                {targetInvalid && (
                  <ErrorHelpText>
                    {t('memberPlanEdit.targetPriceMustBeGreaterThanMin')}
                  </ErrorHelpText>
                )}
              </Grid>

              <Grid size={{ xs: 4 }}>
                <FormLabel>
                  {t(
                    isMonthlyTab ?
                      'memberPlanEdit.amountPerMonthMax'
                    : 'memberplanForm.periodicityPricingMax'
                  )}{' '}
                  <InfoTooltip
                    text={t('memberplanForm.periodicityPricingMaxHelpText')}
                  />
                </FormLabel>
                <CurrencyInput
                  name={`periodicityPricing.${periodicity}.amountMax`}
                  currency={currency}
                  centAmount={shownMax}
                  disabled={loading || !fieldsEditable}
                  onChange={centAmount => {
                    setPeriodicityPrice({
                      ...overrideBase,
                      amountMax:
                        centAmount != null ? Math.round(centAmount) : null,
                    });
                  }}
                />
                {maxInvalid && (
                  <ErrorHelpText>
                    {t('memberPlanEdit.maxPriceMustBeGreaterThanMin')}
                  </ErrorHelpText>
                )}
              </Grid>
            </Grid>

            <RowPaddingTop>
              <Grid size={{ xs: 6 }}>
                <FormLabel>
                  {t('memberplanForm.periodicityPricingLabel')}
                </FormLabel>
                <TextField
                  value={override?.label ?? ''}
                  disabled={loading}
                  slotProps={{ htmlInput: { maxLength: 60 } }}
                  onChange={event =>
                    setPeriodicityLabel(
                      event.target.value?.trim() ? event.target.value : null
                    )
                  }
                />
                <FormHelperText>
                  {t('memberplanForm.periodicityPricingLabelHelpText')}
                </FormHelperText>
              </Grid>
            </RowPaddingTop>
          </TabContent>
        </CardContent>
      </CardContent>
    </PanelWidth100>
  );
}
