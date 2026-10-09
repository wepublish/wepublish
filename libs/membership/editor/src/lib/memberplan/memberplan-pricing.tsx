import styled from '@emotion/styled';
import {
  FullAvailablePaymentMethodFragment,
  FullMemberPlanFragment,
  PaymentPeriodicity,
} from '@wepublish/editor/api';
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdPriceCheck } from 'react-icons/md';
import { Form, Input, Nav } from 'rsuite';
import {
  CurrencyInput,
  getMonthlyEquivalentRange,
  InfoTooltip,
  ListValue,
  PAYMENT_PERIODICITY_MONTHS,
} from '@wepublish/ui/editor';
import {
  Switch,
  FormControlLabel,
  Card as MuiCard,
  CardContent,
  CardHeader,
  Grid,
  Grid as MuiGrid,
} from '@mui/material';

const { HelpText } = Form;

const TAB_PERIODICITY_ORDER = [
  PaymentPeriodicity.Monthly,
  PaymentPeriodicity.Quarterly,
  PaymentPeriodicity.Biannual,
  PaymentPeriodicity.Yearly,
  PaymentPeriodicity.Biennial,
  PaymentPeriodicity.Lifetime,
];

type PeriodicityPriceValue = NonNullable<
  FullMemberPlanFragment['periodicityPricing']
>[number];

const PanelWidth100 = styled(MuiCard)`
  width: 100%;
`;

const ToggleCol = styled(MuiGrid)`
  text-align: end;
`;

// keeps the row height stable while switching between tabs
const ToggleColReserved = styled(ToggleCol)`
  visibility: hidden;
`;

const TabContent = styled('div')`
  padding-top: 12px;
`;

const RowPaddingTop = styled(MuiGrid)`
  padding-top: 12px;
`;

const ErrorHelpText = styled(HelpText)`
  color: var(--rs-state-error);
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
  memberPlan?: FullMemberPlanFragment | null;
  availablePaymentMethods: ListValue<FullAvailablePaymentMethodFragment>[];
  loading: boolean;
  setMemberPlan: Dispatch<
    SetStateAction<FullMemberPlanFragment | null | undefined>
  >;
}

export function MemberPlanPricing({
  memberPlan,
  availablePaymentMethods,
  loading,
  setMemberPlan,
}: MemberPlanPricingProps) {
  const { t } = useTranslation();
  const currency = memberPlan?.currency ?? 'CHF';
  const [activeTab, setActiveTab] = useState<PaymentPeriodicity | null>(null);

  const enabledPeriodicities = useMemo(() => {
    const enabled = new Set(
      availablePaymentMethods.flatMap(({ value }) => value.paymentPeriodicities)
    );

    return TAB_PERIODICITY_ORDER.filter(periodicity =>
      enabled.has(periodicity)
    );
  }, [availablePaymentMethods]);

  const monthlyEnabled = enabledPeriodicities.includes(
    PaymentPeriodicity.Monthly
  );

  const pricing = useMemo(
    () => memberPlan?.periodicityPricing ?? [],
    [memberPlan?.periodicityPricing]
  );

  useEffect(() => {
    if (!memberPlan) {
      return;
    }

    const toMaterialize = (
      monthlyEnabled ?
        [PaymentPeriodicity.Monthly]
      : enabledPeriodicities).filter(
      entryPeriodicity =>
        !pricing.some(
          p => p.periodicity === entryPeriodicity && p.amountMin != null
        )
    );

    if (!toMaterialize.length) {
      return;
    }

    const equivalent = getMonthlyEquivalentRange(pricing);
    const materialized: PeriodicityPriceValue[] = toMaterialize.map(
      entryPeriodicity => {
        const existing = pricing.find(p => p.periodicity === entryPeriodicity);
        const months = PAYMENT_PERIODICITY_MONTHS[entryPeriodicity];

        return {
          __typename: 'PeriodicityPrice',
          ...existing,
          periodicity: entryPeriodicity,
          label: existing?.label ?? null,
          amountMin: Math.round(equivalent.amountPerMonthMin * months),
          amountTarget:
            equivalent.amountPerMonthTarget != null ?
              Math.round(equivalent.amountPerMonthTarget * months)
            : null,
          amountMax:
            equivalent.amountPerMonthMax != null ?
              Math.round(equivalent.amountPerMonthMax * months)
            : null,
        };
      }
    );

    const untouched = pricing.filter(
      entry =>
        !materialized.some(
          replaced => replaced.periodicity === entry.periodicity
        )
    );

    setMemberPlan({
      ...memberPlan,
      periodicityPricing: [...untouched, ...materialized],
    });
  }, [
    monthlyEnabled,
    enabledPeriodicities,
    pricing,
    memberPlan,
    setMemberPlan,
  ]);

  const periodicity =
    activeTab && enabledPeriodicities.includes(activeTab) ?
      activeTab
    : enabledPeriodicities[0];

  function setPeriodicityPrice(
    price: Omit<PeriodicityPriceValue, 'periodicity'> | null
  ) {
    if (!memberPlan) {
      return;
    }

    const withoutPeriodicity = pricing.filter(
      p => p.periodicity !== periodicity
    );

    const isEmpty =
      !price ||
      (price.label == null &&
        price.amountMin == null &&
        price.amountTarget == null &&
        price.amountMax == null);

    setMemberPlan({
      ...memberPlan,
      periodicityPricing:
        !isEmpty ?
          [...withoutPeriodicity, { periodicity, ...price }]
        : withoutPeriodicity,
    });
  }

  if (!enabledPeriodicities.length) {
    return (
      <PanelWidth100>
        <CardContent>
          <CardHeader title={t('memberplanForm.periodicityPricing')} />

          <CardContent>
            <HelpText>
              {t('memberplanForm.periodicityPricingNoPeriodicities')}
            </HelpText>
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
          <HelpText>
            {t(
              monthlyEnabled ?
                'memberplanForm.periodicityPricingHelpText'
              : 'memberplanForm.periodicityPricingHelpTextNoMonthly'
            )}
          </HelpText>

          <Nav
            appearance="tabs"
            activeKey={periodicity}
            onSelect={eventKey => setActiveTab(eventKey as PaymentPeriodicity)}
          >
            {enabledPeriodicities.map(tabPeriodicity => (
              <Nav.Item
                key={tabPeriodicity}
                eventKey={tabPeriodicity}
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
              >
                {t(`memberPlanList.paymentPeriodicity.${tabPeriodicity}`)}
              </Nav.Item>
            ))}
          </Nav>

          <TabContent>
            {monthlyEnabled && (
              <Grid
                container
                spacing={2}
              >
                <Grid size={{ xs: 9 }}>
                  {delta != null && delta !== 0 && referenceDerived != null && (
                    <HelpText>
                      {t('memberplanForm.periodicityPricingDelta', {
                        delta: formatDelta(delta, referenceDerived, currency),
                      })}
                    </HelpText>
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
                <Form.ControlLabel>
                  {t(
                    isMonthlyTab ?
                      'memberPlanEdit.amountPerMonthMin'
                    : 'memberplanForm.periodicityPricingMin'
                  )}{' '}
                  <InfoTooltip
                    text={t('memberplanForm.periodicityPricingMinHelpText')}
                  />
                </Form.ControlLabel>
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
                <Form.ControlLabel>
                  {t(
                    isMonthlyTab ?
                      'memberplanForm.amountPerMonthTarget'
                    : 'memberplanForm.periodicityPricingTarget'
                  )}{' '}
                  <InfoTooltip
                    text={t('memberplanForm.periodicityPricingTargetHelpText')}
                  />
                </Form.ControlLabel>
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
                <Form.ControlLabel>
                  {t(
                    isMonthlyTab ?
                      'memberPlanEdit.amountPerMonthMax'
                    : 'memberplanForm.periodicityPricingMax'
                  )}{' '}
                  <InfoTooltip
                    text={t('memberplanForm.periodicityPricingMaxHelpText')}
                  />
                </Form.ControlLabel>
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
                <Form.ControlLabel>
                  {t('memberplanForm.periodicityPricingLabel')}
                </Form.ControlLabel>
                <Input
                  value={override?.label ?? ''}
                  disabled={loading}
                  maxLength={60}
                  onChange={value =>
                    setPeriodicityLabel(value?.trim() ? value : null)
                  }
                />
                <HelpText>
                  {t('memberplanForm.periodicityPricingLabelHelpText')}
                </HelpText>
              </Grid>
            </RowPaddingTop>
          </TabContent>
        </CardContent>
      </CardContent>
    </PanelWidth100>
  );
}
